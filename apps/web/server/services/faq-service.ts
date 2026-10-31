import { FAQ_ITEMS, type FaqItem } from "@mindkid/shared";

export const STATIC_FAQ_ITEMS: readonly FaqItem[] = FAQ_ITEMS;

export interface StoredFaqItemCandidate {
  readonly id?: string;
  readonly anchor?: string;
  readonly question?: string;
  readonly answer?: string;
  readonly q?: string;
  readonly a?: string;
  readonly category?: string;
  readonly legalLink?: string;
  readonly legal_link?: string;
}

type RawFaqItemsColumn = readonly StoredFaqItemCandidate[] | null | undefined;

const VALID_CATEGORIES: readonly FaqItem["category"][] = [
  "product",
  "content",
  "account",
  "billing",
  "privacy",
];

const RE_DIACRITICS = /[\u0300-\u036f]/g;
const RE_NON_ALNUM = /[^a-z0-9]+/g;
const RE_EDGE_DASH = /^-+|-+$/g;

function isCandidateArray(
  val: RawFaqItemsColumn
): val is readonly StoredFaqItemCandidate[] {
  return Array.isArray(val);
}

function isValidCategory(val: string): val is FaqItem["category"] {
  return (VALID_CATEGORIES as readonly string[]).includes(val);
}

export function toFaqAnchor(text: string, index: number): string {
  const slug = text
    .normalize("NFD")
    .replace(RE_DIACRITICS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(RE_NON_ALNUM, "-")
    .replace(RE_EDGE_DASH, "");
  return slug || `faq-${index + 1}`;
}

function pickTrimmedString(first?: string, second?: string): string {
  if (typeof first === "string" && first.trim()) {
    return first.trim();
  }
  if (typeof second === "string" && second.trim()) {
    return second.trim();
  }
  return "";
}

function findMatchingDefaultFaq(
  rawId: string,
  rawAnchor: string,
  question: string
): FaqItem | undefined {
  return FAQ_ITEMS.find(
    (d) =>
      (Boolean(rawId) && d.id === rawId) ||
      (Boolean(rawAnchor) && d.anchor === rawAnchor) ||
      d.question === question
  );
}

function normalizeSingleFaqEntry(
  entry: StoredFaqItemCandidate,
  index: number
): FaqItem | null {
  const question = pickTrimmedString(entry.question, entry.q);
  const answer = pickTrimmedString(entry.answer, entry.a);
  if (!(question && answer)) {
    return null;
  }

  const rawId = pickTrimmedString(entry.id);
  const rawAnchor = pickTrimmedString(entry.anchor);
  const rawCategory = pickTrimmedString(entry.category);
  const rawLegalLink = pickTrimmedString(entry.legalLink, entry.legal_link);

  const matchedDefault = findMatchingDefaultFaq(rawId, rawAnchor, question);
  const id = rawId || matchedDefault?.id || `faq-${index + 1}`;
  const anchor =
    rawAnchor || matchedDefault?.anchor || toFaqAnchor(question, index);
  const category: FaqItem["category"] = isValidCategory(rawCategory)
    ? rawCategory
    : (matchedDefault?.category ?? "product");
  const legalLink = rawLegalLink || matchedDefault?.legalLink;

  return legalLink
    ? { id, anchor, category, question, answer, legalLink }
    : { id, anchor, category, question, answer };
}

/**
 * Chuẩn hoá `seo_pages.faq_items` (hỗ trợ cả `{ question, answer, ... }` đầy đủ
 * lẫn `{ q, a }` từ trình soạn thảo SEO) thành mảng `FaqItem` chuẩn (`BR-FAQ-04`).
 */
export function normalizeFaqItems(raw: RawFaqItemsColumn): FaqItem[] {
  if (!isCandidateArray(raw)) {
    return [];
  }

  const items: FaqItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const normalized = normalizeSingleFaqEntry(entry, i);
    if (normalized) {
      items.push(normalized);
    }
  }

  return items;
}

export interface FaqRowStore {
  readonly fetchFaqRows: () => Promise<
    readonly { readonly faqItems: RawFaqItemsColumn }[]
  >;
}

/**
 * Trả danh sách FAQ tĩnh (`STATIC_FAQ_ITEMS`).
 */
export async function listPublishedFaqItems(
  store?: FaqRowStore | object
): Promise<FaqItem[]> {
  if (store && "fetchFaqRows" in store) {
    try {
      const rows = await store.fetchFaqRows();
      const [row] = rows;
      if (!row) {
        return [...STATIC_FAQ_ITEMS];
      }
      const normalized = normalizeFaqItems(row.faqItems);
      return normalized.length > 0 ? normalized : [...STATIC_FAQ_ITEMS];
    } catch {
      return [...STATIC_FAQ_ITEMS];
    }
  }
  return [...STATIC_FAQ_ITEMS];
}
