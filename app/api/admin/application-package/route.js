import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { APPLICATION_PACKAGE_BUCKET, getSupabaseAdmin } from "../../../../lib/supabase-admin";
import {
  buildApplicationPackagePath,
  buildApplicationPackageStorageRef,
  parseApplicationPackageStorageRef,
} from "../../../../lib/application-package-storage";

export const dynamic = "force-dynamic";

async function ensureBucket(admin) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === APPLICATION_PACKAGE_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(APPLICATION_PACKAGE_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "application/octet-stream",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-msdownload",
      "application/vnd.microsoft.portable-executable",
    ],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const appId = String(url.searchParams.get("appId") || url.searchParams.get("id") || "").trim();
    if (!appId) {
      return NextResponse.json({ error: "appId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("applications")
      .select(
        "id, download_file_name, download_file_type, download_file_size, download_file_sha256, download_file_data_base64, download_updated_at, version, status"
      )
      .eq("id", appId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      application: data,
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
    const appId = String(body?.appId || "").trim();
    const fileName = String(body?.fileName || "").trim();
    const sha256 = String(body?.sha256 || "").trim().toLowerCase();

    if (!appId || !fileName) {
      return NextResponse.json({ error: "appId and fileName are required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await ensureBucket(admin);

    const path = buildApplicationPackagePath(appId, fileName, sha256);
    const signed = await admin.storage.from(APPLICATION_PACKAGE_BUCKET).createSignedUploadUrl(path, { upsert: true });

    if (signed.error) {
      return NextResponse.json({ error: signed.error.message || String(signed.error) }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      path,
      token: signed.data.token,
      signedUrl: signed.data.signedUrl,
      storageRef: buildApplicationPackageStorageRef(path),
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
      return NextResponse.json({ error: "appId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await ensureBucket(admin);

    const { data, error } = await admin
      .from("applications")
      .select("id, download_file_data_base64")
      .eq("id", appId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const storagePath = parseApplicationPackageStorageRef(data.download_file_data_base64);
    if (storagePath) {
      const { error: removeError } = await admin.storage.from(APPLICATION_PACKAGE_BUCKET).remove([storagePath]);
      if (removeError && !/not found|does not exist/i.test(removeError.message || "")) {
        throw removeError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
