import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import {
  type KidProfileItem,
  useKidProfile,
} from "~/composables/play/use-kid-profile";

const mockActiveCookie = ref<string | null>("uuid-kid-1");
const mockChildrenData = ref<{ children: KidProfileItem[] } | null>(null);

vi.mock("#imports", () => ({
  useCookie: () => mockActiveCookie,
  useFetch: () => ({
    data: mockChildrenData,
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  }),
}));

vi.mock("~/composables/use-csrf-fetch", () => ({
  useCsrfHeaders: () => ({
    headers: () => ({ "x-csrf-token": "mock-token" }),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

describe("useKidProfile composable (Task #285)", () => {
  const sampleChildren: KidProfileItem[] = [
    {
      uuid: "uuid-kid-1",
      display_name: "Bé An",
      birth_year: 2021,
      age_band: "3-4",
      avatar_id: "bear",
      relationship: "parent",
      status: "active",
      daily_play_cap_minutes: 30,
    },
    {
      uuid: "uuid-kid-2",
      display_name: "Bé Bình",
      birth_year: 2019,
      age_band: "5-6",
      avatar_id: "bunny",
      relationship: "parent",
      status: "active",
      daily_play_cap_minutes: 45,
    },
    {
      uuid: "uuid-kid-archived",
      display_name: "Bé Cũ",
      birth_year: 2018,
      age_band: "5-6",
      avatar_id: "fox",
      relationship: "parent",
      status: "archived",
      daily_play_cap_minutes: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveCookie.value = "uuid-kid-1";
    mockChildrenData.value = { children: sampleChildren };
  });

  it("lọc đúng các hồ sơ trẻ có status active (BR-CPS-05)", () => {
    const { children } = useKidProfile();
    expect(children.value).toHaveLength(2);
    expect(children.value.map((c) => c.uuid)).toEqual([
      "uuid-kid-1",
      "uuid-kid-2",
    ]);
  });

  it("tìm đúng thông tin activeChild từ cookie active_child_id (BR-CPS-06)", () => {
    const { activeChild } = useKidProfile();
    expect(activeChild.value).not.toBeNull();
    expect(activeChild.value?.display_name).toBe("Bé An");
    expect(activeChild.value?.age_band).toBe("3-4");

    mockActiveCookie.value = "uuid-kid-2";
    expect(activeChild.value?.display_name).toBe("Bé Bình");

    mockActiveCookie.value = "non-existent-uuid";
    expect(activeChild.value).toBeNull();
  });

  it("tính toán hasMultipleChildren chuẩn xác", () => {
    const { hasMultipleChildren } = useKidProfile();
    expect(hasMultipleChildren.value).toBe(true);

    mockChildrenData.value = {
      children: [sampleChildren[0] as KidProfileItem],
    };
    expect(hasMultipleChildren.value).toBe(false);
  });

  it("switchChild thành công cập nhật activeChildUuid (BR-CPS-03)", async () => {
    mockFetch.mockResolvedValueOnce({
      child: {
        uuid: "uuid-kid-2",
        display_name: "Bé Bình",
        avatar_id: "bunny",
        age_band: "5-6",
      },
    });

    const { switchChild, activeChildUuid } = useKidProfile();
    const result = await switchChild("uuid-kid-2", "valid-gate-token");

    expect(result.success).toBe(true);
    expect(result.child?.display_name).toBe("Bé Bình");
    expect(activeChildUuid.value).toBe("uuid-kid-2");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users/children/uuid-kid-2/activate",
      expect.objectContaining({
        method: "POST",
        body: { gate_token: "valid-gate-token" },
      })
    );
  });

  it("switchChild trả về requireParentGate khi server yêu cầu Parent Gate (BR-CPS-01)", async () => {
    const parentGateError = Object.assign(new Error("Parent gate required"), {
      status: 403,
      data: { code: "PARENT_GATE_REQUIRED" },
    });

    mockFetch.mockRejectedValueOnce(parentGateError);

    const { switchChild, activeChildUuid } = useKidProfile();
    const result = await switchChild("uuid-kid-2");

    expect(result.success).toBe(false);
    expect(result.requireParentGate).toBe(true);
    expect(activeChildUuid.value).toBe("uuid-kid-1"); // Chưa đổi
  });
});
