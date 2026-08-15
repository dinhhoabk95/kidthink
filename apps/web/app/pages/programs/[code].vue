<template>
  <div class="min-h-screen flex flex-col bg-surface-50 text-surface-900">
    <PublicNavbar />

    <main class="flex-1 py-8 px-4 pb-16" id="main-content">
      <div class="max-w-[1200px] mx-auto w-full">
        <!-- 410 Archived State (BR-PSH-05, D-NJ) -->
        <div
          class="bg-white border-3 border-surface-200 rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto my-8"
          role="alert"
          v-if="isArchived"
        >
          <div
            class="inline-block text-xs font-bold px-4 py-1.5 rounded-full bg-surface-100 text-surface-800 mb-4"
          >
            Đã ngừng phát hành
          </div>
          <h1 class="font-heading text-2xl md:text-3xl font-bold mb-3">
            Chương trình học không còn khả dụng
          </h1>
          <p class="text-surface-600 leading-relaxed mb-8">
            Chương trình <strong>{{ programCode }}</strong> đã được cập nhật
            thành các lộ trình mới hơn. Phụ huynh có thể tham khảo các chương
            trình tương đương dưới đây:
          </p>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left"
            v-if="archivedSuggestions.length > 0"
          >
            <div
              class="bg-surface-50 border-2 border-surface-200 rounded-2xl p-5 flex flex-col"
              v-for="sug in archivedSuggestions"
              :key="sug.code"
            >
              <div class="flex justify-between text-xs font-bold mb-2">
                <span
                  >{{ sug.target_age.min }}–{{ sug.target_age.max }}
                  tuổi</span
                >
                <span>{{ getTierLabel(sug.access_tier) }}</span>
              </div>
              <h2 class="text-base font-bold mb-4 flex-1">
                <NuxtLink
                  class="text-surface-900 hover:text-brand-600"
                  :to="`/programs/${sug.code}`"
                >
                  {{ sug.title }}
                </NuxtLink>
              </h2>
              <NuxtLink
                class="text-sm font-bold text-brand-600 hover:underline"
                :to="`/programs/${sug.code}`"
              >
                Xem lộ trình mới →
              </NuxtLink>
            </div>
          </div>

          <NuxtLink
            class="inline-flex items-center px-6 py-3 text-sm font-bold rounded-2xl bg-surface-200 text-surface-800 hover:bg-surface-300"
            to="/programs"
          >
            ← Khám phá tất cả chương trình
          </NuxtLink>
        </div>

        <!-- 404 Error State -->
        <div
          class="bg-white border-2 border-dashed border-surface-300 rounded-3xl p-12 text-center max-w-lg mx-auto"
          role="alert"
          v-else-if="fetchError && !isArchived"
        >
          <h1 class="font-heading text-2xl font-bold mb-2">
            Không tìm thấy chương trình học
          </h1>
          <p class="text-surface-600 mb-6">
            Chương trình bạn đang tìm kiếm không tồn tại hoặc đã được chuyển
            hướng.
          </p>
          <NuxtLink
            class="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
            to="/programs"
          >
            ← Quay lại danh sách chương trình
          </NuxtLink>
        </div>

        <!-- Loading State -->
        <div
          aria-live="polite"
          class="bg-white border-2 border-dashed border-surface-300 rounded-3xl p-12 text-center max-w-lg mx-auto"
          v-else-if="pending"
        >
          <div
            aria-hidden="true"
            class="w-10 h-10 border-4 border-surface-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-surface-600">
            Đang tải thông tin chi tiết chương trình học...
          </p>
        </div>

        <!-- Detail Content -->
        <div class="space-y-8" v-else-if="program">
          <!-- Breadcrumbs -->
          <nav aria-label="Đường dẫn trang" class="mb-4">
            <ol class="flex items-center gap-2 text-sm text-surface-600">
              <li>
                <NuxtLink class="hover:text-brand-600" to="/"
                  >Trang chủ</NuxtLink
                >
              </li>
              <li aria-hidden="true" class="text-surface-400">/</li>
              <li>
                <NuxtLink class="hover:text-brand-600" to="/programs"
                  >Chương trình</NuxtLink
                >
              </li>
              <li aria-hidden="true" class="text-surface-400">/</li>
              <li aria-current="page" class="font-bold text-surface-900">
                {{ program.title }}
              </li>
            </ol>
          </nav>

          <!-- Header Card -->
          <section
            class="bg-white border-3 border-surface-200 rounded-3xl p-6 md:p-8 shadow-sm"
          >
            <div class="flex gap-3 mb-4">
              <span
                class="text-sm font-bold px-3 py-1.5 rounded-xl bg-surface-100 text-surface-700"
              >
                Dành cho trẻ
                {{ program.target_age.min }}–{{ program.target_age.max }}
                tuổi
              </span>
              <span
                class="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-100 text-surface-800"
              >
                {{ getTierLabel(program.access_tier) }}
              </span>
            </div>

            <h1
              class="font-heading text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4 text-surface-900"
            >
              {{ program.title }}
            </h1>

            <p
              class="text-base md:text-lg text-surface-600 leading-relaxed max-w-3xl mb-8"
            >
              {{ program.description || 'Chương trình phát triển tư duy toán học bài bản, rèn luyện tư duy logic, hình học không gian và kỹ năng giải quyết vấn đề qua các hoạt động trải nghiệm tương tác.' }}
            </p>

            <div
              class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-surface-100"
            >
              <div class="flex items-center gap-3">
                <span aria-hidden="true" class="text-2xl">📅</span>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900"
                    >{{ program.duration_weeks }}
                    tuần</span
                  >
                  <span class="text-xs text-surface-500"
                    >Thời lượng lộ trình</span
                  >
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span aria-hidden="true" class="text-2xl">⏱️</span>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900"
                    >{{ program.sessions_per_week }}
                    buổi / tuần</span
                  >
                  <span class="text-xs text-surface-500">Nhịp độ học tập</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span aria-hidden="true" class="text-2xl">🧩</span>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900"
                    >6 Năng lực</span
                  >
                  <span class="text-xs text-surface-500"
                    >Phát triển toàn diện</span
                  >
                </div>
              </div>
            </div>
          </section>

          <!-- Main Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <!-- Left: Weeks Syllabus -->
            <div>
              <div class="flex justify-between items-baseline mb-6">
                <h2 class="font-heading text-xl md:text-2xl font-bold">
                  Cấu trúc lộ trình học tập
                </h2>
                <span class="text-sm font-bold text-brand-600"
                  >Xem chi tiết 2 tuần đầu học thử</span
                >
              </div>

              <div class="space-y-4">
                <div
                  class="bg-white border-2 border-surface-200 rounded-2xl p-5"
                  v-for="week in program.weeks"
                  :key="week.week_no"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-extrabold text-brand-600"
                        >Tuần {{ week.week_no }}</span
                      >
                      <h3 class="text-base md:text-lg font-bold leading-snug">
                        {{ week.goal }}
                      </h3>
                    </div>
                    <div
                      class="flex items-center gap-1.5 text-xs text-surface-500 whitespace-nowrap"
                    >
                      <span>{{ week.session_count }} buổi</span>
                      <span>•</span>
                      <span>{{ week.item_count }} hoạt động</span>
                    </div>
                  </div>

                  <!-- Detailed items for Weeks 1-2 (BR-PSH-02) -->
                  <div
                    class="mt-4 space-y-3"
                    v-if="week.items && week.items.length > 0"
                  >
                    <div
                      class="flex items-center gap-3.5 bg-surface-50 p-3.5 rounded-xl border border-surface-200"
                      v-for="(item, idx) in week.items"
                      :key="`${item.code}-${idx}`"
                    >
                      <div>
                        <span
                          class="text-xs font-bold px-2 py-1 rounded-xl bg-surface-100 text-brand-700"
                          v-if="item.entity_type === 'lesson'"
                          >Bài học</span
                        >
                        <span
                          class="text-xs font-bold px-2 py-1 rounded-xl bg-surface-100 text-surface-800"
                          v-else
                          >Trò chơi</span
                        >
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-bold m-0">{{ item.title }}</h4>
                        <span class="text-xs text-surface-500"
                          >{{ item.estimated_minutes }}
                          phút</span
                        >
                      </div>
                      <span
                        class="text-xs font-bold px-2 py-1 rounded-xl bg-surface-200 text-surface-700"
                        >{{ getTierLabel(item.access_tier) }}</span
                      >
                    </div>
                  </div>

                  <!-- Locked summary for Weeks 3+ (BR-PSH-01) -->
                  <div
                    class="mt-3 p-3 bg-surface-50 rounded-xl flex items-center gap-2.5 text-sm text-surface-600"
                    v-else-if="week.week_no > 2"
                  >
                    <span aria-hidden="true">🔒</span>
                    <span
                      >Nội dung mở tự động theo lộ trình khi bé học hoàn thành
                      các tuần trước.</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Sidebar -->
            <aside class="space-y-6">
              <!-- CTA Card -->
              <div class="bg-brand-600 text-white p-7 rounded-3xl shadow-lg">
                <h3 class="font-heading text-xl font-bold mb-2">
                  Bắt đầu học ngay hôm nay
                </h3>
                <p class="text-sm text-surface-100 leading-relaxed mb-6">
                  Trang bị nền tảng tư duy toán học vững chắc cho bé với phương
                  pháp học qua chơi sinh động.
                </p>

                <div class="flex flex-col gap-3">
                  <NuxtLink
                    class="inline-flex items-center justify-center p-3.5 text-base font-bold rounded-2xl bg-cta text-white min-h-[48px] hover:bg-cta-hover"
                    to="/pricing"
                  >
                    Đăng ký gói học cho bé
                  </NuxtLink>
                  <NuxtLink
                    class="inline-flex items-center justify-center p-3 text-sm font-bold rounded-2xl bg-white/15 text-white min-h-[44px] hover:bg-white/25"
                    to="/games"
                  >
                    Chơi thử trò chơi miễn phí
                  </NuxtLink>
                </div>
              </div>

              <!-- Competencies -->
              <div class="bg-white border-2 border-surface-200 rounded-3xl p-6">
                <h3 class="font-heading text-lg font-bold mb-1">
                  Phân bố năng lực toán học
                </h3>
                <p class="text-xs text-surface-500 mb-5">
                  Tỉ lệ phân bổ mục tiêu học tập qua 6 năng lực:
                </p>

                <div class="space-y-3.5">
                  <div
                    class="space-y-1"
                    v-for="comp in program.competency_distribution"
                    :key="comp.code"
                  >
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-surface-700"
                        >{{ comp.label }}
                        ({{ comp.code }})</span
                      >
                      <span class="text-brand-600"
                        >{{ Math.round(comp.share * 100) }}%</span
                      >
                    </div>
                    <div
                      aria-valuemax="100"
                      aria-valuemin="0"
                      class="w-full h-2 bg-surface-100 rounded-full overflow-hidden"
                      role="progressbar"
                      :aria-valuenow="Math.round(comp.share * 100)"
                    >
                      <div
                        class="h-full bg-brand-600 rounded-full"
                        :style="{ width: `${Math.round(comp.share * 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import type {
    ProgramAlternativeSuggestion,
    ProgramDetailPublic,
  } from "@kidthink/shared";
  import { computed } from "vue";

  const route = useRoute();
  const programCode = computed(() => String(route.params.code || ""));
  const siteUrl = "https://kidthink.vn";

  const {
    data: program,
    pending,
    error: fetchError,
  } = await useFetch<ProgramDetailPublic>(
    `/api/guest/curricula/${programCode.value}`,
    {
      key: `guest-curriculum-${programCode.value}`,
    }
  );

  const isArchived = computed(() => fetchError.value?.statusCode === 410);

  const archivedSuggestions = computed<ProgramAlternativeSuggestion[]>(() => {
    const errData = fetchError.value?.data as
      | { data?: { suggestions?: ProgramAlternativeSuggestion[] } }
      | undefined;
    return errData?.data?.suggestions || [];
  });

  function getTierLabel(tier: string): string {
    switch (tier) {
      case "free":
        return "Miễn phí";
      case "login":
        return "Đăng ký tài khoản";
      case "standard":
        return "Gói Tiêu chuẩn";
      case "premium":
        return "Gói Premium";
      default:
        return tier;
    }
  }

  useHead(() => {
    if (isArchived.value) {
      return {
        title: "Chương trình học đã lưu trữ | KidThink",
        meta: [{ name: "robots", content: "noindex, nofollow" }],
      };
    }

    if (!program.value) {
      return {
        title: "Chương trình học | KidThink",
      };
    }

    const p = program.value;
    const pageTitle = `${p.title} (${p.duration_weeks} tuần) | KidThink`;
    const pageDesc =
      p.description ||
      `Chương trình học tư duy toán mầm non ${p.duration_weeks} tuần cho trẻ ${p.target_age.min}–${p.target_age.max} tuổi. Khám phá ngay!`;
    const canonicalUrl = `${siteUrl}/programs/${p.code}`;

    const courseJsonLd = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: p.title,
      description: pageDesc,
      courseCode: p.code,
      educationalLevel: `Trẻ mầm non ${p.target_age.min}–${p.target_age.max} tuổi`,
      inLanguage: "vi-VN",
      isAccessibleForFree: p.access_tier === "free",
      provider: {
        "@type": "Organization",
        name: "KidThink",
        url: siteUrl,
      },
      url: canonicalUrl,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        duration: `P${p.duration_weeks}W`,
      },
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Trang chủ",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Chương trình",
          item: `${siteUrl}/programs`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: p.title,
          item: canonicalUrl,
        },
      ],
    };

    return {
      title: pageTitle,
      meta: [
        { name: "description", content: pageDesc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDesc },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
      ],
      link: [{ rel: "canonical", href: canonicalUrl }],
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(courseJsonLd),
        },
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(breadcrumbJsonLd),
        },
      ],
    };
  });
</script>
