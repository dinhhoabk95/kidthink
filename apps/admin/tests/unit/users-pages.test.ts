import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Task 6 — Admin Users Screens (BR-USM-01..08, BR-USD-01..06, BR-CPA-01..08, D-IW, D-IX)", () => {
  const usersIndexContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/users/index.vue"),
    "utf-8"
  );
  const userDetailContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/users/[uuid].vue"),
    "utf-8"
  );
  const userAccountContent = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/users/user-account-section.vue"
    ),
    "utf-8"
  );
  const userChildrenContent = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/users/user-children-section.vue"
    ),
    "utf-8"
  );
  const userEntitlementsContent = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/users/user-entitlements-section.vue"
    ),
    "utf-8"
  );
  const userPaymentsContent = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/users/user-payments-section.vue"
    ),
    "utf-8"
  );

  it("Scenario: D-IW & D-IY — both pages declare layout manager and role guard ForbiddenState", () => {
    expect(usersIndexContent).toContain('layout: "manager"');
    expect(userDetailContent).toContain('layout: "manager"');

    expect(usersIndexContent).toContain("<ForbiddenState");
    expect(userDetailContent).toContain("<ForbiddenState");
  });

  it("Scenario: /users index has filter bar covering §7.1 and reset capability", () => {
    expect(usersIndexContent).toContain("filterForm.q");
    expect(usersIndexContent).toContain("filterForm.status");
    expect(usersIndexContent).toContain("filterForm.package_code");
    expect(usersIndexContent).toContain("filterForm.has_children");
    expect(usersIndexContent).toContain("filterForm.sort");
    expect(usersIndexContent).toContain("resetFilters");
  });

  it("Scenario: BR-USM-03 — suspend and reactivate modals enforce >= 10 characters reason", () => {
    expect(usersIndexContent).toContain("isReasonValid");
    expect(usersIndexContent).toContain('minlength="10"');
    expect(usersIndexContent).toContain(
      "actionModal.reason.trim().length >= 10"
    );
  });

  it("Scenario: /users empty state suggests searching by full email address (§5)", () => {
    expect(usersIndexContent).toContain("địa chỉ email đầy đủ");
  });

  it("Scenario: /users/[uuid] presents 4 groups (§7.1)", () => {
    expect(userDetailContent).toContain("<UserAccountSection");
    expect(userDetailContent).toContain("<UserChildrenSection");
    expect(userDetailContent).toContain("<UserEntitlementsSection");
    expect(userDetailContent).toContain("<UserPaymentsSection");

    expect(userAccountContent).toContain("Thông tin tài khoản");
    expect(userChildrenContent).toContain("Hồ sơ trẻ");
    expect(userEntitlementsContent).toContain("Gói & Quyền sử dụng");
    expect(userPaymentsContent).toContain("Lịch sử đơn thanh toán");
  });

  it("Scenario: P2.4 — manual grant and revoke modals in userEntitlementsSection enforce strict validation (BR-EGR-02, BR-EGR-04)", () => {
    expect(userEntitlementsContent).toContain("openGrantModal");
    expect(userEntitlementsContent).toContain(
      "grantForm.grant_reason.trim().length < 20"
    );
    expect(userEntitlementsContent).toContain("openRevokeModal");
    expect(userEntitlementsContent).toContain(
      "revokeReason.trim().length < 10"
    );
  });

  it("Scenario: BR-CPA-07 — child profile archive modal requires >= 10 characters reason", () => {
    const archiveModalContent = readFileSync(
      join(
        import.meta.dirname,
        "../../app/components/users/child-archive-modal.vue"
      ),
      "utf-8"
    );
    expect(archiveModalContent).toContain('minlength="10"');
    expect(archiveModalContent).toContain("reason.trim().length < 10");
  });
});
