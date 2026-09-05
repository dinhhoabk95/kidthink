/**
 * scripts/qa/test-game-templates.ts
 *
 * Kiểm thử tự động UI/UX và runtime của 37 game templates (GT-000 đến GT-036).
 * Mỗi template lấy 1–2 level thực tế từ PostgreSQL game_levels.
 * Nạp vào /play/preview-sandbox qua postMessage (MindKid_STUDIO_UPDATE).
 * Kiểm tra:
 * - Canvas render, 960x540 logic space
 * - Transform matrix & fill percentage
 * - Engine error, console error, page error, visible error
 * - Tương tác cơ bản (tap/click) không gây crash
 */

import { requireEnv } from "@mindkid/config";
import { chromium, type Page } from "playwright";
import postgres from "postgres";

const LOGIC_WIDTH = 960;
const LOGIC_HEIGHT = 540;
const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";

interface LevelRow {
  template_code: string;
  code: string;
  content_pack: Record<string, unknown>;
  difficulty_params: Record<string, unknown>;
  theme_id: string | null;
  age_band: string;
}

interface CanvasProbe {
  backingHeight: number;
  backingWidth: number;
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  transform: number[];
}

interface TemplateTestResult {
  templateCode: string;
  levelCode: string;
  ageBand: string;
  verdict: string;
  ok: boolean;
  errors: string[];
  canvasProbe?: CanvasProbe | null;
}

async function loadLevelsPerTemplate(
  sql: postgres.Sql
): Promise<Map<string, LevelRow[]>> {
  // Lấy 2 level cho mỗi template code
  const rows = (await sql`
    WITH ranked_levels AS (
      SELECT
        l.template_code,
        l.code,
        l.content_pack,
        l.difficulty_params,
        l.theme_id,
        l.age_min || '-' || l.age_max AS age_band,
        ROW_NUMBER() OVER(
          PARTITION BY l.template_code
          ORDER BY (l.access_tier <> 'free'), l.difficulty_params->>'difficulty_level', l.code
        ) as rn
      FROM game_levels l
      WHERE l.status = 'published'
    )
    SELECT
      template_code,
      code,
      content_pack,
      difficulty_params,
      theme_id,
      age_band
    FROM ranked_levels
    WHERE rn <= 2
    ORDER BY template_code, code
  `) as unknown as LevelRow[];

  const map = new Map<string, LevelRow[]>();
  for (const r of rows) {
    const list = map.get(r.template_code) ?? [];
    list.push(r);
    map.set(r.template_code, list);
  }
  return map;
}

function judgeCanvas(probe: CanvasProbe | null): {
  verdict: string;
  ok: boolean;
} {
  if (!probe) {
    return { verdict: "KHÔNG THẤY CANVAS", ok: false };
  }
  const [a, , , d] = probe.transform;
  if (a === undefined || d === undefined || a === 0 || d === 0) {
    return { verdict: "TRANSFORM RỖNG", ok: false };
  }
  if (probe.backingWidth === 300 && probe.backingHeight === 150) {
    return { verdict: "ENGINE CHƯA KHỞI CHẠY (canvas 300x150)", ok: false };
  }
  const drawnW = (LOGIC_WIDTH * a) / probe.devicePixelRatio;
  const drawnH = (LOGIC_HEIGHT * d) / probe.devicePixelRatio;
  const fillW = drawnW / probe.cssWidth;
  const fillH = drawnH / probe.cssHeight;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  if (fillW > 1.05 || fillH > 1.05) {
    return {
      verdict: `CẮT — Tràn ngoài (${pct(fillW)}×${pct(fillH)})`,
      ok: false,
    };
  }
  if (fillW < 0.95 && fillH < 0.95) {
    return {
      verdict: `KHÔNG LẤP — Chỉ chiếm (${pct(fillW)}×${pct(fillH)})`,
      ok: false,
    };
  }
  return { verdict: `ĐẠT — Lấp ${pct(fillW)}×${pct(fillH)}`, ok: true };
}

