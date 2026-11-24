/**
 * @mindkid/emoji — Batch 4 Custom Realistic Sprite Catalog (94 mục mở rộng đa chủ đề)
 * Phủ trọn khủng long/cổ sinh, động vật thực tế, ẩm thực/văn hoá Việt, phương tiện, khoa học, đồ chơi & thể thao.
 */

import { sprite } from "#src/sprite-helpers";
import type { EmojiSpriteMeta } from "#src/types";

export const BATCH_4_SPRITES: readonly EmojiSpriteMeta[] = [
  // Động vật & Cổ sinh (10)
  sprite("🦕", "sauropod-dino", "Khủng long cổ dài"),
  sprite("🐦‍🔥", "fire-phoenix", "Chim phượng hoàng"),
  sprite("🦠", "green-microbe", "Vi sinh vật nhỏ"),
  sprite("🦡", "forest-badger", "Con lửng rừng"),
  sprite("🫏", "gray-donkey", "Con lừa xám"),
  sprite("🐏", "horned-ram", "Con cừu sừng xoắn"),
  sprite("🦮", "guide-dog", "Chó dẫn đường"),
  sprite("🐈‍⬛", "black-cat", "Con mèo mun"),
  sprite("🐹", "cute-hamster", "Chuột Hamster"),
  sprite("🪽", "feathered-wing", "Đôi cánh chim"),

  // Thực vật, Văn hoá Việt & Ẩm thực (24)
  sprite("🍄‍🟫", "shiitake-mushroom", "Nấm hương nâu"),
  sprite("🥀", "wilted-rose", "Hoa hồng rũ cánh"),
  sprite("🫔", "banana-leaf-cake", "Bánh gói lá chuối"),
  sprite("🍘", "sesame-rice-cracker", "Bánh đa vừng nướng"),
  sprite("🍢", "fishcake-skewer", "Xiên chả cá viên"),
  sprite("🧋", "pearl-milk-tea", "Ly trà sữa trân châu"),
  sprite("🍨", "sundae-ice-cream", "Ly kem tươi mát"),
  sprite("🥯", "sesame-bagel", "Bánh mì vòng"),
  sprite("🥨", "twisted-pretzel", "Bánh quy xoắn"),
  sprite("🫓", "warm-flatbread", "Bánh nướng dẹt"),
  sprite("🥪", "veggie-sandwich", "Bánh mì kẹp rau"),
  sprite("🥙", "stuffed-pita", "Bánh kẹp nhân đầy"),
  sprite("🧆", "crispy-falafel", "Viên đậu chiên giòn"),
  sprite("🥓", "seared-bacon", "Lát thịt áp chảo"),
  sprite("🥩", "fresh-steak", "Miếng thịt tươi"),
  sprite("🍗", "roasted-drumstick", "Đùi gà nướng vàng"),
  sprite("🍖", "grilled-rib", "Khúc sườn nướng"),
  sprite("🌭", "sausage-hotdog", "Bánh mì xúc xích"),
  sprite("🍝", "tomato-spaghetti", "Đĩa mì sốt cà chua"),
  sprite("🍛", "golden-curry-rice", "Đĩa cơm sốt cà ri"),
  sprite("🍣", "salmon-sushi", "Cơm cuộn cá tươi"),
  sprite("🍤", "fried-tempura-shrimp", "Tôm chiên xù vàng"),
  sprite("🍥", "swirl-fishcake", "Khoanh chả cá xoắn"),
  sprite("🥠", "folded-fortune-cookie", "Bánh quy giòn gấp"),

  // Phương tiện giao thông Đường không, Sắt, Thuỷ, Bộ (15)
  sprite("🛫", "takeoff-airplane", "Máy bay cất cánh"),
  sprite("🛬", "landing-airplane", "Máy bay hạ cánh"),
  sprite("🚟", "suspension-skytrain", "Tàu treo trên không"),
  sprite("🚠", "mountain-gondola", "Cáp treo vượt núi"),
  sprite("🚡", "aerial-cable-car", "Cabin cáp treo nhỏ"),
  sprite("🚊", "city-tram", "Tàu điện thành phố"),
  sprite("🚋", "vintage-tram-car", "Toa tàu điện leng keng"),
  sprite("🛟", "rescue-lifebuoy", "Phao cứu sinh tròn"),
  sprite("🛺", "three-wheel-tuktuk", "Xe lam ba bánh"),
  sprite("🚍", "front-city-bus", "Xe buýt đón khách"),
  sprite("🚖", "yellow-cab-front", "Xe taxi vàng"),
  sprite("🛼", "quad-roller-skate", "Giày trượt bốn bánh"),
  sprite("🚏", "bus-stop-sign", "Trạm dừng xe buýt"),
  sprite("🛣️", "open-highway", "Đường cao tốc rộng"),
  sprite("🚥", "horizontal-traffic-light", "Đèn giao thông ngang"),

  // Khoa học, Y học & Nghề nghiệp (11)
  sprite("🧫", "lab-petri-dish", "Đĩa nuôi cấy vi sinh"),
  sprite("🧬", "dna-double-helix", "Chuỗi xoắn di truyền"),
  sprite("📡", "satellite-dish", "Ăng-ten chảo vệ tinh"),
  sprite("🩻", "chest-xray", "Phim chụp X-quang"),
  sprite("🩹", "medical-bandage", "Băng cá nhân y tế"),
  sprite("🩼", "wooden-crutch", "Chiếc nạng gỗ hỗ trợ"),
  sprite("🧑‍🔬", "lab-scientist", "Nhà khoa học"),
  sprite("🧑‍💻", "software-engineer", "Kỹ sư máy tính"),
  sprite("🧑‍🔧", "machine-mechanic", "Thợ sửa máy"),
  sprite("🧑‍💼", "office-specialist", "Nhân viên văn phòng"),
  sprite("🧑‍🎤", "pop-vocalist", "Ca sĩ biểu diễn"),

  // Đồ chơi, Nhạc cụ & Thủ công (10)
  sprite("🪆", "wooden-nesting-doll", "Búp bê gỗ lồng nhau"),
  sprite("🎠", "carousel-wooden-horse", "Ngựa gỗ vòng quay"),
  sprite("🎢", "park-roller-coaster", "Tàu lượn công viên"),
  sprite("♟️", "wooden-chess-pawn", "Quân cờ vua gỗ"),
  sprite("🪗", "red-accordion", "Đàn phong cầm"),
  sprite("🎙️", "studio-microphone", "Micrô thu âm"),
  sprite("🎚️", "audio-fader-slider", "Thanh trượt âm lượng"),
  sprite("🎛️", "mixer-control-knobs", "Bàn xoay chỉnh âm"),
  sprite("🧵", "colorful-thread-spool", "Cuộn chỉ màu"),
  sprite("🪡", "threaded-sewing-needle", "Kim khâu luồn chỉ"),

  // Thể thao & Vận động (14)
  sprite("🏉", "striped-rugby-ball", "Bóng bầu dục sọc"),
  sprite("⚾", "stitched-baseball", "Quả bóng chày trắng"),
  sprite("🥎", "yellow-softball", "Quả bóng mềm vàng"),
  sprite("🏏", "wooden-cricket-bat", "Bộ gậy bóng gậy"),
  sprite("🏑", "field-hockey-stick", "Gậy khúc côn cầu cỏ"),
  sprite("🏒", "ice-hockey-stick", "Khúc côn cầu trên băng"),
  sprite("🥍", "netted-lacrosse-stick", "Cây vợt lưới bóng"),
  sprite("🥊", "red-boxing-glove", "Găng tay tập võ"),
  sprite("🥅", "soccer-goal-net", "Khung thành bóng đá"),
  sprite("⛳", "green-golf-flag", "Cờ lỗ sân cỏ"),
  sprite("🎽", "track-running-vest", "Áo chạy điền kinh"),
  sprite("🎿", "alpine-snow-skis", "Đôi ván trượt tuyết"),
  sprite("🛷", "wooden-snow-sled", "Xe trượt tuyết gỗ"),
  sprite("🥌", "granite-curling-stone", "Đá trượt trên băng"),

  // Trường học, Dụng cụ & Đời sống (10)
  sprite("📔", "floral-cover-notebook", "Sổ tay bìa hoa"),
  sprite("📃", "curled-worksheet-page", "Trang giấy viết bài"),
  sprite("🔖", "ribbon-bookmark", "Thẻ đánh dấu sách"),
  sprite("🖋️", "classic-fountain-pen", "Bút máy luyện chữ"),
  sprite("✒️", "steel-pen-nib", "Ngòi bút mực"),
  sprite("🖇️", "linked-paperclips", "Đôi kẹp giấy lồng"),
  sprite("⚒️", "crossed-forging-hammers", "Đôi búa thợ rèn"),
  sprite("🛠️", "hammer-and-wrench", "Bộ búa và cờ-lê"),
  sprite("🪤", "wooden-spring-trap", "Chiếc bẫy gỗ lò xo"),
  sprite("📰", "morning-newspaper", "Tờ báo buổi sáng"),
  sprite("🗞️", "rolled-newspaper", "Cuộn báo giấy"),
];
