import type {
  GT002ColorToken,
  GT002CompareRelation,
  GT002CriterionAnchor,
  GT002GeometricSpec,
  GT002PhonicsMode,
  GT002QuantityRep,
  GT002ShapeForm,
  GT002SizeTier,
} from "@mindkid/game-engine/contracts";
import type {
  DatasetAsset,
  DatasetItem,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatNumberWord } from "@mindkid/shared";
import { assetKey, keywordAsset } from "#src/builders/utils";

const WHITESPACE_RE = /\s+/;
const LINE_SPLIT_RE = /[|\n]+/;
const SPATIAL_ORDER_STRAND_RE = /^C2\.(?:ORI|GRD)\./;
const CPA_QUANTITY_STRAND_RE = /^C1\.(?:CNT|ADD|SUB|NCOMP|NREC|DAT|OTO)\./;
const PHONICS_STRAND_RE = /^C5\.(?:ALP|LET|DGR|ONS|PHO|RHY|RIM|TMK|TON|WRD)\./;
const COMPARE_STRAND_RE = /^(?:C1\.(?:CMP|MEAS|DAT\.02)|C3\.SRT|C4\.)/;
const SHAPE_STRAND_RE = /^(?:C2\.|C3\.|C4\.SEN\.02|C5\.VOC\.18)/;
const COLOR_STRAND_RE = /^(?:C3\.SRT\.03|C4\.SEN\.01|C5\.VOC\.17)/;
const EXCLUDED_OTHER_GROUP_RE = /(?:^|\s)khác$/i;
const DIGITS_ONLY_RE = /^\d+\.?$/;
const PAREN_NOTE_RE = /\s*\([^)]*\)/g;
const NON_SLUG_RE = /[^a-z0-9_-]+/gi;
const PLURAL_PREFIX_RE = /^(?:các|những|nhóm|thẻ)\s/;
const LEADING_CLASSIFIER_RE =
  /^(?:chữ\s+cái|chữ\s+ghép|âm\s+đầu|chữ|âm|vần|tiếng|dấu)\s+/i;
const INTERNAL_PARTITION_RE =
  /(?:nhóm\s*(?:1|2|một|hai)|(?:đơn|đệm|n)\s+(?:một|hai)|t\s+p|quen\s+thuộc|mở\s+rộng|một\s+chữ|nhiều\s+chữ|đổi\s+thanh|có\s+dấu$)/i;

const STOP_MATCH_WORDS = new Set(
  "các những nhóm vật đồ hình cảnh món loài con chiếc quả cái bạn chú vị trí chuyển động sắc màu nhận biết phân biệt loại theo trong của bằng với và hoặc có là từ vựng".split(
    " "
  )
);

function parsePhraseTable(raw: string): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const entry of raw.split(LINE_SPLIT_RE)) {
    const eq = entry.indexOf("=");
    if (eq > 0) {
      out[entry.slice(0, eq).trim()] = entry.slice(eq + 1).trim();
    }
  }
  return out;
}

