/**
 * Soạn lại 73 level từng bị cách ly ở `seed-content/quarantine.ts`.
 *
 * Chúng viết theo thế hệ template đặt tên theo chủ đề; engine hiện tại đặt tên
 * theo cơ chế, và không cơ chế nào nhận được khuôn cũ. Task 162 chuyển được 102
 * hạt bằng ánh xạ máy; 73 hạt còn lại cần **soạn lại**, vì cơ chế chơi của
 * chúng không tồn tại chứ không phải vì sai tên trường.
 *
 * Nguyên tắc soạn lại:
 * - Giữ nguyên phần đầu của hạt (mã, kỹ năng, LO, tag, band tuổi, gói, độ khó).
 *   Chỉ `template_code`, `content_pack`, `difficulty_params` là mới; `title` và
 *   `instruction` chỉ đổi khi hoạt động thật sự đổi.
 * - Chọn engine theo **cơ chế học** của level, không theo số hiệu template cũ.
 * - Giữ đúng nội dung cụ thể của bản cũ (con vật, quả, màu, số lượng) để level
 *   vẫn là level đó, không phải một level khác mang cùng mã.
 */
import {
  clockMatch,
  flashCount,
  hiddenObject,
  latinMatrix,
  memoryFlip,
  orderedSlots,
  patternSlots,
  type ReauthoredPack,
  sequenceOrder,
  sortGroups,
  tapSelect,
} from "./builders.js";

/** Toạ độ khung cảnh của `GT-022` — 960×540. */
const SCENE = {
  top: 120,
  middle: 270,
  bottom: 420,
  left: 180,
  centre: 480,
  right: 780,
} as const;

