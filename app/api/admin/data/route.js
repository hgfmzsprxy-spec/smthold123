import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const ALLOWED_TABLES = new Set(["applications", "licenses", "application_variants", "reseller_store_products"]);

function applyFilters(query, filters) {
  let next = query;
  const entries = filters && typeof filters === "object" ? Object.entries(filters) : [];
  for (const [column, raw] of entries) {
    const value = String(raw ?? "");
    const eqIdx = value.indexOf(".");
    if (eqIdx <= 0) {
      next = next.eq(column, value);
      continue;
    }
    const op = value.slice(0, eqIdx);
    const operand = value.slice(eqIdx + 1);
    if (op === "eq") next = next.eq(column, operand);
    else if (op === "neq") next = next.neq(column, operand);
    else if (op === "in") {
      const list = operand
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      next = next.in(column, list);
    } else next = next.eq(column, operand);
  }
  return next;
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const table = String(body?.table || "").trim();
    const action = String(body?.action || body?.op || "select").trim().toLowerCase();
    const select = String(body?.select || "*").trim() || "*";
    const filters = body?.filters && typeof body.filters === "object" ? body.filters : {};
    const order = String(body?.order || "").trim();
    const payload = body?.data ?? body?.body ?? null;
    const preferRepresentation = body?.prefer !== "minimal";

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: `Table "${table}" is not allowed.` }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let query;

    if (action === "select" || action === "get") {
      query = admin.from(table).select(select);
      query = applyFilters(query, filters);
      if (order) {
        const [column, direction] = order.split(".");
        query = query.order(column, { ascending: direction !== "desc" });
      }
    } else if (action === "insert" || action === "post") {
      if (payload == null) {
        return NextResponse.json({ error: "data is required for insert." }, { status: 400 });
      }
      query = preferRepresentation
        ? admin.from(table).insert(payload).select(select)
        : admin.from(table).insert(payload);
    } else if (action === "update" || action === "patch") {
      if (payload == null || typeof payload !== "object") {
        return NextResponse.json({ error: "data is required for update." }, { status: 400 });
      }
      if (!Object.keys(filters).length) {
        return NextResponse.json({ error: "filters are required for update." }, { status: 400 });
      }
      query = preferRepresentation
        ? applyFilters(admin.from(table).update(payload).select(select), filters)
        : applyFilters(admin.from(table).update(payload), filters);
    } else if (action === "delete") {
      if (!Object.keys(filters).length) {
        return NextResponse.json({ error: "filters are required for delete." }, { status: 400 });
      }
      query = preferRepresentation
        ? applyFilters(admin.from(table).delete().select(select), filters)
        : applyFilters(admin.from(table).delete(), filters);
    } else {
      return NextResponse.json({ error: `Unsupported action "${action}".` }, { status: 400 });
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 400 });
    }

    if (
      preferRepresentation &&
      (action === "update" || action === "patch" || action === "delete") &&
      Array.isArray(data) &&
      data.length === 0
    ) {
      return NextResponse.json(
        { error: `No rows affected in ${table}. Check filters / permissions.`, data: [] },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, data, count: count ?? null });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
