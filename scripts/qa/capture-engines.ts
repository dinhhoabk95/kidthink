/**
 * qa:capture — chụp thật 36 game engine qua trình duyệt thật.
 *
 * Task #203. Lý do tồn tại: vẽ là vùng mù duy nhất của kho này. `vitest` chạy
 * `environment: "node"`, không có DOM, và không test nào chạm `setupCanvas` hay
 * `render()`. Nên mọi lỗi hình học lọt qua toàn bộ cổng.
 *
 * Đường chụp là `/play/preview-sandbox?template=GT-0XX`: không DB, không auth,
 * không khoá `access_tier`. Nội dung thật lấy từ Postgres rồi bơm vào bằng
 * `postMessage` — đúng cách `apps/admin/.../studio/live-preview-frame.vue` làm.
 * Dùng `/play/:code` thì chỉ 28/36 khuôn chụp được khi chưa đăng nhập.
 *
 * Ngoài ảnh, script ghi lại **ma trận transform thật của canvas**. Đó là bằng
 * chứng bằng số cho `BR-ENG` §7.1 ("logic cố định 960×540"), không phải nhìn mắt.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireEnv } from "@mindkid/config";
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  chromium,
  type Page,
} from "playwright";
import postgres from "postgres";

const LOGIC_WIDTH = 960;
const LOGIC_HEIGHT = 540;

/** Ba mốc nằm trong dãy 375 / 768 / 1024 / 1440 của accessibility.md §7.3. */
const VIEWPORTS = [
  { height: 844, name: "mobile-390x844", width: 390 },
  { height: 1180, name: "tablet-820x1180", width: 820 },
  { height: 900, name: "desktop-1440x900", width: 1440 },
] as const;

type Viewport = (typeof VIEWPORTS)[number];

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const RENDER_SETTLE_MS = 900;

interface LevelRow {
  age_band: string;
  code: string;
  content_pack: Record<string, unknown>;
  difficulty_params: Record<string, unknown>;
  template_code: string;
  theme_id: string | null;
}

interface CanvasProbe {
  backingHeight: number;
  backingWidth: number;
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  /** ctx.getTransform() — [a,b,c,d,e,f] */
  transform: number[];
}

interface CaptureRecord {
  ageBand: string;
  canvas: CanvasProbe | null;
  consoleErrors: string[];
  engineError: string | null;
  levelCode: string;
  pageErrors: string[];
  screenshot: string;
  templateCode: string;
  /** Chẩn đoán suy ra từ `canvas`, không phải suy đoán. */
  verdict: string;
  viewport: string;
  visibleErrorText: string | null;
}

/** Một level đại diện cho mỗi khuôn: ưu tiên `free` để vòng sau chụp `/play/:code` được. */
async function loadRepresentativeLevels(
  sql: postgres.Sql
): Promise<LevelRow[]> {
  return (await sql`
    SELECT DISTINCT ON (t.code)
      t.code            AS template_code,
      l.code            AS code,
      l.content_pack    AS content_pack,
      l.difficulty_params AS difficulty_params,
      l.theme_id        AS theme_id,
      l.age_min || '-' || l.age_max AS age_band
    FROM game_templates t
    JOIN game_levels l ON l.template_id = t.id
    WHERE l.status = 'published'
    ORDER BY t.code, (l.access_tier <> 'free'), l.code
  `) as unknown as LevelRow[];
}

/**
 * Đọc trạng thái hình học thật của canvas trong trang.
 *
 * `getTransform()` là thứ quyết định pixel rơi ở đâu. So nó với DPR và kích
 * thước hộp là biết ngay engine có đưa toạ độ logic về đúng không gian không.
 */
async function probeCanvas(
  page: import("playwright").Page
): Promise<CanvasProbe | null> {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const m = ctx?.getTransform();
    return {
      backingHeight: canvas.height,
      backingWidth: canvas.width,
      cssHeight: rect.height,
      cssWidth: rect.width,
      devicePixelRatio: window.devicePixelRatio,
      transform: m ? [m.a, m.b, m.c, m.d, m.e, m.f] : [],
    };
  });
}

