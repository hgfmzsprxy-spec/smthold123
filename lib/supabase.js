import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `npm run dev`.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
