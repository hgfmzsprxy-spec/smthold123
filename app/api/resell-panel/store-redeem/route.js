import { hasPermission, permissionDeniedResponse } from "../../../../lib/panel-permissions";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import {
  consumeDepositCouponById,
  findDepositCouponByCode,
} from "../../../../lib/reseller-deposit-coupons";
import { getDepositVariantById } from "../../../../lib/reseller-deposit-variants";
import { getResellerProductById } from "../../../../lib/reseller-products";
import {
  consumeCouponById,
  findCouponByCode,
  normalizeCouponCode,
} from "../../../../lib/reseller-store-coupons";
import { mergePurchasedStoreProducts, updateResellerRecord } from "../../../../lib/resellers";
import { nextDiscountAfterDeposit, discountUnlockedByDepositPayAmount } from "../../../../lib/deposit-discount-tiers";
import {
  appendTransaction,
  buildResellerTransactionActor,
  TRANSACTION_TYPES,
} from "../../../../lib/transactions";

export const dynamic = "force-dynamic";

function purchasedIdsFor(reseller) {
  return Array.isArray(reseller?.purchased_store_product_ids)
    ? reseller.purchased_store_product_ids.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

async function redeemStoreCoupon(auth, coupon) {
  const product = await getResellerProductById(coupon.productId, auth.admin);
  if (!product) {
    return Response.json({ error: "Coupon product no longer exists." }, { status: 404 });
  }

  const alreadyPurchased = purchasedIdsFor(auth.reseller);
  if (alreadyPurchased.includes(String(product.id))) {
    return Response.json(
      {
        error: `You already own ${product.name}.`,
        product: { id: product.id, name: product.name },
        alreadyPurchased: true,
      },
      { status: 409 }
    );
  }

  await consumeCouponById(coupon.id, auth.admin);

  const purchasedSnapshot = {
    id: String(product.id),
    name: product.name,
    description: product.description,
    price: product.price,
    priceLabel: product.priceLabel,
    variantLabel: product.variantLabel,
    purchased_at: new Date().toISOString(),
    source: "redeem",
  };
  const purchasedStoreProducts = mergePurchasedStoreProducts(
    auth.reseller.purchased_store_products,
    purchasedSnapshot
  );

  const updatedReseller = await updateResellerRecord(
    auth.reseller.id,
    {
      purchased_store_product_ids: purchasedStoreProducts.map((row) => row.id),
      purchased_store_products: purchasedStoreProducts,
    },
    auth.admin
  );

  let transaction = null;
  try {
    const balance = Number(updatedReseller.balance) || 0;
    transaction = await appendTransaction(
      {
        type: TRANSACTION_TYPES.STORE_REDEEM,
        ...buildResellerTransactionActor(updatedReseller),
        amount: 0,
        balance_before: balance,
        balance_after: balance,
        description: `Redeemed coupon for ${product.name}`,
        actor: "reseller",
        meta: {
          product_id: product.id,
          product_name: product.name,
          coupon_code: coupon.code,
        },
      },
      auth.admin
    );
  } catch {
    // non-blocking — redeem already applied
  }

  return Response.json({
    ok: true,
    kind: "store",
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      priceLabel: product.priceLabel,
      variantLabel: product.variantLabel,
    },
    couponCode: coupon.code,
    transaction,
    reseller: {
      id: updatedReseller.id,
      balance: updatedReseller.balance,
      total_spent: updatedReseller.total_spent,
      role: updatedReseller.role,
      discount_percent: updatedReseller.discount_percent,
      application_access: updatedReseller.application_access,
      generated_license_ids: updatedReseller.generated_license_ids,
      purchased_store_product_ids: updatedReseller.purchased_store_product_ids,
      purchased_store_products: updatedReseller.purchased_store_products,
      total_licenses: updatedReseller.total_licenses,
      updated_at: updatedReseller.updated_at,
    },
  });
}