/**
 * Cảnh vẽ ở toạ độ logic 960×540 phải lấp đúng hộp canvas.
 * Suy ra vùng thật mà nội dung chiếm, từ transform, rồi so với hộp.
 */
function judge(probe: CanvasProbe | null): string {
  if (!probe) {
    return "KHÔNG THẤY CANVAS";
  }
  const [a, , , d] = probe.transform;
  if (a === undefined || d === undefined || a === 0 || d === 0) {
    return "TRANSFORM RỖNG";
  }
  // 300x150 là kích thước mặc định của thẻ canvas. Gặp nó nghĩa là
  // `setupCanvas` chưa từng chạy — engine chết trước `start()`. Cấm — NEVER
  // đọc số hình học từ trạng thái này: nó không nói gì về đường vẽ.
  if (probe.backingWidth === 300 && probe.backingHeight === 150) {
    return "ENGINE CHƯA CHẠY — canvas còn kích thước mặc định";
  }
  const drawnW = (LOGIC_WIDTH * a) / probe.devicePixelRatio;
  const drawnH = (LOGIC_HEIGHT * d) / probe.devicePixelRatio;
  const fillW = drawnW / probe.cssWidth;
  const fillH = drawnH / probe.cssHeight;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  if (fillW > 1.02 || fillH > 1.02) {
    return `CẮT — cảnh logic tràn ra ngoài hộp (${pct(fillW)}×${pct(fillH)})`;
  }
  if (fillW < 0.98 && fillH < 0.98) {
    return `KHÔNG LẤP — cảnh chỉ chiếm ${pct(fillW)}×${pct(fillH)} hộp`;
  }
  return `ĐẠT — cảnh lấp ${pct(fillW)}×${pct(fillH)} hộp`;
}

interface PageCaptureState {
  consoleErrors: string[];
  pageErrors: string[];
  engineError: string | null;
}

async function setupPageForViewport(
  context: BrowserContext,
  initialLevel: LevelRow,
  viewport: Viewport
): Promise<{ page: Page; state: PageCaptureState }> {
  const page = await context.newPage();
  const state: PageCaptureState = {
    consoleErrors: [],
    pageErrors: [],
    engineError: null,
  };

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      state.consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err: Error) => state.pageErrors.push(err.message));
  await page.exposeFunction("__qaEngineError", (message: string) => {
    state.engineError = message;
  });

  const url = `${BASE_URL}/play/preview-sandbox?template=${initialLevel.template_code}`;
  let navigated = false;
  for (let attempt = 1; attempt <= 3 && !navigated; attempt++) {
    try {
      await page.goto(url, {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      });
      navigated = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `  nạp trang trượt lần ${attempt}/3 (${viewport.name}): ${message.split("\n")[0]}\n`
      );
      await page.waitForTimeout(3000);
    }
  }
  if (!navigated) {
    throw new Error(`Không nạp được ${url} sau 3 lần thử.`);
  }

  await page.evaluate(() => {
    window.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { error?: string; type?: string };
      if (data?.type === "MindKid_STUDIO_ENGINE_ERROR") {
        (
          window as unknown as { __qaEngineError: (m: string) => void }
        ).__qaEngineError(data.error ?? "unknown");
      }
    });
  });
  await page.waitForSelector("canvas", { timeout: 30_000 });

  return { page, state };
}