async function probePageCanvas(page: Page): Promise<CanvasProbe | null> {
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

async function testSingleLevel(
  page: Page,
  level: LevelRow
): Promise<TemplateTestResult> {
  const errors: string[] = [];
  const engineError: string | null = null;

  const onConsole = (msg: import("playwright").ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  };
  const onPageError = (err: Error) => {
    errors.push(`[pageerror] ${err.message}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    const payload = {
      templateCode: level.template_code,
      ageBand: level.age_band,
      levelData: {
        code: level.code,
        age_band: level.age_band,
        content_pack: level.content_pack,
        difficulty_params: level.difficulty_params,
        theme_id: level.theme_id ?? "default",
      },
      muted: true,
      reducedMotion: false,
    };

    const accepted = (await page.evaluate((p: typeof payload) => {
      return new Promise<{ accepted: boolean; error: string | null }>(
        (resolve) => {
          let timer: ReturnType<typeof setTimeout> | null = null;

          function done(accepted: boolean, error: string | null) {
            window.removeEventListener("message", onMessage);
            if (timer) {
              clearTimeout(timer);
            }
            resolve({ accepted, error });
          }

          function onMessage(ev: MessageEvent) {
            const type = ev.data?.type;
            if (type === "MindKid_STUDIO_SESSION_LOADED") {
              done(true, null);
            } else if (type === "MindKid_STUDIO_ENGINE_ERROR") {
              done(false, ev.data?.error || "Engine error");
            }
          }

          window.addEventListener("message", onMessage);
          window.postMessage(
            { payload: p, type: "MindKid_STUDIO_UPDATE" },
            "*"
          );

          timer = setTimeout(() => {
            done(false, "Timeout waiting for engine load (5s)");
          }, 5000);
        }
      );
    }, payload)) as { accepted: boolean; error: string | null };

    if (!accepted.accepted) {
      errors.push(`Engine reject: ${accepted.error}`);
    }

    // Đợi 100ms cho frame đầu render
    await page.waitForTimeout(100);

    // Thử tương tác tap/click vào tâm canvas để kích hoạt interaction handler
    await page
      .locator("canvas")
      .click({ position: { x: 400, y: 300 }, timeout: 1000, force: true })
      .catch(() => {
        /* Intentionally ignore tap failures during probe */
      });
    await page.waitForTimeout(50);

    const probe = await probePageCanvas(page);
    const visibleErrorText = (await page.evaluate(() => {
      const el = document.querySelector(".error-state");
      return el ? el.textContent : null;
    })) as string | null;

    if (visibleErrorText?.trim()) {
      errors.push(`Visible error: ${visibleErrorText.trim()}`);
    }

    const { verdict, ok } = judgeCanvas(probe);
    const finalOk = ok && errors.length === 0 && !engineError;

    return {
      templateCode: level.template_code,
      levelCode: level.code,
      ageBand: level.age_band,
      verdict:
        errors.length > 0 ? `${verdict} (Có ${errors.length} lỗi)` : verdict,
      ok: finalOk,
      errors,
      canvasProbe: probe,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return {
      templateCode: level.template_code,
      levelCode: level.code,
      ageBand: level.age_band,
      verdict: `CRASH: ${msg}`,
      ok: false,
      errors,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

function logLevelResult(res: TemplateTestResult): void {
  const mark = res.ok ? "✓" : "✗";
  console.log(
    `  [${mark}] ${res.templateCode} | Level ${res.levelCode} (${res.ageBand}): ${res.verdict}`
  );
  for (const e of res.errors) {
    console.log(`      Lỗi: ${e}`);
  }
}

async function runTemplateLevels(
  page: Page,
  levelsMap: Map<string, LevelRow[]>,
  onlyTemplates?: string[]
): Promise<TemplateTestResult[]> {
  const results: TemplateTestResult[] = [];
  for (const [tCode, levels] of levelsMap.entries()) {
    if (onlyTemplates && !onlyTemplates.includes(tCode)) {
      continue;
    }

    console.log(`--- Kiểm thử Template ${tCode} (${levels.length} level) ---`);
    for (const level of levels) {
      const res = await testSingleLevel(page, level);
      results.push(res);
      logLevelResult(res);
    }
  }
  return results;
}

function printSummary(results: readonly TemplateTestResult[]): void {
  const failed = results.filter((r) => !r.ok);
  console.log("\n=================================");
  console.log("TỔNG KẾT TEST GAME TEMPLATES:");
  console.log(`Tổng số level kiểm thử: ${results.length}`);
  console.log(`Thành công (ĐẠT): ${results.length - failed.length}`);
  console.log(`Thất bại: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nCHI TIẾT LỖI:");
    for (const f of failed) {
      console.log(`- ${f.templateCode} (${f.levelCode}): ${f.verdict}`);
      for (const e of f.errors) {
        console.log(`    ${e}`);
      }
    }
    process.exit(1);
  } else {
    console.log(
      "\n🎉 TOÀN BỘ GAME TEMPLATES ĐÃ VƯỢT QUA TEST UI/UX VÀ RUNTIME!"
    );
  }
}

async function main() {
  console.log("=== BẮT ĐẦU TEST UI/UX & RUNTIME 37 GAME TEMPLATES ===");
  const sql = postgres(requireEnv("DATABASE_URL"), { max: 2 });
  const levelsMap = await loadLevelsPerTemplate(sql);
  await sql.end();

  console.log(`Tìm thấy level cho ${levelsMap.size} game templates.`);

  const browser = await chromium.launch();
  // Viewport tablet chuẩn 820x1180
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
  });
  await context.addInitScript("window.__name = (fn) => fn;");

  const page = await context.newPage();
  console.log(`Đang nạp sandbox tại ${BASE_URL}/play/preview-sandbox...`);
  await page.goto(`${BASE_URL}/play/preview-sandbox?template=GT-000`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForFunction(
    () =>
      (window as Window & { __mindkidSandboxReady?: boolean })
        .__mindkidSandboxReady === true,
    { timeout: 15_000 }
  );
  console.log("Sandbox sẵn sàng.\n");

  const onlyTemplates = process.env.TEST_TEMPLATES?.split(",").map((s) =>
    s.trim()
  );
  const results = await runTemplateLevels(page, levelsMap, onlyTemplates);

  await page.close();
  await context.close();
  await browser.close();

  printSummary(results);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
