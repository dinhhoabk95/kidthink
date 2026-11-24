import {
  type ChildProcessWithoutNullStreams,
  execFileSync,
  spawn,
} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { REPO_ROOT, repoPath } from "@mindkid/config/paths";
import { z } from "zod";
import type {
  PythonWorkerJobRequest,
  PythonWorkerJobResponse,
  VoiceEngineId,
} from "#src/voice/types";

const WorkerResponseSchema = z.object({
  id: z.string(),
  ok: z.boolean(),
  synth_ms: z.number(),
  warmup_ms: z.number(),
  out_path: z.string().optional(),
  error: z.string().optional(),
});

export function resolveTtsCacheDir(): string {
  return (
    process.env.MINDKID_TTS_CACHE_DIR ??
    path.join(os.homedir(), ".cache", "mindkid-tts")
  );
}

export function resolveTtsVenvPythonPath(): string {
  return path.join(resolveTtsCacheDir(), "venv", "bin", "python");
}

function resolveUvBinaryPath(): string {
  const localUv = path.join(os.homedir(), ".local", "bin", "uv");
  return fs.existsSync(localUv) ? localUv : "uv";
}

export function ensureIsolatedTtsVenv(): string {
  const pythonBin = resolveTtsVenvPythonPath();
  if (fs.existsSync(pythonBin)) {
    return pythonBin;
  }

  const uvBin = resolveUvBinaryPath();
  const venvDir = path.join(resolveTtsCacheDir(), "venv");
  fs.mkdirSync(path.dirname(venvDir), { recursive: true });

  execFileSync(
    uvBin,
    ["venv", "--python", "3.11", venvDir, "--allow-existing"],
    {
      stdio: "inherit",
    }
  );
  execFileSync(
    uvBin,
    [
      "pip",
      "install",
      "--only-binary",
      ":all:",
      "--python",
      pythonBin,
      "edge-tts",
      "piper-tts",
      "gTTS",
      "vieneu",
    ],
    { stdio: "inherit" }
  );

  return pythonBin;
}

interface PendingResolver {
  readonly resolve: (res: PythonWorkerJobResponse) => void;
  readonly reject: (err: Error) => void;
}

export class PersistentPythonTtsWorker {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private readonly pending = new Map<string, PendingResolver>();
  private stderrTail = "";
  private readonly pythonBin: string;
  private readonly workerScriptPath: string;

  constructor(pythonBin?: string) {
    this.pythonBin = pythonBin ?? ensureIsolatedTtsVenv();
    this.workerScriptPath = repoPath(
      "packages/content-build/src/voice/python/tts_worker.py"
    );
  }

  private ensureStarted(): ChildProcessWithoutNullStreams {
    if (this.proc) {
      return this.proc;
    }

    const child = spawn(
      this.pythonBin,
      [this.workerScriptPath, "--repo-root", REPO_ROOT],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          HF_HUB_DISABLE_PROGRESS_BARS: "1",
        },
      }
    );

    const rl = readline.createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("{")) {
        return;
      }
      const parsed = WorkerResponseSchema.safeParse(JSON.parse(trimmed));
      if (!parsed.success) {
        return;
      }
      const entry = this.pending.get(parsed.data.id);
      if (entry) {
        this.pending.delete(parsed.data.id);
        entry.resolve(parsed.data);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      this.stderrTail = (this.stderrTail + chunk.toString("utf8")).slice(-4000);
    });

    child.on("exit", (code) => {
      this.proc = null;
      const err = new Error(
        `Python TTS worker thoát bất ngờ (code=${String(code)}): ${this.stderrTail}`
      );
      for (const [key, waiter] of this.pending.entries()) {
        this.pending.delete(key);
        waiter.reject(err);
      }
    });

    this.proc = child;
    return child;
  }

  synthesize(job: PythonWorkerJobRequest): Promise<PythonWorkerJobResponse> {
    const child = this.ensureStarted();
    return new Promise<PythonWorkerJobResponse>((resolve, reject) => {
      this.pending.set(job.id, { resolve, reject });
      child.stdin.write(`${JSON.stringify(job)}\n`, "utf8", (writeErr) => {
        if (writeErr) {
          this.pending.delete(job.id);
          reject(writeErr);
        }
      });
    });
  }

  async close(): Promise<void> {
    const child = this.proc;
    if (!child) {
      return;
    }
    this.proc = null;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 2000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      child.stdin.write("__EXIT__\n");
      child.stdin.end();
    });
  }
}

export class PythonTtsWorkerPool {
  private readonly workers: PersistentPythonTtsWorker[];
  private cursor = 0;

  constructor(concurrency: number, pythonBin?: string) {
    const resolvedPython = pythonBin ?? ensureIsolatedTtsVenv();
    const count = Math.max(1, Math.min(8, Math.trunc(concurrency)));
    this.workers = Array.from(
      { length: count },
      () => new PersistentPythonTtsWorker(resolvedPython)
    );
  }

  synthesize(
    id: string,
    engine: VoiceEngineId,
    text: string,
    outWavPath: string
  ): Promise<PythonWorkerJobResponse> {
    const worker = this.workers[this.cursor % this.workers.length];
    this.cursor += 1;
    if (!worker) {
      throw new Error("Không có Python TTS worker khả dụng trong pool");
    }
    return worker.synthesize({
      id,
      engine,
      text,
      out_wav_path: outWavPath,
    });
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
  }
}
