// Fixture: deliberately wrong. A literal fallback for a contract variable.
export const siteUrl = process.env.SITE_URL || "https://mindkid.vn";
export const signing = process.env.STORAGE_SIGNING_SECRET ?? "hardcoded-secret";
