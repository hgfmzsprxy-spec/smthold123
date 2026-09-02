import { assertPermission } from "../../../../lib/panel-permissions";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import { getResellerProductById } from "../../../../lib/reseller-products";
import { claimNextCouponForProduct } from "../../../../lib/reseller-store-coupons";
import { mergePurchasedStoreProducts, updateResellerRecord } from "../../../../lib/resellers";

export const dynamic = "force-dynamic";

function purchasedIdsFor(reseller) {
  return Array.isArray(reseller?.purchased_store_product_ids)
    ? reseller.purchased_store_product_ids.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

export async function POST(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "store.purchase");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const productId = String(body?.productId || body?.product_id || "").trim();
    if (!productId) {
      return Response.json({ error: "productId is required." }, { status: 400 });
    }

    const product = await getResellerProductById(productId, auth.admin);
    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    const alreadyPurchased = purchasedIdsFor(auth.reseller);
    if (alreadyPurchased.includes(String(product.id))) {
      return Response.json({ error: "You already purchased this product." }, { status: 409 });
    }

    const price = Math.round((Number(product.price) || 0) * 100) / 100;
    if (!(price > 0)) {
      return Response.json({ error: "Product has an invalid price." }, { status: 400 });
    }

    const currentBalance = Number(auth.reseller.balance) || 0;
    if (price > currentBalance) {
      return Response.json(
        {
          error: `Insufficient balance. Need $${price.toFixed(2)}, you have $${currentBalance.toFixed(2)}.`,
          balance: currentBalance,
          price,
        },
        { status: 402 }
      );
    }

    let coupon;
    try {
      coupon = await claimNextCouponForProduct(product.id, auth.admin);
    } catch (error) {
      if (error?.code === "OUT_OF_STOCK" || error?.code === "TABLE_MISSING") {
        return Response.json({ error: error.message }, { status: error.code === "OUT_OF_STOCK" ? 409 : 503 });
      }
      throw error;
    }

    const nextBalance = Math.round((currentBalance - price) * 100) / 100;
    const nextSpent = Math.round(((Number(auth.reseller.total_spent) || 0) + price) * 100) / 100;
    const purchasedSnapshot = {
      id: String(product.id),
      name: product.name,
      description: product.description,
      price,
      priceLabel: product.priceLabel,
      variantLabel: product.variantLabel,
      purchased_at: new Date().toISOString(),
      source: "balance",
    };
    const purchasedStoreProducts = mergePurchasedStoreProducts(
      auth.reseller.purchased_store_products,
      purchasedSnapshot
    );

    let updatedReseller;
    try {
      updatedReseller = await updateResellerRecord(
        auth.reseller.id,
        {
          balance: nextBalance,
          total_spent: nextSpent,
          purchased_store_product_ids: purchasedStoreProducts.map((row) => row.id),
          purchased_store_products: purchasedStoreProducts,
        },
        auth.admin
      );
    } catch (error) {
      // Best-effort: do not leave a dangling unused coupon if balance write fails.
      try {
        const { replaceCouponsForProduct, listCouponsForProduct } = await import(
          "../../../../lib/reseller-store-coupons"
        );
        const existing = await listCouponsForProduct(product.id, auth.admin);
        await replaceCouponsForProduct(
          product.id,
          [coupon.code, ...existing.map((row) => row.code)],
          auth.admin
        );
      } catch {
        // ignore restore errors
      }
      throw error;
    }

    try {
      const { appendTransaction, buildResellerTransactionActor, TRANSACTION_TYPES } = await import(
        "../../../../lib/transactions"
      );
      await appendTransaction(
        {
          type: TRANSACTION_TYPES.STORE_PURCHASE,
          ...buildResellerTransactionActor(updatedReseller),
          amount: -price,
          balance_before: currentBalance,
          balance_after: nextBalance,
          description: `Store purchase: ${product.name}`,
          actor: "reseller",
          meta: {
            product_id: product.id,
            product_name: product.name,
            price,
            payment_method: "balance",
            delivery_code: coupon.code,
          },
        },
        auth.admin
      );
    } catch {
      // non-blocking ledger write
    }

    return Response.json({
      ok: true,
      product: {
        id: product.id,
        name: product.name,
        price,
        priceLabel: product.priceLabel,
      },
      deliveryCode: coupon.code,
      purchased: true,
      pricing: {
        price,
        previousBalance: currentBalance,
        balance: nextBalance,
      },
      reseller: {
        id: updatedReseller.id,
        balance: nextBalance,
        total_spent: nextSpent,
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
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
