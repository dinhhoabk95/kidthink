<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="cookie-policy-main" id="main-content">
      <div class="section-container">
        <!-- Header with Version (BR-LGL-01) -->
        <div class="policy-header">
          <div class="meta-pills">
            <span class="pill-version">Phiên bản 1.0</span>
            <span class="pill-date">Ngày hiệu lực: 01/08/2026</span>
          </div>
          <h1 class="policy-title">Chính sách Cookie & Lưu trữ kỹ thuật</h1>
          <p class="policy-subtitle">
            KidThink chỉ sử dụng các cookie kỹ thuật cần thiết để duy trì phiên
            đăng nhập và bảo vệ an toàn cho tài khoản. Chúng tôi tuyệt đối không
            sử dụng cookie theo dõi hay quảng cáo của bên thứ ba.
          </p>
        </div>

        <!-- Section 1: Cookie Table (BR-CKB-05) -->
        <section class="policy-section">
          <h2 class="section-heading">1. Danh mục Cookie kỹ thuật thiết yếu</h2>
          <p class="section-text">
            Dưới đây là danh sách đầy đủ 6 nhóm cookie kỹ thuật bắt buộc do hệ
            thống cấp phát nhằm vận hành dịch vụ:
          </p>

          <div class="table-responsive">
            <table aria-label="Bảng danh mục cookie" class="cookie-table">
              <thead>
                <tr>
                  <th scope="col">Tên Cookie</th>
                  <th scope="col">Mục đích sử dụng</th>
                  <th scope="col">Thời hạn lưu trữ</th>
                  <th scope="col">Phân loại</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in essentialCookies" :key="c.name">
                  <td class="cookie-name-cell"><code>{{ c.name }}</code></td>
                  <td>{{ c.purpose }}</td>
                  <td>{{ c.maxAge }}</td>
                  <td><span class="badge-essential">Thiết yếu</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Section 2: LocalStorage & IndexedDB (BR-CKB-05 / §7.2) -->
        <section class="policy-section">
          <h2 class="section-heading">
            2. Bộ nhớ cục bộ trên trình duyệt (LocalStorage)
          </h2>
          <p class="section-text">
            Nhằm tối ưu hoá trải nghiệm và hỗ trợ chế độ chơi offline, ứng dụng
            lưu trữ một số khoá kỹ thuật cục bộ trên thiết bị của bạn:
          </p>

          <div class="table-responsive">
            <table
              aria-label="Bảng danh mục bộ nhớ cục bộ"
              class="cookie-table"
            >
              <thead>
                <tr>
                  <th scope="col">Khoá lưu trữ</th>
                  <th scope="col">Mục đích sử dụng</th>
                  <th scope="col">Phạm vi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in localStorageItems" :key="item.key">
                  <td class="cookie-name-cell"><code>{{ item.key }}</code></td>
                  <td>{{ item.purpose }}</td>
                  <td>Trình duyệt người dùng</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Section 3: Cam kết không bên thứ ba (BR-CKB-04) -->
        <section class="policy-section">
          <h2 class="section-heading">3. Cam kết không cookie bên thứ ba</h2>
          <p class="section-text">
            KidThink cam kết không tích hợp bất kỳ thẻ theo dõi (pixel), cookie
            từ mạng xã hội hoặc dịch vụ phân tích hành vi của bên thứ ba. Mọi dữ
            liệu thu thập được giới hạn nghiêm ngặt ở mức tối thiểu phục vụ học
            tập.
          </p>
        </section>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { ESSENTIAL_COOKIES, LOCAL_STORAGE_ITEMS } from "@kidthink/shared";
  import { useHead, useSeoMeta } from "unhead";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  const essentialCookies = ESSENTIAL_COOKIES;
  const localStorageItems = LOCAL_STORAGE_ITEMS;

  useSeoMeta({
    title: "Chính sách Cookie — KidThink",
    description:
      "Bảng kê chi tiết các cookie kỹ thuật thiết yếu được sử dụng trên nền tảng KidThink.",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: "https://kidthink.vn/cookie" }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .cookie-policy-main {
    padding: 3rem 0 5rem;
  }

  .section-container {
    max-width: 56rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .policy-header {
    margin-bottom: 2.5rem;
  }

  .meta-pills {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .pill-version,
  .pill-date {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
  }

  .policy-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .policy-subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--color-surface-600);
    margin: 0;
  }

  .policy-section {
    background-color: white;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .section-heading {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .section-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-surface-700);
    margin-bottom: 1.25rem;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .cookie-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .cookie-table th,
  .cookie-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-surface-200);
  }

  .cookie-table th {
    background-color: var(--color-surface-100);
    color: var(--color-surface-900);
    font-weight: 700;
  }

  .cookie-name-cell code {
    background-color: var(--color-surface-100);
    padding: 0.2rem 0.4rem;
    border-radius: 0.35rem;
    font-family: monospace;
    color: var(--color-brand-600);
  }

  .badge-essential {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 0.4rem;
    background-color: var(--color-success-100, lightgreen);
    color: var(--color-success-800, darkgreen);
  }
</style>
