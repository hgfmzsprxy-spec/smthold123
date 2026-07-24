import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  createNotificationEntry,
  normalizeNotificationBadges,
  readNotificationStore,
  writeNotificationStore,
} from "../../../../lib/panel-notifications";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const store = await readNotificationStore(admin);
    return NextResponse.json({ ok: true, entries: store.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const description = String(body?.description || body?.body || "").trim();
    const badges = normalizeNotificationBadges({
      badges: body?.badges,
      badge_label: body?.badge_label || body?.badgeLabel,
      badge_color: body?.badge_color || body?.badgeColor,
    });

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readNotificationStore(admin);
    const entry = createNotificationEntry({
      title,
      description,
      badges,
      createdBy: auth.discord?.username || auth.user?.email || "",
    });
    const next = await writeNotificationStore([entry, ...store.entries], admin);
    return NextResponse.json({ ok: true, entry, entries: next.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readNotificationStore(admin);
    const nextEntries = store.entries.filter((entry) => entry.id !== id);
    if (nextEntries.length === store.entries.length) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const next = await writeNotificationStore(nextEntries, admin);
    return NextResponse.json({ ok: true, entries: next.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
