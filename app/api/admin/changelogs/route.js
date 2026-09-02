import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  findApplicationById,
  normalizeChangelogEntry,
  readChangelogStore,
  writeChangelogStore,
} from "../../../../lib/application-changelogs";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

function parseNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note) => String(note || "").trim()).filter(Boolean);
}

function parseReleasedAt(value) {
  const raw = String(value || "").trim();
  if (!raw) return new Date().toISOString();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0).toISOString();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "changelogs.view");
    if (denied) return denied;

    const applicationId = new URL(request.url).searchParams.get("applicationId")?.trim() || "";
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const app = await findApplicationById(applicationId, admin);
    if (!app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const store = await readChangelogStore(applicationId, admin);
    return NextResponse.json({
      application: app,
      entries: store.entries,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "changelogs.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || "").trim();
    const title = String(body?.title || "").trim();
    const notes = parseNotes(body?.notes);
    const releasedAt = parseReleasedAt(body?.released_at || body?.releasedAt || body?.date);

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!notes.length) {
      return NextResponse.json({ error: "Add at least one description line." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const app = await findApplicationById(applicationId, admin);
    if (!app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const entry = normalizeChangelogEntry({
      id: randomUUID(),
      title,
      notes,
      released_at: releasedAt,
      updated_at: now,
    });

    const store = await readChangelogStore(applicationId, admin);
    const next = await writeChangelogStore(applicationId, [entry, ...store.entries], admin);
    return NextResponse.json({ ok: true, entry, entries: next.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "changelogs.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || "").trim();
    const entryId = String(body?.id || body?.entryId || "").trim();
    const title = String(body?.title || "").trim();
    const notes = parseNotes(body?.notes);
    const hasReleasedAt = body?.released_at != null || body?.releasedAt != null || body?.date != null;
    const releasedAt = hasReleasedAt
      ? parseReleasedAt(body?.released_at || body?.releasedAt || body?.date)
      : null;

    if (!applicationId || !entryId) {
      return NextResponse.json({ error: "applicationId and id are required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!notes.length) {
      return NextResponse.json({ error: "Add at least one description line." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readChangelogStore(applicationId, admin);
    const index = store.entries.findIndex((entry) => entry.id === entryId);
    if (index < 0) {
      return NextResponse.json({ error: "Changelog entry not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updated = normalizeChangelogEntry({
      ...store.entries[index],
      title,
      notes,
      ...(releasedAt ? { released_at: releasedAt } : {}),
      updated_at: now,
    });

    const nextEntries = [...store.entries];
    nextEntries[index] = updated;
    const next = await writeChangelogStore(applicationId, nextEntries, admin);
    return NextResponse.json({ ok: true, entry: updated, entries: next.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "changelogs.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || "").trim();
    const entryId = String(body?.id || body?.entryId || "").trim();

    if (!applicationId || !entryId) {
      return NextResponse.json({ error: "applicationId and id are required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const store = await readChangelogStore(applicationId, admin);
    const nextEntries = store.entries.filter((entry) => entry.id !== entryId);
    if (nextEntries.length === store.entries.length) {
      return NextResponse.json({ error: "Changelog entry not found." }, { status: 404 });
    }

    const next = await writeChangelogStore(applicationId, nextEntries, admin);
    return NextResponse.json({ ok: true, entries: next.entries });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
