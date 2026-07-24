import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  buildResellerProfileFromAuthUser,
  computeResellerMetrics,
  findAuthUserByEmail,
  normalizeReseller,
  normalizeResellerDiscount,
  normalizeResellerRole,
  readResellersStore,
  writeResellersStore,
} from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

function parseApplicationAccess(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function parseMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

function parseRolePayload(body, fallbackRole = "reseller", fallbackDiscount = 0) {
  const role = normalizeResellerRole(body?.role ?? fallbackRole);
  const discountSource =
    role === "panel_access" ? 100 : body?.discount_percent ?? body?.discountPercent ?? fallbackDiscount;
  return {
    role,
    discount_percent: normalizeResellerDiscount(role, discountSource),
  };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    return NextResponse.json({
      resellers: store.resellers,
      metrics: computeResellerMetrics(store.resellers),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid Discord-linked email is required." }, { status: 400 });
    }

    const applicationAccess = parseApplicationAccess(body?.application_access || body?.applicationAccess);
    const startingBalance = parseMoney(body?.balance ?? body?.startingBalance ?? 0);
    if (startingBalance == null || startingBalance < 0) {
      return NextResponse.json({ error: "Starting balance must be a valid non-negative number." }, { status: 400 });
    }

    const rolePayload = parseRolePayload(body, "reseller", 0);
    if (rolePayload.role === "reseller") {
      const discount = Number(body?.discount_percent ?? body?.discountPercent);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return NextResponse.json({ error: "Reseller discount must be between 0 and 100." }, { status: 400 });
      }
    }

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    if (store.resellers.some((entry) => entry.email === email)) {
      return NextResponse.json({ error: "This email is already registered as a reseller." }, { status: 409 });
    }

    const authUser = await findAuthUserByEmail(email, admin);
    const profile = buildResellerProfileFromAuthUser(authUser);
    const now = new Date().toISOString();

    const reseller = normalizeReseller({
      id: randomUUID(),
      email,
      ...profile,
      application_access: applicationAccess,
      role: rolePayload.role,
      discount_percent: rolePayload.discount_percent,
      total_licenses: 0,
      balance: startingBalance,
      total_spent: 0,
      status: "active",
      created_at: now,
      updated_at: now,
    });

    const next = await writeResellersStore([reseller, ...store.resellers], admin);

    if (startingBalance > 0) {
      void (async () => {
        try {
          const { appendTransaction, buildResellerTransactionActor, TRANSACTION_TYPES } = await import(
            "../../../../lib/transactions"
          );
          await appendTransaction(
            {
              type: TRANSACTION_TYPES.BALANCE_ADD,
              ...buildResellerTransactionActor(reseller),
              amount: startingBalance,
              balance_before: 0,
              balance_after: startingBalance,
              description: `Starting balance for ${reseller.email}`,
              actor: "admin",
              meta: { reason: "reseller_created" },
            },
            admin
          );
        } catch {
          // non-blocking ledger write
        }
      })();
    }

    return NextResponse.json({
      ok: true,
      reseller,
      resellers: next.resellers,
      metrics: computeResellerMetrics(next.resellers),
      linked: Boolean(authUser),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const resellerId = String(body?.id || body?.resellerId || "").trim();
    if (!resellerId) {
      return NextResponse.json({ error: "Reseller id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    const index = store.resellers.findIndex((entry) => entry.id === resellerId);
    if (index < 0) {
      return NextResponse.json({ error: "Reseller not found." }, { status: 404 });
    }

    const current = store.resellers[index];
    const patch = { ...current, updated_at: new Date().toISOString() };

    if (body?.application_access != null || body?.applicationAccess != null) {
      patch.application_access = parseApplicationAccess(body?.application_access || body?.applicationAccess);
    }

    if (body?.role != null || body?.discount_percent != null || body?.discountPercent != null) {
      const rolePayload = parseRolePayload(body, current.role, current.discount_percent);
      if (rolePayload.role === "reseller" && (body?.discount_percent != null || body?.discountPercent != null)) {
        const discount = Number(body?.discount_percent ?? body?.discountPercent);
        if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
          return NextResponse.json({ error: "Reseller discount must be between 0 and 100." }, { status: 400 });
        }
      }
      patch.role = rolePayload.role;
      patch.discount_percent = rolePayload.discount_percent;
    }

    if (body?.balanceDelta != null || body?.balance_delta != null) {
      const delta = parseMoney(body?.balanceDelta ?? body?.balance_delta);
      if (delta == null) {
        return NextResponse.json({ error: "balanceDelta must be a valid number." }, { status: 400 });
      }
      patch.balance = Math.round(((Number(current.balance) || 0) + delta) * 100) / 100;
    } else if (body?.balance != null) {
      const nextBalance = parseMoney(body.balance);
      if (nextBalance == null) {
        return NextResponse.json({ error: "balance must be a valid number." }, { status: 400 });
      }
      patch.balance = nextBalance;
    }

    const previousBalance = Number(current.balance) || 0;
    const updated = normalizeReseller(patch);
    const nextEntries = [...store.resellers];
    nextEntries[index] = updated;
    const next = await writeResellersStore(nextEntries, admin);

    const nextBalance = Number(updated.balance) || 0;
    const balanceChanged = Math.abs(nextBalance - previousBalance) > 0.0001;
    if (balanceChanged) {
      // Do not block the admin UI on ledger Storage writes.
      void (async () => {
        try {
          const { appendTransaction, buildResellerTransactionActor, TRANSACTION_TYPES } = await import(
            "../../../../lib/transactions"
          );
          const delta = Math.round((nextBalance - previousBalance) * 100) / 100;
          const usedDelta = body?.balanceDelta != null || body?.balance_delta != null;
          const type =
            !usedDelta && body?.balance != null
              ? TRANSACTION_TYPES.BALANCE_SET
              : delta >= 0
                ? TRANSACTION_TYPES.BALANCE_ADD
                : TRANSACTION_TYPES.BALANCE_REMOVE;
          await appendTransaction(
            {
              type,
              ...buildResellerTransactionActor(updated),
              amount: delta,
              balance_before: previousBalance,
              balance_after: nextBalance,
              description:
                type === TRANSACTION_TYPES.BALANCE_SET
                  ? `Balance set to $${nextBalance.toFixed(2)}`
                  : delta >= 0
                    ? `Added $${Math.abs(delta).toFixed(2)} to balance`
                    : `Removed $${Math.abs(delta).toFixed(2)} from balance`,
              actor: "admin",
              meta: {
                reason: usedDelta ? "balance_delta" : "balance_set",
                delta,
              },
            },
            admin
          );
        } catch {
          // non-blocking ledger write
        }
      })();
    }

    return NextResponse.json({
      ok: true,
      reseller: updated,
      resellers: next.resellers,
      metrics: computeResellerMetrics(next.resellers),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const resellerId = String(body?.id || body?.resellerId || "").trim();
    if (!resellerId) {
      return NextResponse.json({ error: "Reseller id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    const nextResellers = store.resellers.filter((entry) => entry.id !== resellerId);
    if (nextResellers.length === store.resellers.length) {
      return NextResponse.json({ error: "Reseller not found." }, { status: 404 });
    }

    const next = await writeResellersStore(nextResellers, admin);
    return NextResponse.json({
      ok: true,
      resellers: next.resellers,
      metrics: computeResellerMetrics(next.resellers),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
