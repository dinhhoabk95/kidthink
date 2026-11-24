import {
  ENTITLEMENT_KEYS,
  type Offer,
  PACKAGE_CATALOG,
  type PackageDefinition,
  PENDING_PRICE_VND as PENDING_PRICE,
} from "@mindkid/shared";
import {
  ENTITLEMENT_GROUP_CODEC,
  type EntitlementGroupLabel,
  PACKAGE_STATUS_CODEC,
  type PackageStatusLabel,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord, JsonValue } from "#src/constants/json";

export const PENDING_PRICE_VND = PENDING_PRICE;

function serializeOffers(offers: readonly Offer[]): JsonValue {
  return offers.map(
    (offer): JsonRecord => ({
      offer_code: offer.offer_code,
      billing_period: offer.billing_period,
      price_vnd: offer.price_vnd,
      duration_days: offer.duration_days,
    })
  );
}

function serializeQuotas(quotas: PackageDefinition["quotas"]): JsonRecord {
  const out: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(quotas)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export const SEED_ENTITLEMENT_KEYS = ENTITLEMENT_KEYS.map((item) => ({
  key: item.key,
  group: ENTITLEMENT_GROUP_CODEC.toCode(item.group as EntitlementGroupLabel),
  label: item.label,
  isMvp: item.is_mvp,
}));

export const SEED_PACKAGES = Object.values(PACKAGE_CATALOG).map((pkg) => ({
  code: pkg.code,
  name: pkg.name,
  audience: pkg.audience,
  description: pkg.description,
  status: PACKAGE_STATUS_CODEC.toCode(pkg.status as PackageStatusLabel),
  offers: serializeOffers(pkg.offers),
  quotas: serializeQuotas(pkg.quotas),
  isPublic: pkg.is_public,
  isFeatured: pkg.is_featured,
}));
