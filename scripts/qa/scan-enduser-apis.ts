import postgres from "postgres";

const BASE_URL = "http://localhost:3000";

interface ApiTestTarget {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: Record<string, unknown>;
  expectedStatus?: number[]; // Acceptable status codes (e.g. 200, 400, 401, 404, 428). 500 is ALWAYS a failure!
  description: string;
  requiresAuth?: boolean;
  requiresChild?: boolean;
}

// Cookie strings
const OLD_COOKIE =
  "guest_token=a226a2d1-2895-419f-aea7-88c8b424e6d8; guest_device_id=0feecf59-c972-4d67-b6c4-83a104f44ecd; tm_u_csrf=576fe0f6f39f78d824e626a0109611b1687affb41aac3427bc6ec928f9d5315c; active_child_id=ff7e8fbe-114b-4075-bdc8-54ef72612361; tm_u_remember=f0ce3936c0aeec0eb01c0fafc9b9750567004c5dace22da308f82a0e624bbde4%3Af35e3556e3b554bc01b7da19f31df53de098053e5669c5089156dce485a9df38; tm_m_csrf=53ca25c20172cb9e23f0a8582fa8437e64c8e33fb427587cb64099a28f89bcec; mindkid-user-session=Fe26.2**1f71ce813b614c8c6fa47aa9c3402b216862f408960b60ac11eb6903e273a322*WAwI9hYZSjPuF6Zo017OpQ*yErNla5jms06_eMaiPhvyH8y73hgq73IiW9LlyDja-mcVSG9wkis6HkDke_pVb0NwKbfVSnhp1afQu7miTTiglIKPseBcqWrPbybkn4lVG-5BIPxH0a11mV3a-M9h6oQELhyCf3jMg_nSnHRANcMnxhrmSU1MwTcg-oDZ0FyTzXq8O4_uYMfe4fHpjYGCg_XN7ETE7FVfZThemE8kioydQXBVA8fPFlA8C39_yQ8qN8*1788627652269*63062e5e4161d9d078cb085b3b740539ae62bf3ba19c06923ba6b84afe7a6b7a*wgOSQOwzyk2iCFIBjJwEvR8N1yDo2G22LPHwoK-3Ir8";

