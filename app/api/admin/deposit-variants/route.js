import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  computeDepositCredit,
  normalizeDepositVariant,
  readDepositVariantsStore,
  writeDepositVariantsStore,
} from "../../../../lib/reseller-deposit-variants";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

function parseMoney(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: `${label} must be a positive number.` };
  }
  return { value: Math.round(amount * 100) / 100 };
}

function parseBonus(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Bonus percent must be a valid non-negative number." };
  }
  return { value: Math.round(amount * 100) / 100 };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const store = await readDepositVariantsStore(getSupabaseAdmin());
    return NextResponse.json({ variants: store.variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const pay = parseMoney(body?.payAmount ?? body?.pay_amount, "Pay amount");
    if (pay.error) return NextResponse.json({ error: pay.error }, { status: 400 });
    const bonus = parseBonus(body?.bonusPercent ?? body?.bonus_percent ?? 0);
    if (bonus.error) return NextResponse.json({ error: bonus.error }, { status: 400 });

    const admin = getSupabaseAdmin();
    const store = await readDepositVariantsStore(admin);
    const now = new Date().toISOString();
    const creditAmount = computeDepositCredit(pay.value, bonus.value);
    const variant = normalizeDepositVariant(
      {
        id: randomUUID(),
        slug: body?.slug,
        name: body?.name || `Deposit $${pay.value.toFixed(0)}`,
        payAmount: pay.value,
        bonusPercent: bonus.value,
        creditAmount,
        popular: Boolean(body?.popular),
        productId: body?.productId ?? body?.product_id ?? 0,
        variantId: body?.variantId ?? body?.variant_id ?? 0,
        sort_order: store.variants.length,
        created_at: now,
        updated_at: now,
      },
      store.variants.length
    );

    if (!variant) {
      return NextResponse.json({ error: "Invalid deposit variant." }, { status: 400 });
    }

    const next = await writeDepositVariantsStore([...store.variants, variant], admin);
    return NextResponse.json({ ok: true, variant, variants: next.variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Variant id is required." }, { status: 400 });

    const admin = getSupabaseAdmin();
    const store = await readDepositVariantsStore(admin);
    const index = store.variants.findIndex((entry) => entry.id === id);
    if (index < 0) return NextResponse.json({ error: "Deposit variant not found." }, { status: 404 });

    const current = store.variants[index];
    const pay =
      body?.payAmount != null || body?.pay_amount != null
        ? parseMoney(body?.payAmount ?? body?.pay_amount, "Pay amount")
        : { value: current.payAmount };
    if (pay.error) return NextResponse.json({ error: pay.error }, { status: 400 });

    const bonus =
      body?.bonusPercent != null || body?.bonus_percent != null
        ? parseBonus(body?.bonusPercent ?? body?.bonus_percent)
        : { value: current.bonusPercent };
    if (bonus.error) return NextResponse.json({ error: bonus.error }, { status: 400 });

    const updated = normalizeDepositVariant(
      {
        ...current,
        name: body?.name != null ? body.name : current.name,
        slug: body?.slug != null ? body.slug : current.slug,
        payAmount: pay.value,
        bonusPercent: bonus.value,
        creditAmount: computeDepositCredit(pay.value, bonus.value),
        popular: body?.popular != null ? Boolean(body.popular) : current.popular,
        productId: body?.productId ?? body?.product_id ?? current.productId,
        variantId: body?.variantId ?? body?.variant_id ?? current.variantId,
        updated_at: new Date().toISOString(),
      },
      index
    );

    const nextList = [...store.variants];
    nextList[index] = updated;
    const next = await writeDepositVariantsStore(nextList, admin);
    return NextResponse.json({ ok: true, variant: updated, variants: next.variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Variant id is required." }, { status: 400 });

    const admin = getSupabaseAdmin();
    const store = await readDepositVariantsStore(admin);
    const nextList = store.variants.filter((entry) => entry.id !== id);
    if (nextList.length === store.variants.length) {
      return NextResponse.json({ error: "Deposit variant not found." }, { status: 404 });
    }
    const next = await writeDepositVariantsStore(nextList, admin);
    return NextResponse.json({ ok: true, variants: next.variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}
