import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const APPLICATION_IMAGE_BUCKET = "application-images";

export function getApplicationImagePublicUrl(appId, cacheBust = "") {
  if (!supabaseUrl || !appId) return "";
  const base = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${APPLICATION_IMAGE_BUCKET}/${encodeURIComponent(appId)}/main.webp`;
  return cacheBust ? `${base}?v=${encodeURIComponent(cacheBust)}` : base;
}
