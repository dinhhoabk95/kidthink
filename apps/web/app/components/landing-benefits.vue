<template>
  <!-- Khối 6: Dùng ở nhà / dùng trên lớp — chia theo ngữ cảnh dùng, không theo
       loại người. Một loại User duy nhất: BR-GLOS-04. -->
  <section aria-labelledby="benefits-title" class="benefits-section">
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title" id="benefits-title">
          Đồng hành cùng bé lớn khôn
        </h2>
        <p class="section-subtitle">
          Một tài khoản, dùng được cả ở nhà lẫn trên lớp
        </p>
      </div>
      <div class="benefits-grid">
        <div class="benefit-col">
          <h3 class="benefit-heading">Khi dùng ở nhà</h3>
          <ul class="benefit-list">
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Theo dõi tiến độ tư duy trực quan mà không tạo áp lực điểm số</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Hướng dẫn gợi ý hoạt động tương tác ngoài đời thực với con</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Thiết lập thời lượng chơi an toàn, bảo vệ thị giác của bé</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span>Quản lý tối đa 5 bé độc lập trên cùng một tài khoản</span>
            </li>
          </ul>
        </div>
        <div class="benefit-col">
          <h3 class="benefit-heading">Khi dùng trên lớp</h3>
          <ul class="benefit-list">
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Thư viện học liệu trò chơi đa dạng chuẩn hoá khung mầm non</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Hỗ trợ giờ hoạt động góc và bài học nhóm tương tác trực quan</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Phân loại chính xác bài tập theo từng năng lực và kỹ năng chi
                tiết</span
              >
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
                name="i-lucide-check"
              />
              <span
                >Dễ dàng quan sát mức độ hứng thú và khả năng nhận biết của từng
                trẻ</span
              >
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