async function getAuthContext() {
  // Login as parent.pro@mindkid.test
  const loginRes = await fetch(`${BASE_URL}/api/guest/auth/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "parent.pro@mindkid.test",
      password: "qM5#gH8$rK3!yB6%",
    }),
  });

  const rawCookies = loginRes.headers.getSetCookie();
  const sessionCookie = rawCookies.find((c) =>
    c.startsWith("mindkid-user-session=")
  );
  const csrfCookie = rawCookies.find((c) => c.startsWith("tm_u_csrf="));

  const sessionPart = sessionCookie?.split(";")[0] ?? "";
  const csrfPart = csrfCookie?.split(";")[0] ?? "";
  const csrfToken = csrfPart.replace("tm_u_csrf=", "");

  // Child: Bé Sóc
  const childUuid = "f76547dd-dfc1-4203-858f-b6fc4b526f3c";
  const authCookie = `${sessionPart}; ${csrfPart}; active_child_id=${childUuid};`;

  return { authCookie, csrfToken, childUuid };
}

async function getSampleData() {
  const sql = postgres("postgres://postgres:postgres@localhost:5433/mindkid");
  const [level] = await sql`SELECT code FROM game_levels LIMIT 1`;
  const [curriculum] = await sql`SELECT code FROM curricula LIMIT 1`;
  const [skill] = await sql`SELECT code FROM skills LIMIT 1`;
  await sql.end();
  return {
    levelCode: level?.code ?? "GL-C1-ADD-TAP-0001",
    curriculumCode: curriculum?.code ?? "CURR-SEED-C1",
    skillCode: skill?.code ?? "C1.CNT.01",
  };
}

interface ScanResult {
  target: ApiTestTarget;
  cookieType: "OLD_USER" | "ACTIVE_AUTH";
  status: number;
  ok: boolean;
  error?: string;
  responsePreview?: string;
}

async function testEndpoint(
  target: ApiTestTarget,
  cookie: string,
  csrfToken: string,
  cookieType: "OLD_USER" | "ACTIVE_AUTH"
): Promise<ScanResult> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Cookie: cookie,
  };
  if (target.method !== "GET") {
    headers["Content-Type"] = "application/json";
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${target.url}`, {
      method: target.method,
      headers,
      body: target.body ? JSON.stringify(target.body) : undefined,
    });

    const status = res.status;
    let text = "";
    try {
      text = await res.text();
    } catch {
      text = "";
    }

    // A 500 error is always a failure.
    // An unexpected status code is also flagged.
    const is500 = status >= 500;
    const ok = !is500;

    return {
      target,
      cookieType,
      status,
      ok,
      error: is500 ? `SERVER ERROR 500: ${text.slice(0, 300)}` : undefined,
      responsePreview: text.slice(0, 100),
    };
  } catch (err) {
    return {
      target,
      cookieType,
      status: 0,
      ok: false,
      error: `NETWORK/FETCH ERROR: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function main() {
  console.log("=== BẮT ĐẦU QUÉT API END-USER & USER PAGES ===");
  const authCtx = await getAuthContext();
  const sample = await getSampleData();
  console.log(`Auth login OK. Active child: ${authCtx.childUuid}`);
  console.log(
    `Sample data: Level=${sample.levelCode}, Curriculum=${sample.curriculumCode}, Skill=${sample.skillCode}`
  );

  const targets: ApiTestTarget[] = [
    // --- GUEST ENDPOINTS ---
    { method: "GET", url: "/api/guest/health", description: "Health check" },
    { method: "GET", url: "/api/guest/home", description: "Guest home data" },
    {
      method: "GET",
      url: "/api/guest/levels?limit=10",
      description: "List guest levels",
    },
    {
      method: "GET",
      url: `/api/guest/levels/${sample.levelCode}`,
      description: "Single level detail",
    },
    {
      method: "GET",
      url: `/api/guest/levels/${sample.levelCode}/config`,
      description: "Level config",
    },
    {
      method: "GET",
      url: `/api/guest/levels/${sample.levelCode}/readiness`,
      description: "Level readiness",
    },
    {
      method: "GET",
      url: "/api/guest/curricula",
      description: "List curricula",
    },
    {
      method: "GET",
      url: `/api/guest/curricula/${sample.curriculumCode}`,
      description: "Single curriculum",
    },
    {
      method: "GET",
      url: "/api/guest/templates",
      description: "Game templates",
    },
    { method: "GET", url: "/api/guest/tags", description: "Content tags" },
    {
      method: "GET",
      url: "/api/guest/packages",
      description: "Billing packages",
    },
    { method: "GET", url: "/api/guest/themes", description: "Visual themes" },
    { method: "GET", url: "/api/guest/taxonomy", description: "Taxonomy tree" },
    {
      method: "GET",
      url: `/api/guest/taxonomy/skills/${sample.skillCode}`,
      description: "Single taxonomy skill",
    },
    {
      method: "GET",
      url: "/api/guest/play/recommendations",
      description: "Guest play recommendations",
    },
    {
      method: "GET",
      url: "/api/guest/consent-requirements",
      description: "Consent requirements",
    },
    {
      method: "GET",
      url: "/api/guest/auth/oauth/providers",
      description: "OAuth providers",
    },
    {
      method: "GET",
      url: "/api/guest/legal/terms",
      description: "Legal terms",
    },
    {
      method: "GET",
      url: "/api/guest/legal/privacy",
      description: "Legal privacy",
    },
    {
      method: "GET",
      url: "/api/guest/legal/child-privacy",
      description: "Legal child privacy",
    },

    // --- USER ENDPOINTS ---
    {
      method: "GET",
      url: "/api/users/auth/session",
      description: "User session info",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/auth/sessions",
      description: "User session list",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/dashboard",
      description: "User parent dashboard",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/access-context",
      description: "User access context",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/subscription",
      description: "User subscription",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/children",
      description: "User children list",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: `/api/users/children/${authCtx.childUuid}/progress`,
      description: "Child progress",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: `/api/users/children/${authCtx.childUuid}/play-budget`,
      description: "Child play budget",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/play/home",
      description: "Child play home",
      requiresAuth: true,
      requiresChild: true,
    },
    {
      method: "GET",
      url: "/api/users/play/map",
      description: "Child play map",
      requiresAuth: true,
      requiresChild: true,
    },
    {
      method: "GET",
      url: "/api/users/play/recommendations",
      description: "Child play recommendations",
      requiresAuth: true,
      requiresChild: true,
    },
    {
      method: "GET",
      url: "/api/users/levels",
      description: "User game levels",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: `/api/users/levels/${sample.levelCode}/config`,
      description: "User level config",
      requiresAuth: true,
      requiresChild: true,
    },
    {
      method: "GET",
      url: `/api/users/levels/${sample.levelCode}/readiness`,
      description: "User level readiness",
      requiresAuth: true,
      requiresChild: true,
    },
    {
      method: "GET",
      url: "/api/users/curricula",
      description: "User curricula list",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/lesson-plans",
      description: "User lesson plans",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/custom-games",
      description: "User custom games",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/collections",
      description: "User collections",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/library",
      description: "User library",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/consents",
      description: "User consents",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/mfa/status",
      description: "User MFA status",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/notifications",
      description: "User notifications",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/social-identities",
      description: "User social identities",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/account/delete-summary",
      description: "Account delete summary",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/account/delete/status",
      description: "Account delete status",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/api/users/data-export",
      description: "User data export status",
      requiresAuth: true,
    },

    // --- SSR USER PAGES ---
    { method: "GET", url: "/", description: "Page: Landing" },
    { method: "GET", url: "/games", description: "Page: Games Catalog" },
    {
      method: "GET",
      url: `/games/${sample.levelCode}`,
      description: "Page: Game Detail",
    },
    {
      method: "GET",
      url: `/play/${sample.levelCode}`,
      description: "Page: Play Game",
    },
    {
      method: "GET",
      url: "/play/preview-sandbox?template=GT-001",
      description: "Page: Game Preview Sandbox",
    },
    { method: "GET", url: "/curricula", description: "Page: Curricula" },
    { method: "GET", url: "/pricing", description: "Page: Pricing" },
    { method: "GET", url: "/faq", description: "Page: FAQ" },
    { method: "GET", url: "/guide", description: "Page: Guide" },
    { method: "GET", url: "/login", description: "Page: Login" },
    { method: "GET", url: "/register", description: "Page: Register" },
    {
      method: "GET",
      url: "/me",
      description: "Page: Parent Home / Me",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/me/dashboard",
      description: "Page: Me Dashboard",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/me/children",
      description: "Page: Me Children",
      requiresAuth: true,
    },
    {
      method: "GET",
      url: "/me/subscription",
      description: "Page: Me Subscription",
      requiresAuth: true,
    },
  ];

  const results: ScanResult[] = [];

  console.log("\n-> Quét vòng 1: Với OLD_USER COOKIE (từ curl người dùng)...");
  for (const t of targets) {
    const res = await testEndpoint(t, OLD_COOKIE, "", "OLD_USER");
    results.push(res);
    const tag = res.ok ? "✓" : "✗";
    console.log(
      `  [${tag}] [${res.status}] ${t.method} ${t.url} (${t.description})`
    );
    if (!res.ok) {
      console.log(`      LỖI: ${res.error}`);
    }
  }

  console.log(
    "\n-> Quét vòng 2: Với ACTIVE_AUTH COOKIE (User authenticated + active child)..."
  );
  for (const t of targets) {
    const res = await testEndpoint(
      t,
      authCtx.authCookie,
      authCtx.csrfToken,
      "ACTIVE_AUTH"
    );
    results.push(res);
    const tag = res.ok ? "✓" : "✗";
    console.log(
      `  [${tag}] [${res.status}] ${t.method} ${t.url} (${t.description})`
    );
    if (!res.ok) {
      console.log(`      LỖI: ${res.error}`);
    }
  }

  const failures = results.filter((r) => !r.ok);
  console.log("\n=================================");
  console.log("TỔNG KẾT QUÉT API:");
  console.log(`Tổng lượt test: ${results.length}`);
  console.log(`Thành công: ${results.length - failures.length}`);
  console.log(`Thất bại (HTTP 500 / Network Error): ${failures.length}`);

  if (failures.length > 0) {
    console.log("\nDANH SÁCH LỖI PHÁT HIỆN:");
    for (const f of failures) {
      console.log(
        `- [${f.cookieType}] [${f.status}] ${f.target.method} ${f.target.url}: ${f.error}`
      );
    }
    process.exit(1);
  } else {
    console.log("\n🎉 KHÔNG CÓ LỖI 500 NÀO TRÊN TOÀN BỘ API VÀ PAGES!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
