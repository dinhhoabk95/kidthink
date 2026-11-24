import type {
  AuditionEngineReport,
  AuditionReportDocument,
} from "#src/voice/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEstimateLabel(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes.toFixed(1)} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const rem = Math.round(minutes % 60);
  return `~${hours} giờ ${rem} phút`;
}

function renderEngineSummaryCard(
  engine: AuditionEngineReport,
  catalogTotal: number
): string {
  if (!engine.available) {
    return `<div class="engine-card unavailable">
      <div class="badge warn">${escapeHtml(engine.badge_vi)}</div>
      <h3>${escapeHtml(engine.label_vi)}</h3>
      <p class="desc">${escapeHtml(engine.unavailable_reason ?? "Không khả dụng")}</p>
    </div>`;
  }

  return `<div class="engine-card">
    <div class="badge ${engine.is_offline ? "offline" : "online"}">${escapeHtml(engine.badge_vi)}</div>
    <h3>${escapeHtml(engine.label_vi)}</h3>
    <p class="desc">${escapeHtml(engine.description_vi)}</p>
    <div class="metrics">
      <div><span>Synth TB:</span> <strong>${Math.round(engine.avg_synth_ms)} ms/câu</strong></div>
      <div><span>Tổng TB (+FFmpeg):</span> <strong>${Math.round(engine.avg_total_ms)} ms/câu</strong></div>
      <div><span>Luồng song song:</span> <strong>x${engine.recommended_concurrency}</strong></div>
      <div><span>Ước tính ${catalogTotal.toLocaleString("vi-VN")} câu:</span> <strong class="highlight">${formatEstimateLabel(engine.estimated_catalog_minutes)}</strong></div>
    </div>
    <div class="cmd-box"><code>pnpm voice:generate --engine=${escapeHtml(engine.engine_id)} --concurrency=${engine.recommended_concurrency}</code></div>
    <button type="button" class="seq-btn" data-seq-engine="${escapeHtml(engine.engine_id)}">▶ Nghe trọn bộ 12 câu của giọng này</button>
  </div>`;
}

