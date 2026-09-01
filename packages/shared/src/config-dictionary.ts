export interface FieldDictionaryEntry {
  label: string;
  help?: string;
  placeholder?: string;
}

export const CONFIG_DICTIONARY: Record<string, FieldDictionaryEntry> = {
  // Common / Top-level
  prompt: {
    label: "Câu hỏi / lời nhắc cho bé",
    help: "Ngắn gọn, dưới 12 từ, đọc thành tiếng được.",
  },
  prompt_audio_ref: {
    label: "Âm thanh đọc câu hỏi",
    help: "File ghi âm đọc câu hỏi tiếng Việt cho bé.",
  },
  title: {
    label: "Tiêu đề bài học",
    help: "Tiêu đề ngắn gọn hiển thị trong danh mục.",
  },
  instruction: {
    label: "Hướng dẫn thực hiện",
    help: "Chỉ dẫn thao tác cho bé hoặc người lớn.",
  },
  access_tier: {
    label: "Gói quyền truy cập",
    help: "Bậc quyền tối thiểu để chơi level này (free/login/standard/premium).",
  },
  theme_id: {
    label: "Chủ đề giao diện",
    help: "Bộ hình nền và chủ đề thẩm mỹ của màn chơi.",
  },

  // Item / Asset / Options / Common IDs
  id: {
    label: "Mã định danh",
    help: "Mã định danh duy nhất của đối tượng.",
  },
  item_id: {
    label: "Mã định danh vật phẩm",
    help: "Mã định danh duy nhất của vật phẩm trong bài học.",
  },
  target_item: {
    label: "Vật phẩm mục tiêu",
    help: "Vật phẩm mẫu mà bé cần tìm hoặc so khớp.",
  },
  asset: {
    label: "Tài nguyên hiển thị",
    help: "Emoji hoặc hình ảnh minh họa cho vật phẩm.",
  },
  options: {
    label: "Danh sách lựa chọn",
    help: "Các phương án hiển thị để bé chọn.",
  },
  items: {
    label: "Danh sách vật phẩm",
    help: "Các đối tượng tương tác trong màn chơi.",
  },
  is_correct: {
    label: "Đáp án đúng",
    help: "Bật nếu đây là lựa chọn chính xác.",
  },
  is_target: {
    label: "Là phần mục tiêu cần tìm",
    help: "Đánh dấu đây là mảnh ghép mục tiêu cần nhận diện.",
  },
  target_criterion: {
    label: "Tiêu chí chọn mục tiêu",
    help: "Đặc điểm hoặc thuộc tính cần bé nhận diện.",
  },
  container: {
    label: "Vùng chứa / Đích đến",
    help: "Khu vực thả vật phẩm vào.",
  },
  container_id: {
    label: "Mã vùng chứa",
    help: "Mã định danh vùng chứa đích.",
  },
  accepts_attribute: {
    label: "Thuộc tính chấp nhận",
    help: "Thuộc tính hợp lệ để thả vào vùng chứa này.",
  },
  attribute: {
    label: "Thuộc tính vật phẩm",
    help: "Thuộc tính phân loại của vật phẩm (màu sắc, hình dạng, loại).",
  },
  groups: {
    label: "Danh sách nhóm",
    help: "Các nhóm phân loại đối tượng.",
  },
  group_id: {
    label: "Mã nhóm",
    help: "Mã định danh nhóm (ví dụ g1, g2).",
  },
  label: {
    label: "Nhãn hiển thị",
    help: "Tên nhãn ngắn gọn của nhóm hoặc bước.",
  },
  label_emoji: {
    label: "Emoji đại diện cho nhóm",
    help: "Biểu tượng emoji đại diện cho nhãn nhóm.",
  },
  correct_group_id: {
    label: "Nhóm đích đúng",
    help: "Mã nhóm mà vật phẩm này thuộc về.",
  },
  pairs: {
    label: "Danh sách các cặp ghép",
    help: "Các cặp đối tượng tương ứng cần nối với nhau.",
  },
  pair_id: {
    label: "Mã cặp ghép",
    help: "Mã định danh của cặp đối tượng.",
  },
  left: {
    label: "Đối tượng bên trái / vế trái",
    help: "Vật phẩm phía nguồn, bên trái hoặc vế trái phương trình.",
  },
  right: {
    label: "Đối tượng bên phải",
    help: "Vật phẩm phía đích / bên phải.",
  },
  sequence: {
    label: "Chuỗi thứ tự",
    help: "Các bước cần sắp xếp theo đúng trình tự.",
  },
  step_id: {
    label: "Mã bước",
    help: "Mã định danh bước trong chuỗi.",
  },
  order_index: {
    label: "Thứ tự chính xác",
    help: "Vị trí số thứ tự bắt đầu từ 0.",
  },

  // Montessori Templates (GT-007..GT-017)
  whole: {
    label: "Hình thể toàn phần",
    help: "Hình ảnh hoàn chỉnh trước khi phân rã thành các phần.",
  },
  parts: {
    label: "Danh sách các bộ phận",
    help: "Các mảnh ghép cấu thành hình thể.",
  },
  part_count: {
    label: "Số lượng mảnh ghép",
    help: "Tổng số phần rã của hình thể.",
  },
  slots: {
    label: "Danh sách vị trí đích",
    help: "Các ô trống quy luật cần đặt hình vào.",
  },
  slot_id: {
    label: "Mã vị trí đích",
    help: "Mã định danh của ô trống.",
  },
  expected_item_id: {
    label: "Mã vật phẩm kỳ vọng",
    help: "Mã vật phẩm đúng cho ô trống quy luật.",
  },
  slot_count: {
    label: "Số lượng ô trống quy luật",
    help: "Số ô cần điền trong chuỗi quy luật.",
  },
  candidates: {
    label: "Danh sách đối tượng khả dĩ",
    help: "Các đối tượng ứng viên để bé loại trừ.",
  },
  candidate_id: {
    label: "Mã đối tượng ứng viên",
    help: "Mã định danh đối tượng trong bài toán suy luận.",
  },
  clues: {
    label: "Danh sách manh mối",
    help: "Các gợi ý suy luận từng bước.",
  },
  clue_id: {
    label: "Mã manh mối",
    help: "Mã định danh manh mối.",
  },
  text: {
    label: "Nội dung manh mối / văn bản",
    help: "Câu văn bản gợi ý cho bé.",
  },
  predicate: {
    label: "Hàm kiểm tra vị từ",
    help: "Hàm logic đánh giá thuộc tính manh mối.",
  },
  clue_count: {
    label: "Số lượng manh mối",
    help: "Số manh mối đưa ra để bé suy luận.",
  },
  candidate_count: {
    label: "Số lượng đối tượng ứng viên",
    help: "Tổng số ứng viên trong bài toán loại trừ.",
  },
  answer_candidate_id: {
    label: "Đáp án đối tượng đúng",
    help: "Mã đối tượng ứng viên là câu trả lời đúng.",
  },
  symbols: {
    label: "Danh sách biểu tượng",
    help: "Các biểu tượng đại diện cho giá trị ẩn số.",
  },
  symbol_id: {
    label: "Mã biểu tượng",
    help: "Mã định danh biểu tượng ẩn số.",
  },
  equations: {
    label: "Danh sách phương trình hình ảnh",
    help: "Các phương trình hình học / hình ảnh cho bé giải.",
  },
  equation_id: {
    label: "Mã phương trình",
    help: "Mã định danh phương trình.",
  },
  equation_count: {
    label: "Số lượng phương trình",
    help: "Số phương trình trong hệ.",
  },
  step_count: {
    label: "Số bước suy luận",
    help: "Số bước giải phương trình.",
  },
  right_value: {
    label: "Giá trị vế phải",
    help: "Tổng hoặc kết quả ở vế phải phương trình.",
  },
  question: {
    label: "Câu hỏi mục tiêu",
    help: "Ẩn số hoặc tổng biểu tượng bé cần tính toán.",
  },
  matrix: {
    label: "Ma trận hình ảnh",
    help: "Lưới quy luật 2×2 hoặc 3×3.",
  },
  rows: {
    label: "Số hàng",
    help: "Số lượng hàng trong ma trận quy luật.",
  },
  cols: {
    label: "Số cột",
    help: "Số lượng cột trong ma trận quy luật.",
  },
  rule_type: {
    label: "Dạng quy luật",
    help: "Quy luật biến đổi theo hàng, cột hoặc tịnh tiến.",
  },
  missing_position: {
    label: "Vị trí ô còn thiếu",
    help: "Toạ độ ô cần điền đáp án trong ma trận.",
  },
  option_id: {
    label: "Mã phương án lựa chọn",
    help: "Mã định danh của phương án chọn.",
  },
  grid: {
    label: "Lưới bản đồ / mê cung",
    help: "Cấu trúc lưới mê cung.",
  },
  walls: {
    label: "Danh sách tường ngăn",
    help: "Các bức tường ngăn cách trong mê cung.",
  },
  side: {
    label: "Cạnh tường",
    help: "Hướng của tường (top, bottom, left, right).",
  },
  start: {
    label: "Điểm bắt đầu",
    help: "Toạ độ ô xuất phát.",
  },
  required_cells: {
    label: "Các ô bắt buộc đi qua",
    help: "Danh sách toạ độ các chốt kiểm soát bé phải đi qua.",
  },
  input_mode: {
    label: "Chế độ điều khiển",
    help: "Vẽ đường trực tiếp (drag) hoặc ấn mũi tên (step).",
  },
  dead_end_count: {
    label: "Số lượng đường cụt",
    help: "Số ngõ cụt được sinh ra trong mê cung.",
  },
  required_cell_count: {
    label: "Số ô bắt buộc",
    help: "Số lượng trạm kiểm soát trong mê cung.",
  },
  grid_size: {
    label: "Kích thước lưới",
    help: "Kích thước cạnh của lưới (2×2, 3×3, 4×4).",
  },
  arrangement: {
    label: "Cách sắp xếp vật thể chớp",
    help: "Bố cục hiển thị các chấm/vật thể (theo mặt xúc xắc, lưới, ngẫu nhiên).",
  },
  flash_items: {
    label: "Danh sách vật phẩm chớp",
    help: "Các vật thể xuất hiện chớp nhoáng rồi ẩn đi.",
  },
  value: {
    label: "Giá trị số",
    help: "Giá trị số lượng hoặc số đếm.",
  },
  flash_ms: {
    label: "Thời gian chớp (mili-giây)",
    help: "Thời lượng vật thể hiển thị trước khi ẩn (tối thiểu 800ms).",
  },
  paths: {
    label: "Danh sách lối đi",
    help: "Các đường đi trong mê cung.",
  },
  correct_path_id: {
    label: "Đường đi đúng",
    help: "Mã lối đi dẫn đến đích.",
  },
  distractor_paths: {
    label: "Số đường cụt / đường nhiễu",
    help: "Số lượng ngã rẽ cụt.",
  },
  branching: {
    label: "Độ phân nhánh",
    help: "Số ngã rẽ trong mê cung.",
  },
  dead_ends: {
    label: "Số đường cụt",
    help: "Số lượng ngõ cụt bé cần tránh.",
  },
  goal: {
    label: "Mục tiêu bài toán cân",
    help: "Cân bằng hai đĩa hoặc chọn bên nặng hơn/nhẹ hơn.",
  },
  left_pan: {
    label: "Vật phẩm trên đĩa trái",
    help: "Danh sách vật trên đĩa cân bên trái.",
  },
  right_pan: {
    label: "Vật phẩm trên đĩa phải",
    help: "Danh sách vật trên đĩa cân bên phải.",
  },
  tray: {
    label: "Khay chứa vật phẩm",
    help: "Các quả cân hoặc vật phẩm có sẵn trên bàn để bé đặt lên đĩa.",
  },
  target_side: {
    label: "Bên mục tiêu",
    help: "Đĩa cân mục tiêu (trái hoặc phải).",
  },
  weight: {
    label: "Trọng lượng vật phẩm",
    help: "Khối lượng tương đối của vật phẩm (số nguyên dương).",
  },
  max_weight: {
    label: "Trọng lượng tối đa",
    help: "Giới hạn tải trọng tối đa của một đĩa cân.",
  },
  item_count: {
    label: "Số lượng vật phẩm",
    help: "Tổng số vật phẩm có trong màn chơi.",
  },
  tray_count: {
    label: "Số vật phẩm trong khay",
    help: "Số lượng vật phẩm chờ đặt lên đĩa cân.",
  },
  weight_span: {
    label: "Biên độ chênh lệch trọng lượng",
    help: "Khoảng cách trọng lượng tối đa giữa hai đĩa.",
  },
  cells: {
    label: "Danh sách các ô lưới",
    help: "Toạ độ và trạng thái các ô trong lưới Sudoku.",
  },
  row: {
    label: "Chỉ số hàng",
    help: "Vị trí hàng bắt đầu từ 0.",
  },
  col: {
    label: "Chỉ số cột",
    help: "Vị trí cột bắt đầu từ 0.",
  },
  regions: {
    label: "Chế độ kiểm tra vùng",
    help: "Ràng buộc chỉ hàng/cột hay gồm cả vùng 2×2.",
  },
  blank_count: {
    label: "Số ô trống cần điền",
    help: "Số ô bé cần suy luận điền vào lưới.",
  },
  mode: {
    label: "Chế độ chơi đồng hồ",
    help: "Đọc giờ, xoay kim giờ hoặc ghép nối thẻ hoạt động.",
  },
  target_time: {
    label: "Thời gian mục tiêu",
    help: "Mốc giờ:phút bé cần nhận diện hoặc quay tới.",
  },
  hour: {
    label: "Giờ",
    help: "Số giờ từ 1 đến 12.",
  },
  minute: {
    label: "Phút",
    help: "Số phút (0 hoặc 30).",
  },
  initial_time: {
    label: "Thời gian ban đầu",
    help: "Vị trí kim đồng hồ khi bắt đầu màn chơi.",
  },
  activity_cards: {
    label: "Danh sách thẻ hoạt động",
    help: "Các thẻ mô tả sinh hoạt gắn với giờ trong ngày.",
  },
  card_id: {
    label: "Mã thẻ hoạt động",
    help: "Mã định danh thẻ sinh hoạt.",
  },
  minute_step: {
    label: "Bước nhảy kim phút",
    help: "Bước nhảy tối thiểu khi quay kim (30 hoặc 60 phút).",
  },
  model: {
    label: "Mô hình khối 3D",
    help: "Danh sách toạ độ các khối lập phương trong không gian 3D.",
  },
  x: {
    label: "Toạ độ X",
    help: "Vị trí trục X.",
  },
  y: {
    label: "Toạ độ Y",
    help: "Vị trí trục Y.",
  },
  z: {
    label: "Toạ độ Z (độ cao)",
    help: "Vị trí tầng / chiều cao của khối lập phương.",
  },
  colorToken: {
    label: "Màu sắc khối",
    help: "Token màu thương hiệu của khối lập phương.",
  },
  hidden_cube_count: {
    label: "Số khối bị che khuất",
    help: "Số lượng khối lập phương nằm sau các khối khác.",
  },
  allow_rotate: {
    label: "Cho phép xoay mô hình 3D",
    help: "Bé có thể ấn nút xoay để nhìn từ các góc khác nhau.",
  },

  // Difficulty parameters
  distractor_count: {
    label: "Số vật gây nhiễu",
    help: "Số lượng vật phẩm không đúng đưa vào để tăng độ khó (0 là dễ nhất).",
  },
  target_count: {
    label: "Số lượng mục tiêu",
    help: "Số lượng đáp án đúng bé cần tìm.",
  },
  hint_after_ms: {
    label: "Thời gian gợi ý (mili-giây)",
    help: "Thời gian chờ trước khi kích hoạt gợi ý tự động.",
  },
  allow_retry: {
    label: "Cho phép thử lại",
    help: "Bé được chọn lại khi trả lời chưa đúng mà không bị phạt.",
  },
  allow_replay: {
    label: "Cho phép xem lại",
    help: "Bé có thể bấm nút xem lại chớp ảnh.",
  },
  shuffle_items: {
    label: "Xáo trộn vị trí vật phẩm",
    help: "Tự động đảo thứ tự hiển thị mỗi lượt chơi.",
  },
  shuffle_sides: {
    label: "Xáo trộn hai cột",
    help: "Đảo ngẫu nhiên vị trí các thẻ ở hai bên.",
  },
  shuffle_initial: {
    label: "Xáo trộn vị trí ban đầu",
    help: "Đảo lộn thứ tự ban đầu để bé sắp xếp lại.",
  },

  // Legacy v1 templates (GT-018..024)
  audio_prompt: {
    label: "Lời nhắc âm thanh",
    help: "Cấu hình âm thanh lời nhắc hoặc chỉ dẫn nghe cho bé.",
  },
  audio_url: {
    label: "Đường dẫn file âm thanh",
    help: "Đường dẫn file âm thanh chỉ dẫn.",
  },
  response_mode: {
    label: "Chế độ phản hồi",
    help: "Chế độ phản hồi: chọn một (select) hoặc sắp xếp chuỗi (sequence).",
  },
  target_sequence: {
    label: "Chuỗi mục tiêu đúng",
    help: "Thứ tự danh sách mã vật phẩm đúng theo yêu cầu.",
  },
  auto_play_audio: {
    label: "Tự động phát âm thanh",
    help: "Tự động phát câu hỏi/chỉ dẫn khi bắt đầu lượt chơi.",
  },
  target_slots: {
    label: "Danh sách ô đích",
    help: "Các ô đích cần hoàn thiện hoặc ghép vào.",
  },
  target_rotation: {
    label: "Góc quay mục tiêu",
    help: "Góc quay mong đợi của ô đích (0, 90, 180, 270 độ).",
  },
  target_flip: {
    label: "Trục lật mục tiêu",
    help: "Trạng thái lật đối xứng mong đợi của ô đích.",
  },
  pieces: {
    label: "Danh sách mảnh ghép",
    help: "Các mảnh ghép bé cần xoay, lật hoặc lắp ghép.",
  },
  piece_id: {
    label: "Mã mảnh ghép",
    help: "Mã định danh duy nhất của mảnh ghép.",
  },
  initial_rotation: {
    label: "Góc quay ban đầu",
    help: "Góc xoay khởi tạo của mảnh ghép (0, 90, 180, 270 độ).",
  },
  initial_flip: {
    label: "Trạng thái lật ban đầu",
    help: "Trạng thái lật ban đầu của mảnh ghép.",
  },
  target_slot_id: {
    label: "Mã ô đích tương ứng",
    help: "Mã định danh của ô đích mà mảnh ghép cần đặt vào.",
  },
  allow_flip: {
    label: "Cho phép lật hình",
    help: "Bật nút lật đối xứng mảnh ghép.",
  },
  rotation_step: {
    label: "Bước xoay (độ)",
    help: "Góc xoay mỗi lần bấm nút (mặc định 90 độ).",
  },
  pair_key: {
    label: "Khóa liên kết cặp",
    help: "Khóa định danh chung của hai thẻ cùng cặp.",
  },
  card_a: {
    label: "Thẻ thứ nhất trong cặp",
    help: "Thông tin thẻ A.",
  },
  card_b: {
    label: "Thẻ thứ hai trong cặp",
    help: "Thông tin thẻ B.",
  },
  flip_back_delay_ms: {
    label: "Thời gian chờ úp lại (ms)",
    help: "Thời gian thẻ mở trước khi tự động úp lại nếu ghép sai.",
  },
  peek_all_initial_ms: {
    label: "Thời gian xem trước ban đầu (ms)",
    help: "Thời gian lật mở toàn bộ thẻ lúc đầu cho bé ghi nhớ.",
  },
  axis: {
    label: "Trục đối xứng",
    help: "Trục đối xứng đứng (vertical) hoặc ngang (horizontal).",
  },
  reference_pattern: {
    label: "Mẫu tham chiếu",
    help: "Mẫu hình nửa bên trái làm chuẩn đối xứng.",
  },
  expected_asset_ref: {
    label: "Tài nguyên mong đợi",
    help: "Mã tham chiếu của tài nguyên khớp đối xứng.",
  },
  asset_ref: {
    label: "Mã tham chiếu tài nguyên",
    help: "Mã định danh tham chiếu của hình ảnh hoặc emoji.",
  },
  show_axis_guide: {
    label: "Hiện đường trục đối xứng",
    help: "Hiển thị nét đứt trục đối xứng làm mốc định hướng.",
  },
  target_description: {
    label: "Mô tả mục tiêu cần tìm",
    help: "Mô tả ngắn về vật thể bé cần tìm trong tranh.",
  },
  scene_objects: {
    label: "Danh sách vật thể trong cảnh",
    help: "Các đối tượng nằm trong khung cảnh.",
  },
  is_hidden: {
    label: "Ẩn sau vật che khuất",
    help: "Vật thể bị che khuất và cần chạm mở trước khi tìm.",
  },
  show_target_counter: {
    label: "Hiện bộ đếm mục tiêu",
    help: "Hiển thị số lượng mục tiêu đã tìm được / tổng số.",
  },
  target_model: {
    label: "Mô hình mẫu hoàn chỉnh",
    help: "Hình ảnh hoặc tên của vật thể cần lắp ráp thành.",
  },
  name: {
    label: "Tên hiển thị",
    help: "Tên gọi của vật thể hoặc bộ phận.",
  },
  anchors: {
    label: "Danh sách điểm gắn / neo",
    help: "Các vị trí neo để gắn bộ phận vào.",
  },
  anchor_id: {
    label: "Mã điểm neo",
    help: "Mã định danh điểm neo gắn kết.",
  },
  accepted_part_id: {
    label: "Mã bộ phận chấp nhận",
    help: "Mã bộ phận hợp lệ để gắn vào điểm neo này.",
  },
  part_id: {
    label: "Mã bộ phận",
    help: "Mã định danh duy nhất của bộ phận.",
  },
  target_anchor_id: {
    label: "Mã điểm neo đích",
    help: "Điểm neo mà bộ phận này cần gắn vào.",
  },
  snap_radius_px: {
    label: "Bán kính tự hít (pixel)",
    help: "Khoảng cách tự động hít bộ phận vào điểm neo.",
  },
  show_anchor_outline: {
    label: "Hiện viền điểm neo",
    help: "Hiển thị đường viền mờ của khung neo hướng dẫn bé.",
  },
  shape_name: {
    label: "Tên hình cần vẽ",
    help: "Tên của hình học hoặc đối tượng cần nối điểm.",
  },
  guide_asset: {
    label: "Hình mẫu hướng dẫn",
    help: "Hình ảnh hoặc emoji mẫu của hình cần vẽ.",
  },
  waypoints: {
    label: "Danh sách điểm mốc nối",
    help: "Chuỗi các điểm neo cần nối theo thứ tự.",
  },
  order: {
    label: "Thứ tự nối",
    help: "Số thứ tự bước nối của điểm mốc.",
  },
  tolerance_px: {
    label: "Dung sai độ chính xác (pixel)",
    help: "Khoảng cách chấp nhận khi bé chạm/nối gần điểm mốc.",
  },
  show_numbered_dots: {
    label: "Hiện số thứ tự trên điểm",
    help: "Hiển thị số 1, 2, 3... trên các điểm mốc.",
  },
  show_guide_lines: {
    label: "Hiện đường nét đứt hướng dẫn",
    help: "Hiển thị đường nét đứt nối sẵn làm mẫu.",
  },
  // GT-025 spot-difference
  left_objects: {
    label: "Danh sách vật thể hình bên trái",
    help: "Các đối tượng hiển thị ở nửa bên trái màn hình.",
  },
  right_objects: {
    label: "Danh sách vật thể hình bên phải",
    help: "Các đối tượng hiển thị ở nửa bên phải màn hình.",
  },
  differences: {
    label: "Danh sách điểm khác nhau",
    help: "Các cặp đối tượng có sự khác biệt giữa hai bên hình.",
  },
  left_id: {
    label: "Mã vật thể bên trái",
    help: "Mã định danh của vật thể ở hình bên trái.",
  },
  right_id: {
    label: "Mã vật thể bên phải",
    help: "Mã định danh của vật thể ở hình bên phải.",
  },
  description: {
    label: "Mô tả chi tiết",
    help: "Nội dung mô tả điểm khác biệt hoặc quy luật.",
  },
  show_counter: {
    label: "Hiển thị bộ đếm số lượng",
    help: "Bật/tắt hiển thị số điểm khác biệt đã tìm thấy.",
  },
  // GT-026 go-nogo
  go_stimulus: {
    label: "Đối tượng chạm (Go)",
    help: "Kích thích mà bé phải chạm vào khi xuất hiện.",
  },
  nogo_stimulus: {
    label: "Đối tượng dừng (No-Go)",
    help: "Kích thích mà bé phải kìm lại, không được chạm vào.",
  },
  trials: {
    label: "Danh sách lượt xuất hiện",
    help: "Trình tự các lượt xuất hiện của kích thích trong màn chơi.",
  },
  kind: {
    label: "Loại kích thích",
    help: "Phân loại kích thích là go hay nogo.",
  },
  stimulus_window_ms: {
    label: "Thời gian xuất hiện (ms)",
    help: "Khoảng thời gian kích thích hiển thị trên màn hình trước khi biến mất.",
  },
  isi_ms: {
    label: "Thời gian nghỉ giữa 2 lượt (ms)",
    help: "Khoảng thời gian trống giữa hai lượt kích thích liên tiếp.",
  },
  // GT-027 rule-switch
  rules: {
    label: "Danh sách quy luật",
    help: "Các quy luật phân loại lần lượt áp dụng trong màn chơi.",
  },
  dimension: {
    label: "Thuộc tính phân loại",
    help: "Chiều thuộc tính đang dùng để xét luật (color, shape, size).",
  },
  target_value: {
    label: "Giá trị mục tiêu",
    help: "Giá trị thuộc tính cần tìm theo luật hiện tại.",
  },
  signal_text: {
    label: "Chữ báo đổi luật",
    help: "Văn bản hiển thị thông báo đổi luật phân loại mới cho bé.",
  },
  signal_audio_text: {
    label: "Lời đọc báo đổi luật",
    help: "Nội dung đọc thành tiếng khi đổi sang luật phân loại mới.",
  },
  color: {
    label: "Màu sắc",
    help: "Màu sắc của vật thể.",
  },
  shape: {
    label: "Hình dạng",
    help: "Hình dạng của vật thể.",
  },
  size: {
    label: "Kích thước",
    help: "Kích thước của vật thể (small, medium, large).",
  },
  switch_after_trials: {
    label: "Đổi luật sau số lượt",
    help: "Số lượt thử đạt đúng trước khi chuyển sang quy luật tiếp theo.",
  },
  signal_duration_ms: {
    label: "Thời gian thông báo đổi luật (ms)",
    help: "Thời lượng hiệu ứng thông báo đổi luật xuất hiện.",
  },

  // GT-028: Tap Count
  step: {
    label: "Bước nhảy đếm",
    help: "Giá trị mỗi bước đếm tích luỹ (2, 5, 10...).",
  },
  target_total: {
    label: "Tổng mục tiêu cần đếm",
    help: "Số lượng tổng cần tích luỹ đạt đến.",
  },
  allow_undo: {
    label: "Cho phép hoàn tác",
    help: "Bé có thể bấm lại vào vật phẩm đã chọn để hoàn tác bước đếm.",
  },

  // GT-029: Remove from Set
  initial_items: {
    label: "Danh sách vật phẩm ban đầu",
    help: "Các vật phẩm trong nhóm ban đầu trước khi bớt.",
  },
  remove_count: {
    label: "Số lượng cần bớt",
    help: "Số lượng vật phẩm cần lấy ra khỏi nhóm ban đầu.",
  },
  answer_options: {
    label: "Danh sách lựa chọn đáp án",
    help: "Các phương án số lượng còn lại cho bé chọn.",
  },
  initial_count: {
    label: "Số lượng ban đầu",
    help: "Số lượng vật phẩm ban đầu trong nhóm.",
  },

  // GT-030: Measure with Unit
  object: {
    label: "Vật cần đo",
    help: "Đối tượng được đo chiều dài bằng đơn vị lặp.",
  },
  unit: {
    label: "Đơn vị đo lặp",
    help: "Đơn vị quy ước được đặt lặp lại dọc theo vật cần đo.",
  },
  object_id: {
    label: "Mã định danh vật cần đo",
    help: "Mã định danh duy nhất của vật thể.",
  },
  unit_id: {
    label: "Mã định danh đơn vị đo",
    help: "Mã định danh duy nhất của đơn vị đo.",
  },
  length_in_units: {
    label: "Chiều dài theo đơn vị đo",
    help: "Số lượng đơn vị lặp vừa vặn chiều dài của vật (2-10).",
  },
  gap_tolerance_pct: {
    label: "Dung sai khe hở (%)",
    help: "Phần trăm khoảng cách cho phép lệch giữa các đơn vị liên tiếp.",
  },

  // GT-031: Coin Compose
  coins: {
    label: "Danh sách đồng xu",
    help: "Các đồng xu với mệnh giá khác nhau có sẵn để bé chọn.",
  },
  coin_id: {
    label: "Mã định danh đồng xu",
    help: "Mã định danh duy nhất của từng đồng xu.",
  },
  target_amount: {
    label: "Số tiền cần trả",
    help: "Tổng giá trị tiền xu mục tiêu bé cần gộp.",
  },
  item_to_buy: {
    label: "Món đồ cần mua",
    help: "Vật phẩm minh hoạ trong bối cảnh mua sắm.",
  },
  coin_kind_count: {
    label: "Số loại mệnh giá",
    help: "Số loại mệnh giá tiền xu khác nhau trong bài.",
  },
  exact_change: {
    label: "Yêu cầu trả đúng số tiền",
    help: "Bắt buộc trả chính xác không thừa tiền.",
  },

  // GT-032: Pour Quantity
  cups: {
    label: "Danh sách cốc nước",
    help: "Các chiếc cốc với hình dáng và mức nước khác nhau.",
  },
  cup_id: {
    label: "Mã định danh cốc",
    help: "Mã định danh duy nhất của từng chiếc cốc.",
  },
  capacity_units: {
    label: "Dung tích cốc (đơn vị)",
    help: "Số đơn vị thể tích tối đa của cốc.",
  },
  fill_units: {
    label: "Mức nước (đơn vị)",
    help: "Số đơn vị thể tích chất lỏng đang có trong cốc.",
  },
  question_type: {
    label: "Loại câu hỏi",
    help: "Yêu cầu tìm cốc nhiều hơn, ít hơn hoặc bằng nhau.",
  },
  conservation_trap: {
    label: "Bẫy bảo toàn Piaget",
    help: "Bật tình huống thử thách sự hiểu biết về bảo toàn thể tích.",
  },
  cup_count: {
    label: "Số lượng cốc",
    help: "Số lượng cốc hiển thị trên màn hình.",
  },
  level_steps: {
    label: "Số vạch chia mức",
    help: "Số vạch chia đơn vị dung tích trên cốc.",
  },
};