async function captureSingleLevel(
  page: Page,
  level: LevelRow,
  viewport: Viewport,
  outDir: string,
  state: PageCaptureState
): Promise<CaptureRecord> {
  state.consoleErrors = [];
  state.pageErrors = [];
  state.engineError = null;
  const shotName = `${level.template_code}-${viewport.name}.png`;

  try {
    const accepted = await page.evaluate(
      async (payload: {
        ageBand: string;
        levelData: {
          age_band: string;
          code: string;
          content_pack: Record<string, unknown>;
          difficulty_params: Record<string, unknown>;
          theme_id: string;
        };
        muted: boolean;
        reducedMotion: boolean;
        templateCode: string;
      }) => {
        const canvas = document.querySelector("canvas");
        if (canvas) {
          canvas.width = 300;
          canvas.height = 150;
        }
        const deadline = Date.now() + 12_000;
        while (Date.now() < deadline) {
          window.postMessage({ payload, type: "MindKid_STUDIO_UPDATE" }, "*");
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (canvas && !(canvas.width === 300 && canvas.height === 150)) {
            return true;
          }
        }
        return false;
      },
      {
        ageBand: level.age_band,
        levelData: {
          age_band: level.age_band,
          code: level.code,
          content_pack: level.content_pack,
          difficulty_params: level.difficulty_params,
          theme_id: level.theme_id ?? "nature",
        },
        muted: true,
        reducedMotion: false,
        templateCode: level.template_code,
      }
    );

    if (accepted) {
      state.engineError = null;
    }
    await page.waitForTimeout(RENDER_SETTLE_MS);

    const probe = await probeCanvas(page);
    const visibleErrorText = await page
      .locator(".error-state")
      .first()
      .textContent()
      .catch(() => null);

    await page
      .locator("canvas")
      .first()
      .screenshot({ path: join(outDir, shotName) });

    const verdict = accepted
      ? judge(probe)
      : "ENGINE TỪ CHỐI KHUÔN — không nhận nội dung trong 12s";

    process.stdout.write(
      `${level.template_code} ${viewport.name}  ${verdict}\n`
    );

    return {
      ageBand: level.age_band,
      canvas: probe,
      consoleErrors: state.consoleErrors,
      engineError: state.engineError,
      levelCode: level.code,
      pageErrors: state.pageErrors,
      screenshot: shotName,
      templateCode: level.template_code,
      verdict,
      viewport: viewport.name,
      visibleErrorText: visibleErrorText?.trim() || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(
      `${level.template_code} ${viewport.name}  HỎNG: ${message}\n`
    );
    return {
      ageBand: level.age_band,
      canvas: null,
      consoleErrors: state.consoleErrors,
      engineError: state.engineError,
      levelCode: level.code,
      pageErrors: [...state.pageErrors, message],
      screenshot: shotName,
      templateCode: level.template_code,
      verdict: "HỎNG KHI CHỤP",
      viewport: viewport.name,
      visibleErrorText: null,
    };
  }
}

async function captureViewport(
  browser: Browser,
  levels: LevelRow[],
  viewport: Viewport,
  outDir: string
): Promise<CaptureRecord[]> {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: viewport.height, width: viewport.width },
  });

  const first = levels[0];
  if (!first) {
    throw new Error("Danh sách khuôn rỗng.");
  }

  const { page, state } = await setupPageForViewport(context, first, viewport);
  const records: CaptureRecord[] = [];

  for (const level of levels) {
    const record = await captureSingleLevel(
      page,
      level,
      viewport,
      outDir,
      state
    );
    records.push(record);
  }

  await page.close();
  await context.close();
  return records;
}

async function main(): Promise<void> {
  const sql = postgres(requireEnv("DATABASE_URL"), { max: 2 });
  const all = await loadRepresentativeLevels(sql);
  await sql.end();

  const only = process.env.QA_ONLY?.split(",").map((s) => s.trim());
  const levels = only?.length
    ? all.filter((l) => only.includes(l.template_code))
    : all;

  if (levels.length === 0) {
    throw new Error(
      "Không có level published nào — chạy `pnpm db:seed` trước."
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const outDir = join(process.cwd(), "docs/qa/engine-captures", stamp);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const records: CaptureRecord[] = [];

  for (const viewport of VIEWPORTS) {
    const vRecords = await captureViewport(browser, levels, viewport, outDir);
    records.push(...vRecords);
  }

  await browser.close();

  writeFileSync(
    join(outDir, "report.json"),
    `${JSON.stringify({ baseUrl: BASE_URL, records, stamp }, null, 2)}\n`,
    "utf-8"
  );

  const bad = records.filter((r) => !r.verdict.startsWith("ĐẠT"));
  process.stdout.write(
    `\n${records.length} ảnh vào ${outDir}\n${bad.length} khung không đạt hình học\n`
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
