import { createClient } from "@supabase/supabase-js";

const PUBLIC_META_SELECT_ATTEMPTS = [
  "id, app_id, version, status, download_updated_at, created_at",
  "app_id, version, status, download_updated_at, created_at",
  "id, app_id, version, status, created_at",
  "app_id, version, status, created_at",
  "id, app_id, version, status, download_updated_at",
  "app_id, version, status, download_updated_at",
];

const PRIVATE_META_SELECT_ATTEMPTS = [
  "id, app_id, version, status, download_updated_at, created_at, download_file_name, download_file_type, download_file_size, download_file_data_base64",
  "id, app_id, version, status, download_updated_at, download_file_name, download_file_type, download_file_size, download_file_data_base64",
  "id, app_id, version, status, created_at, download_file_name, download_file_type, download_file_size, download_file_data_base64",
  "id, app_id, version, status, download_file_name, download_file_type, download_file_size, download_file_data_base64",
];

export function createApplicationMetaClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !(serviceKey || anonKey)) return null;

  return createClient(url, serviceKey || anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function queryApplicationMetaRecord(supabaseClient, appId, isLoggedIn = false) {
  if (!supabaseClient || !appId) {
    return { ok: false, error: "Supabase client is not configured.", data: null };
  }

  const attempts = isLoggedIn ? PRIVATE_META_SELECT_ATTEMPTS : PUBLIC_META_SELECT_ATTEMPTS;
  let lastError = null;

  for (const selectClause of attempts) {
    const { data, error } = await supabaseClient
      .from("applications")
      .select(selectClause)
      .eq("app_id", appId)
      .maybeSingle();

    if (!error && data) {
      return { ok: true, data, error: null };
    }

    lastError = error;
  }

  return {
    ok: false,
    error: lastError?.message || "Application metadata could not be loaded.",
    data: null,
  };
}

export async function queryApplicationMetaByAppId(appId) {
  const client = createApplicationMetaClient();
  if (!client) return null;

  const result = await queryApplicationMetaRecord(client, appId, false);
  return result.ok ? result.data : null;
}
