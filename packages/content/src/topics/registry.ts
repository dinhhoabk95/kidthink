export interface TopicDef {
  readonly topic_code: string;
  readonly skill_code: string;
  readonly label_vi: string;
}

type TopicPair = readonly [string, string];

const TOPIC_LABELS: Readonly<Record<string, TopicPair>> = {
  "C1.CNT.01": ["Đếm từng vật, chỉ tay một lần", "Nói số cuối là tổng số vật"],
  "C1.CNT.02": ["Đếm vật đang chuyển động", "Giữ nhịp đếm khi vật đổi chỗ"],
  "C1.CNT.03": ["Đánh dấu vật đã đếm", "Không đếm lặp một vật"],
  "C1.NREC.05": ["Nhìn lượng, chọn chữ số", "Nhìn chữ số, lấy đủ lượng"],
  "C1.NREC.09": [
    "Xếp các số theo thứ tự tăng dần",
    "Tìm số đứng trước và đứng sau",
  ],
  "C1.CNT.11": ["Nhìn lướt nhận ra 1 đến 3", "Nhìn lướt nhận ra 4 đến 5"],
  "C1.NREC.01": ["Nhận mặt chữ số 0 đến 3", "Hiểu số 0 là không có gì"],
  "C1.CMP.04": [
    "Ghép đôi để thấy nhóm nhiều hơn",
    "Nhìn và chọn nhóm nhiều hơn",
  ],
  "C1.NCOMP.04": ["Tách 5 thành hai phần", "Ghép hai phần lại thành 5"],
  "C1.NCOMP.09": ["Tách 10 thành hai phần", "Tìm số còn thiếu để đủ 10"],
  "C1.CNT.05": ["Đếm nhảy cóc theo hai", "Đoán số kế tiếp khi đếm cách 2"],
  "C1.PROB.06": ["Tìm số còn thiếu trong dãy", "Giải thích vì sao chọn số đó"],
  "C1.PAT.04": ["Nhận ra đơn vị lặp A-B-C", "Nối tiếp quy luật A-B-C"],
  "C1.MEAS.07": ["Đoán bên nào nặng hơn", "Thêm bớt để hai bên cân bằng"],
  "C1.MEAS.13": ["Đọc kim giờ trên đồng hồ", "Xoay kim đến giờ đúng"],
  "C1.CNT.09": ["Đoán nhanh số lượng", "Đếm lại để kiểm tra điều đã đoán"],
  "C1.CNT.10": ["Đếm lại lần hai", "So sánh hai lần đếm"],
  "C1.MEAS.05": ["So sánh hai bình đầy vơi", "Chọn bình chứa được nhiều hơn"],
  "C1.CNT.06": [
    "Gom vật thành các nhóm bằng nhau",
    "Đếm số nhóm thay vì từng vật",
  ],
  "C1.CNT.07": ["Bắt đầu đếm từ một số cho trước", "Đếm tiếp nối từ số đó"],
  "C1.MEAS.01": ["So sánh dài hơn, ngắn hơn", "Xếp các vật từ ngắn đến dài"],
  "C1.MEAS.02": ["So sánh cao hơn, thấp hơn", "Xếp các vật từ thấp đến cao"],
  "C1.PROB.01": ["Nhận ra bài toán hỏi gì", "Chọn cách giải hợp với bài"],
  "C1.CNT.08": ["Nhảy từng bước trên đường số", "Đọc số đích trên đường số"],
  "C1.CNT.04": ["Đếm lùi từ 5", "Đếm lùi từ 10"],
  "C2.ORI.03": ["Nhận ra vị trí ở trên", "Đặt vật lên phía trên"],
  "C2.ORI.04": ["Nhận ra vị trí ở dưới", "Đặt vật xuống phía dưới"],
  "C2.GEO.01": ["Nhận ra hình tròn", "Tìm hình tròn trong đồ vật"],
  "C2.GEO.02": ["Nhận ra hình vuông", "Tìm hình vuông trong đồ vật"],
  "C2.CON.04": ["Nhìn mẫu để chọn khối", "Ghép các khối theo mẫu"],
  "C2.MAZ.01": ["Dò theo đường đi duy nhất", "Tránh ngõ cụt"],
  "C3.SEQ.01": ["Nhận ra hình nào đứng trước, sau", "Hoàn thành chuỗi hình"],
  "C3.SRT.01": ["Xếp từ nhỏ đến lớn", "Chỉ ra vật nhỏ nhất, lớn nhất"],
  "C3.SRT.02": ["Xếp từ lớn đến nhỏ", "Chỉ ra vật lớn nhất, nhỏ nhất"],
  "C3.RULE.02": ["Đoán phần tử kế tiếp của quy luật", "Điền phần tử còn thiếu"],
  "C3.DED.01": ["Gạt bỏ đáp án sai", "Tìm đáp án còn lại"],
  "C3.MTX.01": ["Đọc quy luật theo hàng", "Đọc quy luật theo cột"],
  "C4.DET.03": ["So sánh kích thước hai vật", "Tìm vật cùng kích thước"],
  "C4.SEN.03": ["Phân biệt nhẵn và nhám", "Ghép các vật cùng kết cấu"],
  "C4.MEM.02": ["Nhìn và nhớ thứ tự các hình", "Tái hiện chuỗi hình đã nhớ"],
  "C4.VIS.02": ["Tìm các vật giống nhau", "Chỉ ra vật khác biệt trong nhóm"],
  "C4.SEN.01": ["Phân biệt màu đậm và nhạt", "Xếp màu từ nhạt đến đậm"],
  "C5.STO.01": ["Nhớ nhân vật và sự việc", "Kể lại theo đúng thứ tự"],
  "C5.DES.01": ["Nói tên và màu sắc của vật", "Nói hình dạng và công dụng"],
  "C5.DES.04": ["Nói mình chọn gì", "Nói vì sao mình chọn"],
  "C6.PLN.01": ["Nói ra các bước sẽ làm", "Làm theo kế hoạch đã nói"],
  "C6.PLN.02": ["So sánh hai đường đi", "Chọn đường đi ngắn hơn"],
  "C6.PLN.03": [
    "Hình dung các bước trước khi thử",
    "So kết quả trong đầu với kết quả thật",
  ],
};

function topicCode(skillCode: string, sequence: number): string {
  return `TP-${skillCode}-${String(sequence).padStart(2, "0")}`;
}

export const LESSON_TOPIC_REGISTRY: readonly TopicDef[] = Object.entries(
  TOPIC_LABELS
).flatMap(([skillCode, labels]) =>
  labels.map((label, index) => ({
    topic_code: topicCode(skillCode, index + 1),
    skill_code: skillCode,
    label_vi: label,
  }))
);
