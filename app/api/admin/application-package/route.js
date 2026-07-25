import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

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