export function renderAuditionHtmlPage(report: AuditionReportDocument): string {
  const availableEngines = report.engines.filter((e) => e.available);
  const cardsHtml = report.engines
    .map((e) => renderEngineSummaryCard(e, report.catalog_total_entries))
    .join("\n");

  const rowsHtml = report.samples
    .map((sample) => {
      const buttonsHtml = availableEngines
        .map((engine) => {
          const clip = engine.clips.find((c) => c.sample_id === sample.id);
          if (!clip) {
            return `<span class="missing-clip">—</span>`;
          }
          const relSrc = `./${engine.engine_id}/${sample.id}.mp3`;
          const shortName =
            engine.label_vi.split("·")[1]?.trim() ?? engine.label_vi;
          return `<button type="button" class="play-btn" data-src="${escapeHtml(relSrc)}" data-engine="${escapeHtml(engine.engine_id)}" data-sample="${escapeHtml(sample.id)}">
            <span class="icon">▶</span>
            <span class="btn-meta">
              <strong>${escapeHtml(shortName)}</strong>
              <small>${clip.duration_sec.toFixed(1)}s · ${Math.round(clip.total_ms)}ms</small>
            </span>
          </button>`;
        })
        .join("\n");

      return `<tr>
        <td class="col-id">
          <span class="sample-code">${escapeHtml(sample.id)}</span>
          <span class="cat-pill">${escapeHtml(sample.category)}</span>
        </td>
        <td class="col-text">
          <div class="note">${escapeHtml(sample.note_vi)}</div>
          <div class="raw-text">${escapeHtml(sample.raw_text)}</div>
          <div class="spoken-script"><span>Kịch bản đọc:</span> ${escapeHtml(sample.spoken_script_vi)}</div>
        </td>
        <td class="col-players">
          <div class="player-row">${buttonsHtml}</div>
        </td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MindKid · Phòng Nghe Thử Giọng Cô Giáo Mầm Non (Pha 0 Audition)</title>
  <style>
    :root {
      --bg: #fdfaf5;
      --surface: #ffffff;
      --border: #e5dccb;
      --text: #1e293b;
      --muted: #64748b;
      --brand: #4f46e5;
      --brand-soft: #eef2ff;
      --cta: #ea580c;
      --cta-soft: #fff7ed;
      --ok: #15803d;
      --ok-soft: #f0fdf4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 20px 64px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
    }
    .container { max-width: 1360px; margin: 0 auto; }
    header {
      background: var(--surface);
      border: 3px solid var(--border);
      border-radius: 24px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 6px 0 var(--border);
    }
    h1 { margin: 0 0 8px; font-size: 1.65rem; color: #1e1b4b; }
    .meta-bar { display: flex; flex-wrap: wrap; gap: 16px; color: var(--muted); font-size: 0.95rem; }
    .engine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .engine-card {
      background: var(--surface);
      border: 3px solid var(--border);
      border-radius: 20px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 4px 0 var(--border);
    }
    .engine-card h3 { margin: 0; font-size: 1.08rem; color: #1e1b4b; }
    .engine-card .desc { margin: 0; font-size: 0.9rem; color: var(--muted); }
    .badge {
      align-self: flex-start;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .badge.offline { background: var(--ok-soft); color: var(--ok); border: 1px solid #bbf7d0; }
    .badge.online { background: var(--brand-soft); color: var(--brand); border: 1px solid #c7d2fe; }
    .badge.warn { background: #fef2f2; color: #b91c1c; }
    .metrics { font-size: 0.88rem; display: grid; gap: 4px; background: #f8fafc; padding: 10px 12px; border-radius: 12px; }
    .metrics .highlight { color: var(--cta); font-size: 0.96rem; }
    .cmd-box { background: #0f172a; color: #f8fafc; padding: 8px 10px; border-radius: 10px; font-size: 0.78rem; overflow-x: auto; }
    .seq-btn {
      margin-top: auto;
      padding: 10px 14px;
      border-radius: 12px;
      border: 2px solid var(--brand);
      background: var(--brand-soft);
      color: var(--brand);
      font-weight: 700;
      cursor: pointer;
    }
    .seq-btn:hover { background: var(--brand); color: #fff; }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: var(--surface);
      border: 3px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 6px 0 var(--border);
    }
    th, td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    th { background: #f8f4ec; font-size: 0.9rem; color: #334155; }
    tr:last-child td { border-bottom: none; }
    .col-id { width: 120px; }
    .col-text { width: 36%; }
    .sample-code { display: inline-block; font-weight: 800; font-size: 1rem; color: var(--brand); margin-bottom: 6px; }
    .cat-pill { display: block; font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 8px; width: fit-content; }
    .note { font-size: 0.82rem; color: var(--muted); margin-bottom: 4px; }
    .raw-text { font-weight: 700; font-size: 1.02rem; margin-bottom: 6px; color: #0f172a; }
    .spoken-script { font-size: 0.88rem; color: #334155; background: var(--cta-soft); border-left: 3px solid var(--cta); padding: 6px 10px; border-radius: 6px; }
    .spoken-script span { font-weight: 700; color: var(--cta); }
    .player-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .play-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 14px;
      border: 2px solid #cbd5e1;
      background: #fff;
      cursor: pointer;
      text-align: left;
      transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
    }
    .play-btn:hover { border-color: var(--brand); background: var(--brand-soft); }
    .play-btn.playing { border-color: var(--cta); background: var(--cta-soft); transform: translateY(-1px); }
    .play-btn .icon { font-size: 1rem; color: var(--brand); width: 18px; text-align: center; }
    .play-btn.playing .icon { color: var(--cta); }
    .btn-meta { display: flex; flex-direction: column; line-height: 1.25; }
    .btn-meta strong { font-size: 0.85rem; color: #1e293b; }
    .btn-meta small { font-size: 0.74rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎧 Phòng Nghe Thử Giọng Cô Giáo Mầm Non (Pha 0 · Voice Audition)</h1>
      <div class="meta-bar">
        <span><strong>Phần cứng đo thực tế:</strong> ${escapeHtml(report.hardware_summary)}</span>
        <span><strong>Tổng catalog toàn dự án:</strong> ${report.catalog_total_entries.toLocaleString("vi-VN")} câu duy nhất</span>
        <span><strong>Chuẩn âm thanh:</strong> MP3 44.1kHz · Mono · 64kbps · -16 LUFS · Fade 20ms/40ms</span>
        <span><strong>Tạo lúc:</strong> ${escapeHtml(report.generated_at)}</span>
      </div>
    </header>

    <section class="engine-grid">
      ${cardsHtml}
    </section>

    <table>
      <thead>
        <tr>
          <th>Mã & Nhóm</th>
          <th>Câu mẫu chuẩn mầm non & Kịch bản phát âm</th>
          <th>Bấm nghe & so sánh trực tiếp từng giọng đọc trên cùng câu</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <audio id="shared-audio" preload="none"></audio>
  <script>
    (function () {
      const audio = document.getElementById("shared-audio");
      let activeBtn = null;
      let seqQueue = [];

      function resetActive() {
        if (activeBtn) {
          activeBtn.classList.remove("playing");
          const icon = activeBtn.querySelector(".icon");
          if (icon) icon.textContent = "▶";
          activeBtn = null;
        }
      }

      function playButton(btn, onDone) {
        const src = btn.getAttribute("data-src");
        if (!src) return;
        if (activeBtn === btn && !audio.paused) {
          seqQueue = [];
          audio.pause();
          audio.currentTime = 0;
          resetActive();
          return;
        }
        resetActive();
        activeBtn = btn;
        btn.classList.add("playing");
        const icon = btn.querySelector(".icon");
        if (icon) icon.textContent = "⏸";
        audio.src = src;
        audio.onended = function () {
          resetActive();
          if (onDone) onDone();
        };
        audio.onerror = function () {
          resetActive();
          if (onDone) onDone();
        };
        audio.play().catch(function () {
          resetActive();
        });
      }

      document.querySelectorAll(".play-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          seqQueue = [];
          playButton(btn, null);
        });
      });

      function playNextInQueue() {
        if (seqQueue.length === 0) return;
        const nextBtn = seqQueue.shift();
        nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
        playButton(nextBtn, playNextInQueue);
      }

      document.querySelectorAll(".seq-btn").forEach(function (seqBtn) {
        seqBtn.addEventListener("click", function () {
          const engineId = seqBtn.getAttribute("data-seq-engine");
          seqQueue = Array.from(
            document.querySelectorAll('.play-btn[data-engine="' + engineId + '"]')
          );
          playNextInQueue();
        });
      });
    })();
  </script>
</body>
</html>
`;
}