const NATURAL_GROUP_PHRASE_MAP = parsePhraseTable(`
nhóm đầu=vị trí từ 1 đến 3|nhóm sau=vị trí từ 4 đến 6|nửa đầu hàng=vị trí từ 1 đến 5|nửa cuối hàng=vị trí từ 6 đến 10
toa giữa hàng=toa thứ 2 đến 4|toa cuối hàng=toa thứ 5, 6|kết quả nhỏ=nhóm từ 1 đến 3 quả|kết quả lớn=nhóm từ 4 đến 6 quả
số và hình=chữ số hoặc hình vẽ|chữ cái đơn=các chữ cái|chữ có dấu phụ=chữ có dấu mũ, móc|nguyên âm dấu=chữ có dấu mũ, móc
chữ ghép có g=chữ ghép có chữ g|tiếng thanh ngang=các tiếng thanh ngang|thanh ngang=các tiếng thanh ngang|dấu huyền=tiếng có dấu huyền
tiếng thanh hỏi=tiếng có dấu hỏi|tiếng thanh ngã=tiếng có dấu ngã|vần có m=vần có âm m cuối|vần có ng=vần có âm ng cuối|vần có c=vần có âm c cuối
vần mũi vang=vần an, am, ang|vần ngắt tắc=vần ac, at, ap|vần ia ua=vần ia, ua, ưa|vần iê uô=vần iê, uô, ươ
từ một tiếng=từ có một tiếng|từ hai tiếng=từ có hai tiếng|sống dưới nước=bạn sống dưới nước|sống trên cạn=bạn sống trên cạn
ở chính giữa=các hình ở giữa|ở trung tâm=các hình ở giữa|ở hai bên=các hình hai bên|ở trong góc=các hình ở góc
điểm đích=các điểm đích|vật cản=các vật cản đường|chuyển động nhanh=vật đi nhanh hơn|chuyển động chậm=vật đi chậm hơn
vị trí xa=các vật ở xa|vị trí gần=các vật ở gần|buổi ban sáng=hình buổi sáng|buổi ban trưa=hình buổi trưa
buổi ban chiều=hình buổi chiều|buổi ban tối=hình buổi tối|so sánh kích thước=cặp so to, cao, dài|so sánh đặc tính=cặp nhanh, nặng, lạnh
thí nghiệm làm=đồ làm thí nghiệm|kết quả thấy=kết quả thí nghiệm|đặc điểm bạn=nét gương mặt bạn|sở thích bạn=trò bạn yêu thích
vật thể ba màu=đồ vật nhiều màu|số một chữ số=số có một chữ số|số từ 11 đến 15=số từ 11 đến 15|số từ 16 đến 20=số từ 16 đến 20
`);

const CONTRAST_GROUP_PHRASE_MAP = parsePhraseTable(`
red=vật màu đỏ|đỏ=vật màu đỏ|blue=vật màu xanh dương|xanh dương=vật màu xanh dương|green=vật màu xanh lá|xanh lá=vật màu xanh lá
yellow=vật màu vàng|vàng=vật màu vàng|orange=vật màu cam|cam=vật màu cam|purple=vật màu tím|tím=vật màu tím|pink=vật màu hồng|hồng=vật màu hồng
circle=các hình tròn|round=các hình tròn|square=các hình vuông|triangle=các hình tam giác|rectangle=các hình chữ nhật
fruit=các loại quả|fruits=các loại quả|vegetables=các loại rau củ|insects=các chú côn trùng|animals=các con vật|ocean=sinh vật biển
vehicles=các chiếc xe|toys=các món đồ chơi|heavy=các vật nặng hơn|light=các vật nhẹ hơn|small=các vật nhỏ hơn|large=các vật lớn hơn|big=các vật lớn hơn
`);

const SHAPE_KEYWORD_MAP: ReadonlyArray<readonly [RegExp, GT002ShapeForm]> = [
  [/khối\s+cầu|lăn\s+được/, "sphere"],
  [/khối\s+trụ/, "cylinder"],
  [/lập\s+phương|đứng\s+yên/, "cube"],
  [/khối\s+chữ\s+nhật/, "rectangular_prism"],
  [/khối\s+nón/, "cone"],
  [/chữ\s+nhật/, "rectangle"],
  [/tam\s+giác|ít\s+cạnh|ba\s+cạnh/, "triangle"],
  [/nhiều\s+cạnh|lục\s+giác|sáu\s+cạnh/, "hexagon"],
  [/ngũ\s+giác|năm\s+cạnh/, "pentagon"],
  [/thoi/, "rhombus"],
  [/bầu\s+dục|oval/, "oval"],
  [/ngôi\s+sao|năm\s+cánh/, "star"],
  [/(?:^|\s)(?:vuông|góc\s+cạnh|bốn\s+cạnh)(?=$|\s)/, "square"],
  [/(?:^|\s)tròn(?=$|\s)/, "circle"],
];

