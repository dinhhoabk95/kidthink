#!/usr/bin/env python3
"""
Persistent JSONL batch TTS worker for MindKid Teacher Voice Pipeline.
Loads ONNX models once in memory and processes thousands of utterances without
restarting Python. All logs/warnings go to stderr; stdout emits pure JSONL.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import logging
import os
import subprocess
import sys
import time
import urllib.request
import warnings
import wave
from pathlib import Path
from typing import Any

# Redirect warnings and noisy loggers to stderr so stdout stays strictly JSONL.
warnings.filterwarnings("ignore")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

CACHE_ROOT = Path(
    os.environ.get("MINDKID_TTS_CACHE_DIR", str(Path.home() / ".cache" / "mindkid-tts"))
)
MODELS_DIR = CACHE_ROOT / "models"

PIPER_MODEL_URLS: dict[str, tuple[str, str]] = {
    "piper-vais1000": (
        "vi_VN-vais1000-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
    ),
    "piper-25hours": (
        "vi_VN-25hours_single-low.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
    ),
}


def _download_if_missing(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and dest.stat().st_size > 1024:
        return
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    urllib.request.urlretrieve(url, str(tmp))
    tmp.replace(dest)


class WorkerState:
    def __init__(self, repo_root: Path) -> None:
        self.repo_root = repo_root
        self.piper_voices: dict[str, Any] = {}
        self.vieneu_nano: Any = None
        self.vieneu_clone_enrolled = False

    def ensure_piper(self, engine_id: str) -> tuple[Any, float]:
        if engine_id in self.piper_voices:
            return self.piper_voices[engine_id], 0.0
        t0 = time.perf_counter()
        filename, onnx_url = PIPER_MODEL_URLS[engine_id]
        onnx_path = MODELS_DIR / filename
        json_path = MODELS_DIR / f"{filename}.json"
        _download_if_missing(onnx_url, onnx_path)
        _download_if_missing(f"{onnx_url}.json", json_path)
        from piper.voice import PiperVoice

        voice = PiperVoice.load(str(onnx_path))
        self.piper_voices[engine_id] = voice
        return voice, (time.perf_counter() - t0) * 1000.0

    def ensure_vieneu_nano(self, with_clone: bool = False) -> tuple[Any, float]:
        warmup_ms = 0.0
        if self.vieneu_nano is None:
            t0 = time.perf_counter()
            from vieneu import Vieneu

            self.vieneu_nano = Vieneu(mode="v3nano")
            warmup_ms += (time.perf_counter() - t0) * 1000.0

        if with_clone and not self.vieneu_clone_enrolled:
            t1 = time.perf_counter()
            ref_wav = self._ensure_teacher_ref_wav()
            self.vieneu_nano.add_voice(
                "TiniMathTeacher",
                ref_audio=str(ref_wav),
                denoise=True,
                description="Giọng cô giáo mầm non TiniMath gốc",
                gender="female",
                save=False,
            )
            self.vieneu_clone_enrolled = True
            warmup_ms += (time.perf_counter() - t1) * 1000.0

        return self.vieneu_nano, warmup_ms

    def _ensure_teacher_ref_wav(self) -> Path:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        ref_wav = MODELS_DIR / "teacher_ref_24k.wav"
        if ref_wav.is_file() and ref_wav.stat().st_size > 8000:
            return ref_wav

        clip1 = (
            self.repo_root
            / "apps/web/public/audio/voice/d1/instruction/flash_memory_intro.mp3"
        )
        clip2 = (
            self.repo_root
            / "apps/web/public/audio/voice/d1/instruction/co_may_hinh_chon.mp3"
        )
        if not clip1.is_file():
            raise FileNotFoundError(f"Không tìm thấy mẫu giọng cô giáo gốc: {clip1}")

        ffmpeg_bin = "/usr/local/bin/ffmpeg" if Path("/usr/local/bin/ffmpeg").is_file() else "ffmpeg"
        if clip2.is_file():
            cmd = [
                ffmpeg_bin,
                "-y",
                "-i",
                str(clip1),
                "-i",
                str(clip2),
                "-filter_complex",
                "[0:a][1:a]concat=n=2:v=0:a=1,aresample=24000",
                "-ac",
                "1",
                str(ref_wav),
                "-loglevel",
                "error",
            ]
        else:
            cmd = [
                ffmpeg_bin,
                "-y",
                "-i",
                str(clip1),
                "-ar",
                "24000",
                "-ac",
                "1",
                str(ref_wav),
                "-loglevel",
                "error",
            ]
        subprocess.run(cmd, check=True)
        return ref_wav


async def _synthesize_edge_async(text: str, out_path: Path, rate: str | None) -> None:
    import edge_tts

    edge_text = text.strip()
    if edge_text and edge_text[-1] not in ".!?…":
        edge_text = f"{edge_text}."

    last_err: Exception | None = None
    backoff_schedule = (1.5, 3.0, 5.5, 8.5, 12.0, 16.0)
    for delay_sec in backoff_schedule:
        try:
            kwargs: dict[str, Any] = {"text": edge_text, "voice": "vi-VN-HoaiMyNeural"}
            if rate:
                kwargs["rate"] = rate
            comm = edge_tts.Communicate(**kwargs)
            await comm.save(str(out_path))
            if out_path.is_file() and out_path.stat().st_size > 256:
                await asyncio.sleep(0.55)
                return
        except Exception as exc:
            last_err = exc
            await asyncio.sleep(delay_sec)
    raise RuntimeError(f"edge-tts thất bại sau 6 lần thử: {last_err}")


def _synthesize_cloud_api(engine: str, text: str, out_path: Path) -> None:
    if engine == "elevenlabs":
        api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường ELEVENLABS_API_KEY")
        voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM").strip()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            data=json.dumps(
                {
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.65, "similarity_boost": 0.8},
                }
            ).encode("utf-8"),
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            out_path.write_bytes(resp.read())
        return

    if engine == "openai":
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường OPENAI_API_KEY")
        voice = os.environ.get("OPENAI_TTS_VOICE", "nova").strip()
        req = urllib.request.Request(
            "https://api.openai.com/v1/audio/speech",
            data=json.dumps(
                {
                    "model": "gpt-4o-mini-tts",
                    "voice": voice,
                    "input": text,
                    "instructions": "Giọng cô giáo mầm non Việt Nam dịu dàng, ấm áp, rõ chữ.",
                    "response_format": "wav",
                }
            ).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            out_path.write_bytes(resp.read())
        return

    if engine == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.5-flash-preview-tts:generateContent?key={api_key}"
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"Đọc với giọng cô giáo mầm non Việt Nam ấm áp, dịu dàng: {text}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Kore"}}
                },
            },
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        inline = body["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm_bytes = base64.b64decode(inline["data"])
        with wave.open(str(out_path), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(pcm_bytes)
        return

    raise ValueError(f"Engine không được hỗ trợ: {engine}")


def process_job(state: WorkerState, loop: asyncio.AbstractEventLoop, job: dict[str, Any]) -> dict[str, Any]:
    req_id = str(job.get("id", ""))
    engine = str(job.get("engine", ""))
    text = str(job.get("text", "")).strip()
    out_wav_path = Path(str(job.get("out_wav_path", "")))
    out_wav_path.parent.mkdir(parents=True, exist_ok=True)

    if not text:
        return {"id": req_id, "ok": False, "synth_ms": 0.0, "warmup_ms": 0.0, "error": "Chuỗi văn bản rỗng"}

    warmup_ms = 0.0
    try:
        if engine == "edge-hoaimy":
            t0 = time.perf_counter()
            loop.run_until_complete(_synthesize_edge_async(text, out_wav_path, None))
            synth_ms = (time.perf_counter() - t0) * 1000.0
        elif engine == "edge-hoaimy-teacher":
            t0 = time.perf_counter()
            loop.run_until_complete(_synthesize_edge_async(text, out_wav_path, "-8%"))
            synth_ms = (time.perf_counter() - t0) * 1000.0
        elif engine in ("piper-vais1000", "piper-25hours"):
            pv, warmup_ms = state.ensure_piper(engine)
            t0 = time.perf_counter()
            with wave.open(str(out_wav_path), "wb") as wf:
                pv.synthesize_wav(text, wf)
            synth_ms = (time.perf_counter() - t0) * 1000.0
        elif engine in ("vieneu-myduyen", "vieneu-trucly", "vieneu-teacher-clone"):
            is_clone = engine == "vieneu-teacher-clone"
            tts, warmup_ms = state.ensure_vieneu_nano(with_clone=is_clone)
            voice_name = (
                "TiniMathTeacher"
                if is_clone
                else ("Mỹ Duyên" if engine == "vieneu-myduyen" else "Trúc Ly")
            )
            t0 = time.perf_counter()
            audio = tts.infer(text, voice=voice_name, apply_watermark=False)
            tts.save(audio, str(out_wav_path))
            synth_ms = (time.perf_counter() - t0) * 1000.0
        else:
            t0 = time.perf_counter()
            _synthesize_cloud_api(engine, text, out_wav_path)
            synth_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "id": req_id,
            "ok": True,
            "synth_ms": round(synth_ms, 2),
            "warmup_ms": round(warmup_ms, 2),
            "out_path": str(out_wav_path),
        }
    except Exception as exc:
        return {
            "id": req_id,
            "ok": False,
            "synth_ms": 0.0,
            "warmup_ms": round(warmup_ms, 2),
            "error": f"{type(exc).__name__}: {exc}",
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="MindKid persistent JSONL TTS worker")
    parser.add_argument("--repo-root", required=True, help="Absolute path to MindKid repo root")
    parser.add_argument("--input-jsonl", default="", help="Optional input JSONL file instead of stdin")
    args = parser.parse_args()

    state = WorkerState(Path(args.repo_root).resolve())
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    real_stdout = sys.stdout
    sys.stdout = sys.stderr

    try:
        if args.input_jsonl:
            lines = Path(args.input_jsonl).read_text(encoding="utf-8").splitlines()
            for raw_line in lines:
                stripped = raw_line.strip()
                if not stripped:
                    continue
                job = json.loads(stripped)
                resp = process_job(state, loop, job)
                real_stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                real_stdout.flush()
        else:
            for raw_line in sys.stdin:
                stripped = raw_line.strip()
                if not stripped:
                    continue
                if stripped == "__EXIT__":
                    break
                job = json.loads(stripped)
                resp = process_job(state, loop, job)
                real_stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                real_stdout.flush()
    finally:
        loop.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
