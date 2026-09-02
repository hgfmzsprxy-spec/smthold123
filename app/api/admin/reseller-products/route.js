import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  normalizeResellerProduct,
  readResellerProductsStore,
  writeResellerProductsStore,
} from "../../../../lib/reseller-products";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

function parseRequiredId(value, label) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    return { error: `${label} is required and must be a positive number.` };
  }
  return { value: Math.trunc(id) };
}

function parsePrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a valid non-negative number." };
  }
  return { value: Math.round(price * 100) / 100 };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.view");
    if (denied) return denied;

    const admin = getSupabaseAdmin();
    const store = await readResellerProductsStore(admin);
    return NextResponse.json({ products: store.products });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }

    const productId = parseRequiredId(body?.productId ?? body?.product_id, "Product ID");
    if (productId.error) return NextResponse.json({ error: productId.error }, { status: 400 });

    const variantId = parseRequiredId(body?.variantId ?? body?.variant_id, "Variant ID");
    if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });

    const price = parsePrice(body?.price ?? 0);
    if (price.error) return NextResponse.json({ error: price.error }, { status: 400 });

    const admin = getSupabaseAdmin();
    const store = await readResellerProductsStore(admin);
    const now = new Date().toISOString();

    const product = normalizeResellerProduct(
      {
        id: randomUUID(),
        slug: body?.slug,
        name,
        description: body?.description,
        price: price.value,
        variantLabel: body?.variantLabel ?? body?.variant_label,
        productId: productId.value,
        variantId: variantId.value,
        sort_order: store.products.length,
        created_at: now,
        updated_at: now,
      },
      store.products.length
    );

    if (!product) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }

    const next = await writeResellerProductsStore([...store.products, product], admin);
    return NextResponse.json({ products: next.products, product });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readResellerProductsStore(admin);
    const index = store.products.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const current = store.products[index];
    const nextName = body?.name != null ? String(body.name).trim() : current.name;
    if (!nextName) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }

    const productIdSource = body?.productId ?? body?.product_id ?? current.productId;
    const variantIdSource = body?.variantId ?? body?.variant_id ?? current.variantId;
    const productId = parseRequiredId(productIdSource, "Product ID");
    if (productId.error) return NextResponse.json({ error: productId.error }, { status: 400 });
    const variantId = parseRequiredId(variantIdSource, "Variant ID");
    if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });

    const priceSource = body?.price != null ? body.price : current.price;
    const price = parsePrice(priceSource);
    if (price.error) return NextResponse.json({ error: price.error }, { status: 400 });

    const updated = normalizeResellerProduct(
      {
        ...current,
        slug: body?.slug != null ? body.slug : current.slug,
        name: nextName,
        description: body?.description != null ? body.description : current.description,
        price: price.value,
        variantLabel: body?.variantLabel ?? body?.variant_label ?? current.variantLabel,
        productId: productId.value,
        variantId: variantId.value,
        updated_at: new Date().toISOString(),
      },
      index
    );

    if (!updated) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }

    const products = [...store.products];
    products[index] = updated;
    const next = await writeResellerProductsStore(products, admin);
    return NextResponse.json({
      products: next.products,
      product: next.products.find((entry) => entry.id === id) || updated,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readResellerProductsStore(admin);
    if (!store.products.some((entry) => entry.id === id)) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const next = await writeResellerProductsStore(
      store.products.filter((entry) => entry.id !== id),
      admin
    );
    return NextResponse.json({ products: next.products, deleted: id });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
