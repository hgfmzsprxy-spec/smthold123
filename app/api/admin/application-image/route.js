import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { APPLICATION_IMAGE_BUCKET, getApplicationImagePublicUrl, getSupabaseAdmin } from "../../../../lib/supabase-admin";

async function ensureBucket(admin) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === APPLICATION_IMAGE_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(APPLICATION_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg", "image/gif"],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const appId = String(body?.appId || "").trim();
    const base64 = String(body?.base64 || "").trim();
    const mime = String(body?.mime || "image/webp").trim() || "image/webp";

    if (!appId || !base64) {
      return NextResponse.json({ error: "appId and base64 are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await ensureBucket(admin);

    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) {
      return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
    }

    const path = `${appId}/main.webp`;
    const { error: uploadError } = await admin.storage.from(APPLICATION_IMAGE_BUCKET).upload(path, buffer, {
      contentType: mime.startsWith("image/") ? mime : "image/webp",
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || String(uploadError) }, { status: 500 });
    }

    const cacheBust = String(Date.now());
    return NextResponse.json({
      ok: true,
      path,
      url: getApplicationImagePublicUrl(appId, cacheBust),
      image_updated_at: new Date().toISOString(),
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
    const appId = String(body?.appId || "").trim();
    if (!appId) {
      return NextResponse.json({ error: "appId is required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await ensureBucket(admin);

    const path = `${appId}/main.webp`;
    const { error } = await admin.storage.from(APPLICATION_IMAGE_BUCKET).remove([path]);
    if (error && !/not found|does not exist/i.test(error.message || "")) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