const COLOR_KEYWORD_MAP: ReadonlyArray<readonly [RegExp, GT002ColorToken]> = [
  [/(?:^|\s)(?:đỏ|red)(?=$|\s)/, "coral"],
  [/(?:^|\s)(?:vàng|yellow)(?=$|\s)/, "amber"],
  [/(?:^|\s)(?:xanh\s*lá|green)(?=$|\s)/, "emerald"],
  [/(?:^|\s)(?:tím|chàm|indigo|purple)(?=$|\s)/, "indigo"],
  [/(?:^|\s)(?:xanh\s*dương|xanh\s*lam|xanh|blue)(?=$|\s)/, "sky"],
  [/(?:^|\s)(?:hồng|màu\s+sáng|pink)(?=$|\s)/, "lotus"],
  [/(?:^|\s)(?:cam|orange)(?=$|\s)/, "terracotta"],
  [/(?:^|\s)(?:nâu|màu\s+tối|brown)(?=$|\s)/, "wood"],
];

const COMPARE_KEYWORD_MAP: ReadonlyArray<
  readonly [RegExp, GT002CompareRelation, GT002SizeTier]
> = [
  [/(?:^|\s)(?:nhẹ\s*hơn|nhẹ\s*cân|nhẹ)(?=$|\s)/, "lighter", "small"],
  [/(?:^|\s)(?:nặng\s*hơn|nặng\s*cân|nặng)(?=$|\s)/, "heavier", "large"],
  [/(?:^|\s)(?:dài\s*hơn|đo\s*dài|dài|xa)(?=$|\s)/, "longer", "large"],
  [/(?:^|\s)(?:ngắn\s*hơn|đo\s*ngắn|ngắn|gần)(?=$|\s)/, "shorter", "small"],
  [/(?:^|\s)(?:cao\s*hơn|khối\s*cao|cao)(?=$|\s)/, "taller", "large"],
  [/(?:^|\s)(?:thấp\s*hơn|khối\s*thấp|thấp)(?=$|\s)/, "shorter", "small"],
  [/(?:^|\s)(?:đầy\s*hơn|đầy)(?=$|\s)/, "fuller", "large"],
  [/(?:^|\s)(?:vơi\s*hơn|vơi|cạn)(?=$|\s)/, "emptier", "small"],
  [/(?:^|\s)(?:to\s*lớn|động\s*vật\s*to|to|lớn)(?=$|\s)/, "larger", "large"],
  [/(?:^|\s)(?:bé\s*nhỏ|động\s*vật\s*nhỏ|nhỏ|bé)(?=$|\s)/, "smaller", "small"],
];

export interface GT002CandidateGroup {
  readonly id: string;
  readonly rawKey: string;
  readonly sourceKind: "value_eq" | "category_type" | "parity" | "fallback";
  readonly numericValue?: number;
  readonly distinctTargets: readonly DatasetItem[];
  readonly distinctDistractors: readonly DatasetItem[];
}

export function shouldPreserveGT002Order(skillCode: string): boolean {
  return SPATIAL_ORDER_STRAND_RE.test(skillCode);
}

