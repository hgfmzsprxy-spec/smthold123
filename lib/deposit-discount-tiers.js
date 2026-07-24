/**
 * One-time deposit packages unlock higher reseller license discounts.
 * Discount can only increase (never decrease) after a deposit.
 */

export const DEFAULT_RESELLER_DISCOUNT_PERCENT = 30;

/** Pay-amount thresholds → unlocked discount %. Highest matching tier wins. */
export const DEPOSIT_DISCOUNT_TIERS = [
  { payAmount: 1000, discountPercent: 60, label: "VIP Guy", payLabel: "$1000" },
  { payAmount: 250, discountPercent: 50, label: "Deposit $250", payLabel: "$250" },
  { payAmount: 100, discountPercent: 40, label: "Deposit $100", payLabel: "$100" },
];

export const DEPOSIT_DISCOUNT_LEGEND = [
  {
    id: "starting",
    title: "Starter",
    payLabel: "Included",
    discountPercent: DEFAULT_RESELLER_DISCOUNT_PERCENT,
    note: "Default for new accounts",
  },
  {
    id: "100",
    title: "Boost",
    payLabel: "$100",
    discountPercent: 40,
    note: "One-time deposit",
  },
  {
    id: "250",
    title: "Pro",
    payLabel: "$250",
    discountPercent: 50,
    note: "One-time deposit",
  },
  {
    id: "vip",
    title: "VIP Guy",
    payLabel: "$1000",
    discountPercent: 60,
    note: "Top tier unlock",
  },
];

export function discountUnlockedByDepositPayAmount(payAmount) {
  const pay = Number(payAmount) || 0;
  for (const tier of DEPOSIT_DISCOUNT_TIERS) {
    if (pay + 0.0001 >= tier.payAmount) return tier.discountPercent;
  }
  return null;
}

/**
 * Returns the next discount % after a deposit. Never goes down.
 * panel_access stays at 100.
 */
export function nextDiscountAfterDeposit({
  currentDiscount = DEFAULT_RESELLER_DISCOUNT_PERCENT,
  role = "reseller",
  payAmount = 0,
} = {}) {
  if (String(role || "").trim().toLowerCase() === "panel_access") return 100;

  const current = Math.min(100, Math.max(0, Number(currentDiscount) || 0));
  const unlocked = discountUnlockedByDepositPayAmount(payAmount);
  if (unlocked == null) return current;
  return Math.max(current, unlocked);
}