/**
 * D-JT: Allowlist for fields falling into 'text' without ending in '_vi'.
 * Every entry must have a clear documented rationale.
 */
export const TEXT_FALLBACK_ALLOWLIST: Record<string, string> = {
  step: "Bước nhảy số nguyên đếm tích luỹ.",
  target_total: "Tổng số nguyên mục tiêu cần đạt.",
  remove_count: "Số nguyên vật phẩm cần bớt ra khỏi nhóm.",
  initial_count: "Số nguyên lượng vật phẩm ban đầu.",
  value: "Giá trị số nguyên của đáp án lựa chọn.",
  object_id: "Mã định danh vật thể cần đo.",
  unit_id: "Mã định danh đơn vị đo phi chuẩn.",
  length_in_units: "Số nguyên chiều dài vật thể theo đơn vị đo.",
  gap_tolerance_pct: "Số phần trăm dung sai khe hở giữa các đơn vị đo.",
  coin_id: "Mã định danh đồng xu trong bài toán tiền.",
  target_amount: "Số nguyên tổng tiền mục tiêu cần trả.",
  coin_kind_count: "Số nguyên lượng loại mệnh giá.",
  cup_id: "Mã định danh cốc nước.",
  capacity_units: "Số nguyên dung tích cốc.",
  fill_units: "Số nguyên mức nước trong cốc.",
  cup_count: "Số nguyên lượng cốc hiển thị.",
  level_steps: "Số nguyên vạch chia mức cốc.",
  prompt: "Câu hỏi chính của bài học, dạng văn bản ngắn đọc cho bé.",
  item_id: "Mã định danh kỹ thuật của vật phẩm trong content pack.",
  id: "Mã định danh đối tượng.",
  container_id: "Mã định danh vùng chứa / đích đến.",
  group_id: "Mã định danh nhóm phân loại (g0, g1...).",
  pair_id: "Mã định danh cặp liên kết ghép đôi.",
  step_id: "Mã định danh bước trong chuỗi thứ tự.",
  label: "Nhãn chữ hiển thị cho nhóm hoặc bước.",
  target_criterion: "Tiêu chí mô tả thuộc tính mục tiêu cần chọn.",
  accepts_attribute: "Tên thuộc tính mà container chấp nhận.",
  attribute: "Tên thuộc tính của vật phẩm dùng để phân loại.",
  correct_group_id: "Mã nhóm đúng mà item thuộc về.",
  order_index: "Chỉ số thứ tự số nguyên.",
  title: "Tiêu đề bài học ngắn gọn.",
  instruction: "Hướng dẫn thực hiện bài học.",
  theme_id: "Mã chủ đề giao diện.",
  candidate_id: "Mã định danh ứng viên loại trừ.",
  clue_id: "Mã định danh manh mối.",
  text: "Nội dung văn bản manh mối.",
  predicate: "Hàm vị từ logic kiểm tra.",
  answer_candidate_id: "Mã định danh đáp án ứng viên đúng.",
  symbol_id: "Mã định danh biểu tượng phương trình.",
  equation_id: "Mã định danh phương trình hình ảnh.",
  left: "Mã biểu tượng vế trái phương trình.",
  right_value: "Giá trị số vế phải.",
  question: "Định nghĩa câu hỏi mục tiêu.",
  rows: "Số hàng trong ma trận.",
  cols: "Số cột trong ma trận.",
  option_id: "Mã định danh phương án lựa chọn.",
  slot_id: "Mã định danh ô trống quy luật.",
  expected_item_id: "Mã vật phẩm kỳ vọng.",
  grid_size: "Kích thước cạnh ma trận / lưới.",
  minute: "Giá trị phút đồng hồ (0 hoặc 30).",
  card_id: "Mã định danh thẻ sinh hoạt.",
  minute_step: "Bước nhảy kim phút (30 hoặc 60).",
  colorToken: "Mã token màu sắc hiển thị.",
  row: "Chỉ số hàng số nguyên.",
  col: "Chỉ số cột số nguyên.",
  x: "Toạ độ X số nguyên.",
  y: "Toạ độ Y số nguyên.",
  z: "Toạ độ Z số nguyên.",
  weight: "Trọng lượng vật phẩm số nguyên.",
  hour: "Giờ số nguyên.",
  blank_count: "Số lượng ô trống số nguyên.",
  flash_ms: "Thời gian chớp mili-giây.",
  allow_replay: "Cờ cho phép xem lại chớp ảnh.",
  allow_rotate: "Cờ cho phép xoay mô hình 3D.",
  hidden_cube_count: "Số lượng khối che khuất số nguyên.",
  side: "Cạnh tường mê cung.",
  target_rotation: "Góc quay số nguyên mục tiêu (0, 90, 180, 270).",
  initial_rotation: "Góc quay số nguyên ban đầu (0, 90, 180, 270).",
  rotation_step: "Bước xoay số nguyên (90).",
  order: "Thứ tự số nguyên của điểm mốc vẽ nét.",
  axis: "Trục đối xứng chuỗi enum ('vertical' | 'horizontal').",
  target_flip: "Trục lật chuỗi enum ('none' | 'horizontal' | 'vertical').",
  initial_flip: "Trục lật chuỗi enum ('none' | 'horizontal' | 'vertical').",
  piece_id: "Mã định danh mảnh ghép.",
  target_slot_id: "Mã định danh ô đích.",
  pair_key: "Khóa định danh cặp thẻ.",
  expected_asset_ref: "Mã tham chiếu tài nguyên mong đợi.",
  asset_ref: "Mã tham chiếu tài nguyên.",
  target_description: "Mô tả mục tiêu cần tìm.",
  anchor_id: "Mã định danh điểm neo.",
  accepted_part_id: "Mã bộ phận chấp nhận.",
  part_id: "Mã định danh bộ phận.",
  target_anchor_id: "Mã điểm neo đích.",
  shape_name: "Tên hình cần vẽ.",
  name: "Tên hiển thị đối tượng.",
  audio_url: "Đường dẫn URL âm thanh.",
  response_mode: "Chế độ phản hồi ('select' | 'sequence').",
  target_sequence: "Mã định danh vật phẩm trong chuỗi mục tiêu.",
  left_id: "Mã định danh vật thể bên trái.",
  right_id: "Mã định danh vật thể bên phải.",
  description: "Mô tả chi tiết điểm khác biệt hoặc quy luật.",
  kind: "Loại kích thích ('go' | 'nogo').",
  dimension: "Chiều phân loại ('color' | 'shape' | 'size').",
  target_value: "Giá trị thuộc tính mục tiêu.",
  signal_text: "Văn bản báo hiệu đổi luật phân loại.",
  signal_audio_text: "Lời đọc báo hiệu đổi luật phân loại.",
  color: "Tên mã màu hoặc token màu của vật thể.",
  shape: "Tên hình dạng của vật thể.",
  size: "Kích thước của vật thể.",
};

export function getFieldDictionaryEntry(
  fieldName: string
): FieldDictionaryEntry | undefined {
  return CONFIG_DICTIONARY[fieldName];
}