function dedupeByAssetKey(
  items: readonly DatasetItem[],
  forbidden?: ReadonlySet<string>
): DatasetItem[] {
  const seen = new Set<string>();
  const out: DatasetItem[] = [];
  for (const item of items) {
    const key = assetKey(keywordAsset(item));
    if (!(forbidden?.has(key) || seen.has(key))) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function pushGroup(
  list: GT002CandidateGroup[],
  id: string,
  rawKey: string,
  sourceKind: GT002CandidateGroup["sourceKind"],
  all: readonly DatasetItem[],
  pred: (item: DatasetItem) => boolean,
  numericValue?: number
): void {
  const inGroup = all.filter(pred);
  const groupKeys = new Set(inGroup.map((i) => assetKey(keywordAsset(i))));
  list.push({
    id,
    rawKey,
    sourceKind,
    ...(numericValue === undefined ? {} : { numericValue }),
    distinctTargets: dedupeByAssetKey(inGroup),
    distinctDistractors: dedupeByAssetKey(
      all.filter((i) => !pred(i)),
      groupKeys
    ),
  });
}

function resolveFallbackKey(item: DatasetItem): string {
  const raw =
    item.category?.color ?? item.category?.shape ?? item.contrast_group ?? "";
  return raw.trim().toLowerCase();
}

function collectRawCandidateGroups(ds: SkillDataset): GT002CandidateGroup[] {
  const { items, skill_code: code } = ds;
  const out: GT002CandidateGroup[] = [];

  if (code.startsWith("C1.NCOMP.")) {
    const vals = new Set(
      items
        .map((i) => i.value)
        .filter((v): v is number => typeof v === "number" && v >= 1)
    );
    for (const v of vals) {
      const label = `thẻ chỉ số lượng ${formatNumberWord(v)}`;
      pushGroup(
        out,
        `val:${v}`,
        label,
        "value_eq",
        items,
        (i) => i.value === v,
        v
      );
    }
  }

  const types = new Set(
    items.map((i) => i.category?.type?.trim() ?? "").filter(Boolean)
  );
  if (types.size >= 2) {
    for (const t of types) {
      if (!EXCLUDED_OTHER_GROUP_RE.test(t)) {
        pushGroup(
          out,
          `type:${t}`,
          t,
          "category_type",
          items,
          (i) => i.category?.type?.trim() === t
        );
      }
    }
  }

  const parities = new Set(items.map((i) => i.category?.parity?.trim() ?? ""));
  if (parities.has("chẵn") && parities.has("lẻ")) {
    pushGroup(
      out,
      "parity:even",
      "các số chẵn",
      "parity",
      items,
      (i) => i.category?.parity?.trim() === "chẵn"
    );
    pushGroup(
      out,
      "parity:odd",
      "các số lẻ",
      "parity",
      items,
      (i) => i.category?.parity?.trim() === "lẻ"
    );
  }

  if (out.length === 0) {
    const fbKeys = new Set(
      items
        .map(resolveFallbackKey)
        .filter((k) => Boolean(CONTRAST_GROUP_PHRASE_MAP[k]))
    );
    if (fbKeys.size >= 2) {
      for (const k of fbKeys) {
        pushGroup(
          out,
          `fb:${k}`,
          CONTRAST_GROUP_PHRASE_MAP[k] ?? k,
          "fallback",
          items,
          (i) => resolveFallbackKey(i) === k
        );
      }
    }
  }
  return out;
}

function scoreGroupAlignment(
  group: GT002CandidateGroup,
  ds: SkillDataset
): number {
  const concept = ds.concept_label.trim().toLowerCase();
  const rawLower = group.rawKey.trim().toLowerCase();
  if (group.numericValue !== undefined) {
    const word = formatNumberWord(group.numericValue);
    return concept.includes(String(group.numericValue)) ||
      concept.includes(word)
      ? 25
      : 5;
  }
  if (concept === rawLower || concept.includes(rawLower)) {
    return 20;
  }
  let matched = 0;
  for (const token of rawLower.split(WHITESPACE_RE)) {
    if (
      token.length >= 2 &&
      !STOP_MATCH_WORDS.has(token) &&
      concept.includes(token)
    ) {
      matched += 6;
    }
  }
  return matched;
}

export function selectViableTargetGroup(
  dataset: SkillDataset,
  targetCount: number,
  distractorCount: number,
  roundOffset: number
): GT002CandidateGroup | null {
  const hasGlyph = dataset.items.some((i) => Boolean(i.glyph));
  const viable = collectRawCandidateGroups(dataset).filter(
    (g) =>
      g.distinctTargets.length >= targetCount &&
      g.distinctDistractors.length >= distractorCount &&
      (!hasGlyph ||
        g.distinctTargets.some((i) => Boolean(i.glyph)) ||
        g.distinctDistractors.some((i) => Boolean(i.glyph)))
  );
  if (viable.length === 0) {
    return null;
  }
  const best = Math.max(...viable.map((g) => scoreGroupAlignment(g, dataset)));
  const top = viable.filter((g) => scoreGroupAlignment(g, dataset) === best);
  return top[Math.abs(roundOffset) % top.length] ?? null;
}

export function extractCompactPhonicsSymbol(item: DatasetItem): string {
  if (item.glyph && item.glyph.trim().length <= 6) {
    return item.glyph.trim();
  }
  const cleaned = item.label
    .replace(PAREN_NOTE_RE, "")
    .replace(LEADING_CLASSIFIER_RE, "")
    .trim();
  return cleaned.slice(0, 8) || item.label.trim().slice(0, 8);
}

export function formatGroupCriterionPhrase(
  group: GT002CandidateGroup,
  chosenTargets: readonly DatasetItem[],
  skillCode: string
): string {
  const rawLower = group.rawKey.trim().toLowerCase();
  const mapped = NATURAL_GROUP_PHRASE_MAP[rawLower];
  if (mapped) {
    return mapped;
  }
  if (INTERNAL_PARTITION_RE.test(rawLower)) {
    const symbols = chosenTargets.map(extractCompactPhonicsSymbol).join(", ");
    if (skillCode.startsWith("C5.ONS.")) {
      return `âm đầu ${symbols}`;
    }
    if (skillCode.startsWith("C5.RHY.") || skillCode.startsWith("C5.RIM.")) {
      return `vần ${symbols}`;
    }
    if (skillCode.startsWith("C5.TON.") || skillCode.startsWith("C5.TMK.")) {
      return `tiếng ${symbols}`;
    }
    return `chữ ${symbols}`;
  }
  return PLURAL_PREFIX_RE.test(rawLower) ? rawLower : `các ${rawLower}`;
}

export function buildGT002ItemRepresentation(
  item: DatasetItem,
  skillCode: string,
  opts: ProjectOptions
): GT002QuantityRep | undefined {
  const val = item.value;
  if (
    !CPA_QUANTITY_STRAND_RE.test(skillCode) ||
    typeof val !== "number" ||
    val < 1 ||
    val > 20
  ) {
    return undefined;
  }
  if (skillCode === "C1.DAT.01" || item.category?.tally_count !== undefined) {
    return { kind: "tally", count: val, max: val <= 10 ? 10 : 20, min: 0 };
  }
  const rep = opts.representation;
  const isDigitGlyph = Boolean(
    item.glyph && DIGITS_ONLY_RE.test(item.glyph.trim())
  );
  if (
    !rep ||
    rep === "numeral" ||
    rep === "finger" ||
    rep === "discrete-object" ||
    isDigitGlyph
  ) {
    return undefined;
  }
  const kind = rep === "dot-pattern" && val > 6 ? "ten-frame" : rep;
  return { kind, count: val, max: val <= 10 ? 10 : 20, min: 0 };
}

export function inferPureGeometricSpec(
  item: DatasetItem
): GT002GeometricSpec | undefined {
  const clean = item.label.trim().toLowerCase();
  if (!(clean.startsWith("thẻ ") || clean.startsWith("hình "))) {
    return undefined;
  }
  const shapeHit = SHAPE_KEYWORD_MAP.find(([re]) => re.test(clean));
  if (!shapeHit) {
    return undefined;
  }
  const colorHit = COLOR_KEYWORD_MAP.find(([re]) =>
    re.test(`${clean} ${item.category?.color ?? ""}`.toLowerCase())
  );
  return { form: shapeHit[1], color_token: colorHit ? colorHit[1] : "indigo" };
}

function resolvePhonicsMode(code: string): GT002PhonicsMode {
  if (code.startsWith("C5.ONS.") || code === "C5.PHO.04") {
    return "initial_sound";
  }
  if (code.startsWith("C5.RHY.") || code.startsWith("C5.RIM.")) {
    return "rhyme";
  }
  if (code.startsWith("C5.TON.") || code.startsWith("C5.TMK.")) {
    return "tone";
  }
  return code.startsWith("C5.PHO.") ? "syllable_count" : "letter";
}

function cueAssetOf(item: DatasetItem): DatasetAsset {
  return item.image ?? keywordAsset(item);
}

export interface BuildCriterionAnchorInput {
  readonly skillCode: string;
  readonly criterionPhrase: string;
  readonly group: GT002CandidateGroup | null;
  readonly targetSources: readonly DatasetItem[];
  readonly distractorSources: readonly DatasetItem[];
  readonly opts: ProjectOptions;
}

function resolveVisualTraitAnchor(
  input: BuildCriterionAnchorInput,
  labelVi: string,
  textSignal: string
): GT002CriterionAnchor | null {
  const { skillCode, group, targetSources, distractorSources } = input;
  const firstTarget = targetSources[0];
  const firstFoil = distractorSources[0];
  const colorHit = COLOR_KEYWORD_MAP.find(([re]) => re.test(textSignal));
  const shapeHit = SHAPE_KEYWORD_MAP.find(([re]) => re.test(textSignal));

  if (colorHit && shapeHit) {
    return {
      kind: "conjunction",
      operator: "and",
      clauses: [
        { kind: "color", color_token: colorHit[1] },
        { kind: "shape", form: shapeHit[1], color_token: colorHit[1] },
      ],
      label_vi: labelVi,
    };
  }
  if (PHONICS_STRAND_RE.test(skillCode) && firstTarget) {
    const symbols = targetSources
      .slice(0, 3)
      .map(extractCompactPhonicsSymbol)
      .join(" · ")
      .slice(0, 24);
    return {
      kind: "phonics",
      symbol_text: symbols || labelVi.slice(0, 24) || "a",
      cue_asset: cueAssetOf(firstTarget),
      phonics_mode: resolvePhonicsMode(skillCode),
      label_vi: labelVi,
    };
  }
  const compareHit = COMPARE_KEYWORD_MAP.find(([re]) => re.test(textSignal));
  if (compareHit && COMPARE_STRAND_RE.test(skillCode)) {
    return {
      kind: "size_compare",
      relation: compareHit[1],
      size_tier: compareHit[2],
      ...(firstFoil ? { reference_asset: cueAssetOf(firstFoil) } : {}),
      label_vi: labelVi,
    };
  }
  if (shapeHit && SHAPE_STRAND_RE.test(skillCode)) {
    return { kind: "shape", form: shapeHit[1], label_vi: labelVi };
  }
  if (
    colorHit &&
    (COLOR_STRAND_RE.test(skillCode) || group?.sourceKind === "fallback")
  ) {
    return { kind: "color", color_token: colorHit[1], label_vi: labelVi };
  }
  return null;
}

export function buildGT002CriterionAnchor(
  input: BuildCriterionAnchorInput
): GT002CriterionAnchor {
  const { skillCode, criterionPhrase, group, targetSources, opts } = input;
  const labelVi = criterionPhrase.slice(0, 40);
  const trait = resolveVisualTraitAnchor(
    input,
    labelVi,
    `${group?.rawKey ?? ""} ${criterionPhrase}`.toLowerCase()
  );
  if (trait) {
    return trait;
  }

  const first = targetSources[0];
  const second = targetSources[1];
  const fallbackVal =
    group === null &&
    first &&
    typeof first.value === "number" &&
    first.value >= 0 &&
    first.value <= 20 &&
    CPA_QUANTITY_STRAND_RE.test(skillCode)
      ? first.value
      : undefined;
  const numCount = group?.numericValue ?? fallbackVal;
  if (numCount !== undefined) {
    const rep = first
      ? buildGT002ItemRepresentation(first, skillCode, opts)
      : undefined;
    return {
      kind: "quantity",
      count: numCount,
      ...(rep ? { representation: rep } : {}),
      label_vi: labelVi,
    };
  }

  const rawSlug = (group?.id ?? opts.theme)
    .replace(NON_SLUG_RE, "_")
    .slice(0, 40);
  return {
    kind: "category",
    ...(first ? { cue_asset: cueAssetOf(first) } : {}),
    ...(second ? { secondary_cue_asset: cueAssetOf(second) } : {}),
    ...(rawSlug.length > 0 ? { category_code: rawSlug } : {}),
    label_vi: labelVi,
  };
}
