// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRoute = {
  path: "/me",
  fullPath: "/me",
  query: {},
};

vi.stubGlobal("useRoute", () => mockRoute);

vi.mock("~/composables/use-public-seo", () => ({
  usePublicSeoHead: vi.fn(),
}));

const stubs = {
  PublicNavbar: { template: "<header data-testid='public-navbar' />" },
  PublicFooter: { template: "<footer data-testid='public-footer' />" },
  UIcon: { props: ["name"], template: '<i :data-icon="name" />' },
};

let wrapper: VueWrapper | null = null;

describe("PWA-INSTALL — PwaInstallBanner & layout mount (BR-PWA-01, BR-PWA-02, BR-PWA-03, BR-PWA-05)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockRoute.path = "/me";
    mockRoute.fullPath = "/me";
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("BR-PWA-01 & S5b: default layout mounts PwaInstallBanner on adult surface (/me) and hides on kid surface (/play)", async () => {
    const DefaultLayout = (await import("~/layouts/default.vue")).default;

    mockRoute.path = "/me";
    wrapper = mount(DefaultLayout, {
      global: { stubs },
      slots: { default: "<div>Adult dashboard</div>" },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      true
    );
    expect(wrapper.text()).toContain("Cài đặt ứng dụng MindKid");

    wrapper.unmount();
    mockRoute.path = "/play";
    wrapper = mount(DefaultLayout, {
      global: { stubs },
      slots: { default: "<div>Kid lobby</div>" },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      false
    );
  });

  it("BR-PWA-02 & BR-PWA-03: PwaInstallBanner refuses to render on /play or when completedSessionCount < 3", async () => {
    const PwaInstallBanner = (
      await import("~/components/pwa/pwa-install-banner.vue")
    ).default;

    wrapper = mount(PwaInstallBanner, {
      props: {
        currentPath: "/play",
        childCount: 1,
        completedSessionCount: 5,
      },
      global: { stubs },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      false
    );

    wrapper.unmount();
    wrapper = mount(PwaInstallBanner, {
      props: {
        currentPath: "/me",
        childCount: 1,
        completedSessionCount: 2,
      },
      global: { stubs },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      false
    );
  });

  it("BR-PWA-05: captures beforeinstallprompt, triggers prompt() on install click, and stops prompting after 2 dismissals", async () => {
    const PwaInstallBanner = (
      await import("~/components/pwa/pwa-install-banner.vue")
    ).default;

    wrapper = mount(PwaInstallBanner, {
      props: {
        currentPath: "/me",
        childCount: 1,
        completedSessionCount: 3,
      },
      global: { stubs },
    });
    await flushPromises();

    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const installEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    window.dispatchEvent(installEvent);
    await flushPromises();

    await wrapper.find('[data-testid="pwa-install-btn"]').trigger("click");
    await flushPromises();
    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      false
    );

    wrapper.unmount();
    window.localStorage.setItem(
      "mindkid_pwa_install_state",
      JSON.stringify({
        dismissed_count: 2,
        last_dismissed_at: "2026-01-01T00:00:00.000Z",
      })
    );

    wrapper = mount(PwaInstallBanner, {
      props: {
        currentPath: "/me",
        childCount: 1,
        completedSessionCount: 5,
      },
      global: { stubs },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="pwa-install-banner"]').exists()).toBe(
      false
    );
  });
});