export const REAUTHORED_LEVELS: Record<string, ReauthoredPack> = {
  // ── So sánh hai vật: chọn một đáp án (GT-001) ──────────────────
  "GL-C2-CMP-SIZ-0008": tapSelect("Bé chạm vào quả to hơn nhé!", [
    { id: "watermelon", ref: "🍉", correct: true },
    { id: "strawberry", ref: "🍓" },
  ]),
  "GL-C2-CMP-SIZ-0009": tapSelect("Bé chạm vào cái cây cao hơn nhé!", [
    { id: "tall-tree", ref: "🌲", correct: true },
    { id: "seedling", ref: "🌱" },
  ]),
  "GL-C2-CMP-SIZ-0017": tapSelect("Bé chạm vào con vật to hơn nhé!", [
    { id: "elephant", ref: "🐘", correct: true },
    { id: "mouse", ref: "🐭" },
  ]),
  "GL-C3-LOG-CMP-0008": tapSelect("Bé chạm vào con vật nặng hơn nhé!", [
    { id: "hippo", ref: "🦛", correct: true },
    { id: "feather", ref: "🪶" },
  ]),
  "GL-C3-LOG-CMP-0009": tapSelect("Bé chạm vào thứ chạy nhanh hơn nhé!", [
    { id: "rocket", ref: "🚀", correct: true },
    { id: "snail", ref: "🐌" },
  ]),
  "GL-C3-LOG-CMP-0015": tapSelect("Bé chạm vào vật chứa được nhiều nước hơn!", [
    { id: "jar", ref: "🫙", correct: true },
    { id: "cup", ref: "🥤" },
  ]),
  "GL-C3-LOG-CMP-0020": tapSelect("Bé chạm vào vật dài hơn nhé!", [
    { id: "ruler", ref: "📏", correct: true },
    { id: "pencil", ref: "✏️" },
  ]),
  "GL-C4-OBS-CARD-0003": tapSelect(
    "Bé chạm vào quả khác loại với hai quả kia!",
    [
      { id: "apple-1", ref: "🍎" },
      { id: "apple-2", ref: "🍎" },
      { id: "banana", ref: "🍌", correct: true },
    ]
  ),
  "GL-C4-DIF-CMP-0007": tapSelect("Bé chạm vào con vật không phải là cá nhé!", [
    { id: "fish-1", ref: "🐠" },
    { id: "fish-2", ref: "🐠" },
    { id: "chick", ref: "🐥", correct: true },
  ]),
  "GL-C4-DIF-CMP-0013": tapSelect("Bé chạm vào bông hoa có màu khác nhé!", [
    { id: "rose-1", ref: "🌹" },
    { id: "rose-2", ref: "🌹" },
    { id: "sunflower", ref: "🌻", correct: true },
  ]),
  "GL-C4-DIF-CMP-0017": tapSelect(
    "Bé chạm vào chiếc xe đang quay về phía bé!",
    [
      { id: "oncoming", ref: "🚘", correct: true },
      { id: "car", ref: "🚗" },
      { id: "taxi", ref: "🚕" },
    ]
  ),
  "GL-C5-EXP-CMP-0006": tapSelect("Bé chạm vào ngôi nhà TO nhé!", [
    { id: "house", ref: "🏠", correct: true },
    { id: "hut", ref: "🛖" },
  ]),
  "GL-C5-EXP-CMP-0007": tapSelect("Bé chạm vào con vật CAO nhé!", [
    { id: "giraffe", ref: "🦒", correct: true },
    { id: "chipmunk", ref: "🐿️" },
  ]),
  "GL-C5-EXP-CMP-0013": tapSelect("Cây nào có TRƯỚC, bé chạm vào nhé!", [
    { id: "seedling", ref: "🌱", correct: true },
    { id: "tree", ref: "🌳" },
  ]),
  "GL-C5-EXP-CMP-0017": tapSelect("Khuôn mặt nào đang vui, bé chạm vào nhé!", [
    { id: "grin", ref: "😄", correct: true },
    { id: "cry", ref: "😢" },
  ]),
  "GL-C6-MEM-CMP-0007": tapSelect("Bé chạm vào quả táo XANH nhé!", [
    { id: "green-apple", ref: "🍏", correct: true },
    { id: "red-apple", ref: "🍎" },
  ]),

  // ── So sánh số lượng: cân hai bên (GT-014) ─────────────────────
  "GL-C1-CMP-NUM-0010": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy quả táo nhé!",
      "🍎",
      3,
      1500,
      [2, 4]
    ),
    title: "Đếm nhanh số quả táo",
    instruction: "Bé nhìn nhanh xem có mấy quả táo nhé!",
  },
  "GL-C1-CMP-NUM-0011": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy viên kẹo nhé!",
      "🍬",
      4,
      1500,
      [3, 5]
    ),
    title: "Đếm nhanh số viên kẹo",
    instruction: "Bé nhìn nhanh xem có mấy viên kẹo nhé!",
  },
  "GL-C1-CMP-NUM-0012": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy quả bóng nhé!",
      "⚽",
      4,
      1500,
      [3, 5]
    ),
    title: "Đếm nhanh số quả bóng",
    instruction: "Bé nhìn nhanh xem có mấy quả bóng nhé!",
  },
  "GL-C1-CMP-NUM-0013": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy chiếc bánh nhé!",
      "🧁",
      5,
      1500,
      [4, 6]
    ),
    title: "Đếm nhanh số chiếc bánh",
    instruction: "Bé nhìn nhanh xem có mấy chiếc bánh nhé!",
  },
  "GL-C1-CMP-CARD-0115": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy chú cá nhé!",
      "🐟",
      4,
      2000,
      [3, 5]
    ),
    title: "Đếm nhanh số chú cá",
    instruction: "Bé nhìn nhanh xem có mấy chú cá nhé!",
  },
  "GL-C1-CMP-CARD-0116": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy bông hoa nhé!",
      "🌻",
      3,
      2000,
      [2, 4]
    ),
    title: "Đếm nhanh số bông hoa",
    instruction: "Bé nhìn nhanh xem có mấy bông hoa nhé!",
  },
  "GL-C6-MEM-CMP-0015": {
    ...memoryFlip("Bé lật thẻ tìm hai quả giống nhau nhé!", ["🍇", "🍊", "🍎"]),
    instruction: "Bé lật thẻ và tìm hai quả giống nhau nhé!",
  },

  // ── Quy luật lặp: ma trận ô vuông Latinh (GT-011) ──────────────
  "GL-C1-SEQ-PAT-0014": patternSlots(
    "Bé kéo quả vào ô cho đúng quy luật táo - chuối!",
    [
      { ref: "🍎", label: "Quả táo" },
      { ref: "🍌", label: "Quả chuối" },
    ],
    2
  ),
  "GL-C1-SEQ-PAT-0016": latinMatrix(
    "Bé chọn chiếc xe điền vào ô trống nhé!",
    ["🚗", "🚕"],
    "🚙"
  ),
  "GL-C2-SEQ-PAT-0011": patternSlots(
    "Bé kéo hình vào ô cho đúng quy luật nhé!",
    [
      { ref: "🔴", label: "Hình tròn đỏ" },
      { ref: "🟦", label: "Hình vuông xanh" },
    ],
    2
  ),
  "GL-C2-SEQ-PAT-0012": patternSlots(
    "Bé kéo ngôi sao vào ô cho đúng quy luật nhé!",
    [
      { ref: "🌟", label: "Sao lớn" },
      { ref: "⭐", label: "Sao nhỏ" },
    ],
    2
  ),
  "GL-C2-SEQ-PAT-0018": latinMatrix(
    "Bé chọn hình điền vào ô trống cho đủ ba màu!",
    ["🔴", "🟢", "🟡"],
    "🔵"
  ),
  "GL-C3-PAT-SEQ-0006": patternSlots(
    "Bé kéo khuôn mặt vào ô cho đúng quy luật nhé!",
    [
      { ref: "😀", label: "Mặt cười" },
      { ref: "😍", label: "Mặt yêu thương" },
    ],
    2
  ),
  "GL-C3-PAT-SEQ-0007": patternSlots(
    "Bé kéo thời tiết vào ô cho đúng quy luật nhé!",
    [
      { ref: "☀️", label: "Trời nắng" },
      { ref: "🌧️", label: "Trời mưa" },
    ],
    2
  ),
  "GL-C3-PAT-SEQ-0012": latinMatrix(
    "Bé chọn dụng cụ điền vào ô trống nhé!",
    ["✏️", "📏", "✂️"],
    "📘"
  ),
  "GL-C3-PAT-SEQ-0016": latinMatrix(
    "Bé chọn hình điền vào ô trống cho đủ ba màu!",
    ["🔴", "🟡", "🔵"],
    "🟢"
  ),
  "GL-C4-SEQ-OBS-0006": patternSlots(
    "Bé kéo màu vào ô cho đúng quy luật nhé!",
    [
      { ref: "🟢", label: "Màu xanh" },
      { ref: "🟡", label: "Màu vàng" },
    ],
    2
  ),
  "GL-C4-SEQ-OBS-0012": patternSlots(
    "Bé kéo con vật vào ô cho đúng quy luật nhé!",
    [
      { ref: "🐶", label: "Chú chó" },
      { ref: "🐱", label: "Chú mèo" },
    ],
    2
  ),
  "GL-C5-VOC-SEQ-0008": patternSlots(
    "Bé kéo người vào ô cho đúng quy luật nhé!",
    [
      { ref: "👨", label: "Bố" },
      { ref: "👩", label: "Mẹ" },
    ],
    2
  ),
  "GL-C6-MEM-SEQ-0006": patternSlots(
    "Bé kéo hình vào ô cho đúng quy luật nhé!",
    [
      { ref: "🔴", label: "Hình đỏ" },
      { ref: "🟢", label: "Hình xanh" },
    ],
    2
  ),
  "GL-C6-MEM-SEQ-0012": patternSlots(
    "Bé kéo hình vào ô cho đúng quy luật nhé!",
    [
      { ref: "☀️", label: "Mặt trời" },
      { ref: "🌙", label: "Mặt trăng" },
      { ref: "⭐", label: "Ngôi sao" },
    ],
    2
  ),
  "GL-C1-PAT-SEQ-0121": latinMatrix(
    "Bé chọn quả điền vào ô trống cho đúng quy luật!",
    ["🍎", "🍌"],
    "🍊"
  ),
  "GL-C1-PAT-SEQ-0122": latinMatrix(
    "Bé chọn hình điền vào ô trống cho đủ ba màu!",
    ["🔴", "🟢", "🔵"],
    "🟡"
  ),
  "GL-C3-MAT-CHO-0026": latinMatrix(
    "Bé chọn mũi tên điền vào ô trống nhé!",
    ["⬆️", "➡️"],
    "⬅️"
  ),

  // ── Dãy có thứ tự: kéo vào đúng ô (GT-008) ────────────────────
  "GL-C1-SEQ-PAT-0015": {
    ...orderedSlots("Bé kéo các số vào đúng ô theo thứ tự 1 đến 5!", [
      { id: "n1", ref: "1️⃣", label: "1" },
      { id: "n2", ref: "2️⃣", label: "2" },
      { id: "n3", ref: "3️⃣", label: "3" },
      { id: "n4", ref: "4️⃣", label: "4" },
      { id: "n5", ref: "5️⃣", label: "5" },
    ]),
    title: "Xếp dãy số 1 đến 5",
    instruction: "Bé kéo thẻ số vào ô theo thứ tự 1-5!",
  },
  "GL-C4-SEQ-OBS-0018": {
    ...sequenceOrder("Bé xếp mặt trăng từ tròn đầy đến tối dần nhé!", [
      { id: "m-full", ref: "🌕", label: "Trăng tròn" },
      { id: "m-cres", ref: "🌙", label: "Trăng khuyết" },
      { id: "m-new", ref: "🌑", label: "Trăng tối" },
    ]),
    title: "Xếp thứ tự mặt trăng",
    instruction: "Bé xếp mặt trăng từ tròn đầy đến tối dần nhé!",
  },
  "GL-C5-VOC-SEQ-0014": {
    ...sequenceOrder("Bé xếp câu chuyện quả trứng nở thành gà nhé!", [
      { id: "s-egg", ref: "🥚", label: "Quả trứng" },
      { id: "s-hatch", ref: "🐣", label: "Trứng nở" },
      { id: "s-chick", ref: "🐥", label: "Gà con" },
      { id: "s-hen", ref: "🐔", label: "Gà lớn" },
    ]),
    title: "Xếp câu chuyện quả trứng",
    instruction: "Bé xếp các bức tranh theo thứ tự câu chuyện nhé!",
  },
  "GL-C5-VOC-SEQ-0019": {
    ...sequenceOrder("Bé xếp bốn mùa theo đúng thứ tự trong năm nhé!", [
      { id: "spring", ref: "🌸", label: "Mùa xuân" },
      { id: "summer", ref: "☀️", label: "Mùa hè" },
      { id: "autumn", ref: "🍂", label: "Mùa thu" },
      { id: "winter", ref: "❄️", label: "Mùa đông" },
    ]),
    title: "Xếp thứ tự bốn mùa",
    instruction: "Bé xếp bốn mùa theo đúng thứ tự trong năm nhé!",
  },
  "GL-C6-MEM-SEQ-0017": {
    ...sequenceOrder("Bé xếp các số theo thứ tự đếm ngược từ 5 về 1!", [
      { id: "d5", ref: "5️⃣", label: "5" },
      { id: "d4", ref: "4️⃣", label: "4" },
      { id: "d3", ref: "3️⃣", label: "3" },
      { id: "d2", ref: "2️⃣", label: "2" },
      { id: "d1", ref: "1️⃣", label: "1" },
    ]),
    title: "Xếp dãy số đếm ngược",
    instruction: "Bé xếp thẻ số theo thứ tự đếm ngược!",
  },
  "GL-C1-POS-LOC-0017": tapSelect("Bé chạm vào quả táo nhé!", [
    { id: "apple", ref: "🍎", correct: true },
    { id: "banana", ref: "🍌" },
    { id: "orange", ref: "🍊" },
  ]),
  "GL-C2-POS-LOC-0004": tapSelect("Bé chạm vào chú gấu bông nhé!", [
    { id: "teddy", ref: "🧸", correct: true },
    { id: "box", ref: "📦" },
    { id: "book", ref: "📘" },
  ]),
  "GL-C2-POS-LOC-0005": tapSelect("Bé chạm vào chú chó nhé!", [
    { id: "dog", ref: "🐶", correct: true },
    { id: "cat", ref: "🐱" },
    { id: "house", ref: "🏠" },
  ]),
  "GL-C4-OBS-LOC-0005": tapSelect("Bé chạm vào chú bướm nhé!", [
    { id: "butterfly", ref: "🦋", correct: true },
    { id: "leaf", ref: "🍃" },
    { id: "bee", ref: "🐝" },
  ]),

  // ── Vị trí: tìm trong khung cảnh (GT-022) ─────────────────────
  "GL-C1-POS-LOC-0018": hiddenObject(
    "Bé tìm chú thỏ ở phía bên trái nhé!",
    "Chú thỏ ở bên trái",
    [
      {
        id: "rabbit",
        ref: "🐰",
        target: true,
        x: SCENE.left,
        y: SCENE.middle,
      },
      { id: "bear", ref: "🐻", x: SCENE.right, y: SCENE.middle },
      { id: "bird", ref: "🐦", x: SCENE.centre, y: SCENE.top },
    ]
  ),
  "GL-C2-DIR-NAV-0010": hiddenObject(
    "Bé tìm chú chim ở phía bên phải nhé!",
    "Chú chim ở bên phải",
    [
      {
        id: "chick",
        ref: "🐥",
        x: SCENE.left,
        y: SCENE.middle,
      },
      {
        id: "bird",
        ref: "🐦",
        target: true,
        x: SCENE.right,
        y: SCENE.middle,
      },
      { id: "bee", ref: "🐝", x: SCENE.centre, y: SCENE.bottom },
    ]
  ),
  "GL-C2-POS-LOC-0014": hiddenObject(
    "Bé tìm chiếc xe đi đằng trước nhé!",
    "Chiếc xe đi đằng trước",
    [
      {
        id: "front",
        ref: "🚘",
        target: true,
        x: SCENE.centre,
        y: SCENE.top,
      },
      { id: "back", ref: "🚕", x: SCENE.centre, y: SCENE.bottom },
      { id: "bus", ref: "🚙", x: SCENE.left, y: SCENE.middle },
    ]
  ),
  "GL-C2-DIR-NAV-0016": hiddenObject(
    "Bé tìm ngôi sao ở phía bên trái nhé!",
    "Ngôi sao ở bên trái",
    [
      {
        id: "star",
        ref: "⭐",
        target: true,
        x: SCENE.left,
        y: SCENE.middle,
      },
      { id: "moon", ref: "🌙", x: SCENE.right, y: SCENE.middle },
      { id: "sun", ref: "☀️", x: SCENE.centre, y: SCENE.top },
    ]
  ),
  "GL-C3-LOG-POS-0011": hiddenObject(
    "Bé tìm bạn đứng đầu hàng nhé!",
    "Bạn đứng đầu hàng",
    [
      {
        id: "first",
        ref: "👧",
        target: true,
        x: SCENE.left,
        y: SCENE.middle,
      },
      { id: "second", ref: "👦", x: SCENE.centre, y: SCENE.middle },
      { id: "third", ref: "👶", x: SCENE.right, y: SCENE.middle },
    ]
  ),
  "GL-C4-OBS-LOC-0009": hiddenObject(
    "Bé tìm cây dừa trong khu vườn nhé!",
    "Cây dừa",
    [
      {
        id: "palm",
        ref: "🌴",
        target: true,
        x: SCENE.centre,
        y: SCENE.middle,
      },
      { id: "rock", ref: "🪨", x: SCENE.left, y: SCENE.bottom },
      {
        id: "tree",
        ref: "🌳",
        x: SCENE.right,
        y: SCENE.middle,
      },
    ]
  ),
  "GL-C4-OBS-LOC-0016": hiddenObject(
    "Bé tìm chú rùa giữa những hòn đá nhé!",
    "Chú rùa",
    [
      {
        id: "turtle",
        ref: "🐢",
        target: true,
        x: SCENE.centre,
        y: SCENE.bottom,
      },
      { id: "rock-1", ref: "🪨", x: SCENE.left, y: SCENE.middle },
      { id: "rock-2", ref: "🪨", x: SCENE.right, y: SCENE.bottom },
      { id: "fish", ref: "🐟", x: SCENE.centre, y: SCENE.top },
    ]
  ),
  "GL-C5-VOC-LOC-0009": hiddenObject(
    "Bé tìm quyển sách trên bàn học nhé!",
    "Quyển sách",
    [
      {
        id: "book",
        ref: "📘",
        target: true,
        x: SCENE.left,
        y: SCENE.middle,
      },
      { id: "pencil", ref: "✏️", x: SCENE.centre, y: SCENE.middle },
      { id: "ruler", ref: "📏", x: SCENE.right, y: SCENE.middle },
    ]
  ),
  "GL-C5-VOC-LOC-0015": hiddenObject(
    "Bé tìm biển báo sang đường nhé!",
    "Biển báo sang đường",
    [
      {
        id: "crosswalk",
        ref: "🚸",
        target: true,
        x: SCENE.centre,
        y: SCENE.middle,
      },
      { id: "stop", ref: "🛑", x: SCENE.left, y: SCENE.middle },
      { id: "car", ref: "🚗", x: SCENE.right, y: SCENE.bottom },
    ]
  ),
  "GL-C6-ATT-LOC-0008": hiddenObject(
    "Bé tìm chú ong giữa vườn hoa nhé!",
    "Chú ong",
    [
      { id: "bee", ref: "🐝", target: true, x: SCENE.right, y: SCENE.top },
      {
        id: "flower-1",
        ref: "🌸",
        x: SCENE.left,
        y: SCENE.bottom,
      },
      { id: "flower-2", ref: "🌺", x: SCENE.centre, y: SCENE.middle },
      { id: "flower-3", ref: "🌻", x: SCENE.right, y: SCENE.bottom },
    ]
  ),
  "GL-C6-ATT-LOC-0014": hiddenObject(
    "Bé tìm viên kim cương giữa các hình tròn nhé!",
    "Viên kim cương",
    [
      {
        id: "gem",
        ref: "💎",
        target: true,
        x: SCENE.centre,
        y: SCENE.middle,
      },
      { id: "circle-1", ref: "🔴", x: SCENE.left, y: SCENE.top },
      { id: "circle-2", ref: "🔵", x: SCENE.right, y: SCENE.top },
      {
        id: "circle-3",
        ref: "🟡",
        x: SCENE.left,
        y: SCENE.bottom,
      },
    ]
  ),

  // ── Nhìn chớp rồi đếm (GT-012) ────────────────────────────────
  "GL-C2-SUB-FAST-0013": {
    ...sortGroups(
      "Bé xếp hình vào đúng rổ theo hình dạng nhé!",
      [
        { id: "round", label: "Rổ hình tròn", labelRef: "🔴" },
        { id: "corner", label: "Rổ hình có góc", labelRef: "🟦" },
      ],
      [
        { id: "circle-red", ref: "🔴", groupId: "round" },
        { id: "circle-blue", ref: "🔵", groupId: "round" },
        { id: "square", ref: "🟦", groupId: "corner" },
        { id: "triangle", ref: "🔺", groupId: "corner" },
      ]
    ),
    title: "Phân loại hình tròn và hình có góc",
    instruction: "Bé xếp hình vào đúng rổ theo hình dạng nhé!",
  },
  "GL-C2-SUB-FAST-0019": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy ngôi sao nhé!",
      "⭐",
      2,
      1200,
      [1, 3]
    ),
    title: "Nhìn nhanh đếm ngôi sao",
    instruction: "Bé nhìn nhanh xem có mấy ngôi sao nhé!",
  },
  "GL-C3-SUB-FAST-0013": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy quả táo nhé!",
      "🍎",
      4,
      1500,
      [3, 5]
    ),
    title: "Nhìn nhanh đếm quả táo",
    instruction: "Bé nhìn nhanh xem có mấy quả táo nhé!",
  },
  "GL-C3-SUB-FAST-0018": {
    ...sortGroups(
      "Bé xếp trái cây và con vật vào đúng rổ nhé!",
      [
        { id: "fruit", label: "Rổ trái cây", labelRef: "🍎" },
        { id: "animal", label: "Rổ con vật", labelRef: "🐱" },
      ],
      [
        { id: "apple", ref: "🍎", groupId: "fruit" },
        { id: "banana", ref: "🍌", groupId: "fruit" },
        { id: "cat", ref: "🐱", groupId: "animal" },
        { id: "dog", ref: "🐶", groupId: "animal" },
      ]
    ),
    title: "Phân loại trái cây và con vật",
    instruction: "Bé xếp trái cây và con vật vào đúng rổ nhé!",
  },
  "GL-C4-SUB-FAST-0010": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy chiếc xe nhé!",
      "🚗",
      3,
      1500,
      [2, 4]
    ),
    title: "Nhìn nhanh đếm chiếc xe",
    instruction: "Bé nhìn nhanh xem có mấy chiếc xe nhé!",
  },
  "GL-C4-SUB-FAST-0015": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy chú gấu bông nhé!",
      "🧸",
      2,
      1200,
      [1, 3]
    ),
    title: "Nhìn nhanh đếm gấu bông",
    instruction: "Bé nhìn nhanh xem có mấy gấu bông nhé!",
  },
  "GL-C4-SUB-FAST-0019": {
    ...sortGroups(
      "Bé xếp quả bóng vào đúng rổ theo màu nhé!",
      [
        { id: "red", label: "Rổ màu đỏ", labelRef: "🔴" },
        { id: "blue", label: "Rổ màu xanh", labelRef: "🔵" },
      ],
      [
        { id: "r1", ref: "🔴", groupId: "red" },
        { id: "r2", ref: "🍎", groupId: "red" },
        { id: "b1", ref: "🔵", groupId: "blue" },
        { id: "b2", ref: "🟦", groupId: "blue" },
      ]
    ),
    title: "Phân loại theo màu đỏ và xanh",
    instruction: "Bé xếp quả bóng vào đúng rổ theo màu nhé!",
  },
  "GL-C5-SUB-FAST-0010": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy quả táo nhé!",
      "🍎",
      2,
      1500,
      [1, 3]
    ),
    title: "Nhìn nhanh đếm quả táo",
    instruction: "Bé nhìn nhanh xem có mấy quả táo nhé!",
  },
  "GL-C5-SUB-FAST-0016": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy tên lửa nhé!",
      "🚀",
      3,
      1200,
      [2, 4]
    ),
    title: "Nhìn nhanh đếm tên lửa",
    instruction: "Bé nhìn nhanh xem có mấy tên lửa nhé!",
  },
  "GL-C5-SUB-FAST-0020": {
    ...sortGroups(
      "Bé xếp khuôn mặt vào đúng rổ vui hoặc buồn nhé!",
      [
        { id: "happy", label: "Rổ khuôn mặt vui", labelRef: "😄" },
        { id: "sad", label: "Rổ khuôn mặt buồn", labelRef: "😢" },
      ],
      [
        { id: "h1", ref: "😄", groupId: "happy" },
        { id: "h2", ref: "😍", groupId: "happy" },
        { id: "s1", ref: "😢", groupId: "sad" },
        { id: "s2", ref: "🐭", groupId: "sad" },
      ]
    ),
    title: "Phân loại khuôn mặt vui và buồn",
    instruction: "Bé xếp khuôn mặt vào đúng rổ vui hoặc buồn nhé!",
  },
  "GL-C6-SUB-FAST-0009": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy tên lửa nhé!",
      "🚀",
      1,
      1500,
      [2, 3]
    ),
    title: "Nhìn nhanh đếm tên lửa",
    instruction: "Bé nhìn nhanh xem có mấy tên lửa nhé!",
  },
  "GL-C6-SUB-FAST-0013": {
    ...flashCount(
      "Bé nhìn nhanh xem có mấy quả chuối nhé!",
      "🍌",
      5,
      1200,
      [4, 6]
    ),
    title: "Nhìn nhanh đếm quả chuối",
    instruction: "Bé nhìn nhanh xem có mấy quả chuối nhé!",
  },

  // ── Nối hoạt động với giờ (GT-016) ────────────────────────────
  "GL-C1-CLK-HND-0039": clockMatch(
    "Bé chọn hoạt động diễn ra lúc 9 giờ tối nhé!",
    { hour: 9, minute: 0 },
    [
      { id: "sleep", ref: "🛏️", name: "Bé đi ngủ", hour: 9, minute: 0 },
      {
        id: "school",
        ref: "📘",
        name: "Bé học bài",
        hour: 8,
        minute: 0,
      },
      {
        id: "sun",
        ref: "☀️",
        name: "Bé dậy buổi sáng",
        hour: 6,
        minute: 30,
      },
    ]
  ),
};
