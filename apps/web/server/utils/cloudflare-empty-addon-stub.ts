/**
 * Stub rỗng dùng cho cấu hình Nitro khi `MINDKID_RUNTIME=cloudflare`:
 * ngăn Rollup kéo các native addon C++ (`sharp`) của chế độ VPS vào bundle V8 Isolate.
 */
const unavailableOnEdge = (): never => {
  throw new Error(
    "Native C++ addon is disabled on Cloudflare Workers runtime."
  );
};

export default unavailableOnEdge;
