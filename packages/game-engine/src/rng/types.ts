/** Generator có seed. Cài đặt trong repo, không lấy từ thư viện ngoài (BR-RNG-03). */
export interface Rng {
  /** Số thực trong nửa khoảng [0, 1). */
  next(): number;
  /** Số nguyên trong [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

/** Luồng con tách theo tên — thêm luồng mới không dịch luồng đã có (BR-RNG-04). */
export type RngStreamName =
  | "items"
  | "sides"
  | "initial"
  | "feedback"
  | "theme";
