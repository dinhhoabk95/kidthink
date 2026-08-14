<template>
  <!-- Khối 6: Cho phụ huynh / Cho giáo viên -->
  <section aria-labelledby="benefits-title" class="benefits-section">
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title" id="benefits-title">
          Đồng hành cùng bé lớn khôn
        </h2>
        <p class="section-subtitle">
          Giải pháp hỗ trợ toàn diện cho gia đình và nhà trường
        </p>
      </div>
      <div class="benefits-grid">
        <div class="benefit-col">
          <h3 class="benefit-heading">Dành cho Phụ huynh</h3>
          <ul class="benefit-list">
            <li>
              ✓ Theo dõi tiến độ tư duy trực quan mà không tạo áp lực điểm số
            </li>
            <li>
              ✓ Hướng dẫn gợi ý hoạt động tương tác ngoài đời thực với con
            </li>
            <li>✓ Thiết lập thời lượng chơi an toàn, bảo vệ thị giác của bé</li>
            <li>✓ Quản lý tối đa 5 bé độc lập trên cùng một tài khoản</li>
          </ul>
        </div>
        <div class="benefit-col">
          <h3 class="benefit-heading">Dành cho Giáo viên & Trường mầm non</h3>
          <ul class="benefit-list">
            <li>
              ✓ Thư viện học liệu trò chơi đa dạng chuẩn hoá khung mầm non
            </li>
            <li>
              ✓ Hỗ trợ giờ hoạt động góc và bài học nhóm tương tác trực quan
            </li>
            <li>
              ✓ Phân loại chính xác bài tập theo từng năng lực và kỹ năng chi
              tiết
            </li>
            <li>
              ✓ Dễ dàng quan sát mức độ hứng thú và khả năng nhận biết của từng
              trẻ
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup></script>

<style scoped>
  .section-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .section-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 768px) {
    .benefits-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .benefit-col {
    background-color: white;
    padding: 2rem;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
  }

  .benefit-heading {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 1rem;
  }

  .benefit-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-700);
  }
</style>