async function redeemDepositCoupon(auth, coupon) {
  const variant = await getDepositVariantById(coupon.variantId || coupon.productId, auth.admin);
  if (!variant) {
    return Response.json({ error: "Deposit variant for this coupon no longer exists." }, { status: 404 });
  }

  await consumeDepositCouponById(coupon.id, auth.admin);

  const currentBalance = Number(auth.reseller.balance) || 0;
  const credit = Math.round((Number(variant.creditAmount) || 0) * 100) / 100;
  if (!(credit > 0)) {
    return Response.json({ error: "Deposit variant has an invalid credit amount." }, { status: 400 });
  }
  const nextBalance = Math.round((currentBalance + credit) * 100) / 100;
  const currentDiscount = Number(auth.reseller.discount_percent) || 0;
  const nextDiscount = nextDiscountAfterDeposit({
    currentDiscount,
    role: auth.reseller.role,
    payAmount: variant.payAmount,
  });
  const discountIncreased = nextDiscount > currentDiscount + 0.0001;

  const updatedReseller = await updateResellerRecord(
    auth.reseller.id,
    {
      balance: nextBalance,
      discount_percent: nextDiscount,
    },
    auth.admin
  );

  const effectiveDiscount =
    String(auth.reseller.role || "").toLowerCase() === "panel_access" ? 100 : nextDiscount;

  let transaction = null;
  try {
    transaction = await appendTransaction(
      {
        type: TRANSACTION_TYPES.BALANCE_ADD,
        ...buildResellerTransactionActor(updatedReseller),
        amount: credit,
        balance_before: currentBalance,
        balance_after: nextBalance,
        description: `Deposit redeem: ${variant.name} (+$${credit.toFixed(2)})`,
        actor: "reseller",
        meta: {
          deposit_variant_id: variant.id,
          deposit_variant_name: variant.name,
          pay_amount: variant.payAmount,
          bonus_percent: variant.bonusPercent,
          credit_amount: credit,
          coupon_code: coupon.code,
          source: "deposit_redeem",
          discount_before: currentDiscount,
          discount_after: effectiveDiscount,
          discount_increased: discountIncreased,
        },
      },
      auth.admin
    );
  } catch {
    // non-blocking — balance already credited
  }

  return Response.json({
    ok: true,
    kind: "deposit",
    deposit: {
      id: variant.id,
      name: variant.name,
      payAmount: variant.payAmount,
      bonusPercent: variant.bonusPercent,
      creditAmount: credit,
      creditLabel: variant.creditLabel,
      discountUnlocked: discountUnlockedByDepositPayAmount(variant.payAmount),
      discountPercent: effectiveDiscount,
      discountIncreased,
    },
    couponCode: coupon.code,
    transaction,
    reseller: {
      id: updatedReseller.id,
      balance: nextBalance,
      total_spent: updatedReseller.total_spent,
      role: updatedReseller.role,
      discount_percent: effectiveDiscount,
      application_access: updatedReseller.application_access,
      generated_license_ids: updatedReseller.generated_license_ids,
      purchased_store_product_ids: updatedReseller.purchased_store_product_ids,
      purchased_store_products: updatedReseller.purchased_store_products,
      total_licenses: updatedReseller.total_licenses,
      updated_at: updatedReseller.updated_at || new Date().toISOString(),
    },
  });
}

export async function POST(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (
      !hasPermission(auth.permissions, "store.redeem") &&
      !hasPermission(auth.permissions, "deposit.checkout")
    ) {
      return permissionDeniedResponse("Missing permission: Redeem store or deposit coupons.");
    }

    const body = await request.json().catch(() => ({}));
    const code = normalizeCouponCode(body?.code || body?.coupon || body?.couponCode);
    if (!code) {
      return Response.json({ error: "Enter a coupon code." }, { status: 400 });
    }

    let storeCoupon = null;
    try {
      storeCoupon = await findCouponByCode(code, auth.admin);
    } catch (error) {
      if (error?.code !== "TABLE_MISSING") throw error;
    }

    if (storeCoupon) {
      return redeemStoreCoupon(auth, storeCoupon);
    }

    let depositCoupon = null;
    try {
      depositCoupon = await findDepositCouponByCode(code, auth.admin);
    } catch (error) {
      if (error?.code === "TABLE_MISSING") {
        return Response.json({ error: error.message }, { status: 503 });
      }
      throw error;
    }

    if (!depositCoupon) {
      return Response.json({ error: "Invalid or already used coupon." }, { status: 404 });
    }

    return redeemDepositCoupon(auth, depositCoupon);
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
