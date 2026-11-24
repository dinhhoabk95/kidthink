/**
 * Cloudflare Workers Assets đọc `_headers`: một dòng quá 2000 ký tự bị wrangler bỏ qua
 * ("invalid header rules"). `nuxt-security` gom hash SRI của mọi script vào CSP của trang
 * prerender nên dòng CSP dài ~2,3 KB. CSP của trang prerender đi bằng `<meta http-equiv>`
 * (`security.ssg.meta`), nên dòng quá dài trong `_headers` chỉ là rác — bỏ nó để không còn
 * cảnh báo, các header còn lại của rule được giữ nguyên.
 */
export const CLOUDFLARE_HEADERS_MAX_LINE_LENGTH = 2000;

export function dropOversizedHeaderLines(
  headersText: string,
  maxLength = CLOUDFLARE_HEADERS_MAX_LINE_LENGTH
): { text: string; dropped: string[] } {
  const dropped: string[] = [];
  const kept = headersText.split("\n").filter((line) => {
    if (line.length <= maxLength) {
      return true;
    }
    dropped.push(line.trim().split(":")[0] ?? "");
    return false;
  });
  return { text: kept.join("\n"), dropped };
}
