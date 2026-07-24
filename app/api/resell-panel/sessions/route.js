import { requireReseller } from "../../../../lib/resell-panel-auth";
import {
  listResellerSessions,
  revokeAllResellerSessions,
  revokeResellerSession,
} from "../../../../lib/reseller-sessions";

export const dynamic = "force-dynamic";

function getBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const token = getBearerToken(request);
    const result = await listResellerSessions({
      authUserId: auth.user.id,
      accessToken: token,
      request,
      admin: auth.admin,
    });

    if (result.revoked) {
      return Response.json({ error: "Session revoked.", revoked: true }, { status: 401 });
    }

    return Response.json({
      ok: true,
      sessions: result.sessions,
      current_session_id: result.current_session_id,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const token = getBearerToken(request);
    const body = await request.json().catch(() => ({}));
    const all = body?.all === true || body?.scope === "global";
    const others = body?.others === true || body?.scope === "others";
    const sessionId = String(body?.sessionId || body?.session_id || "").trim();

    if (all) {
      const result = await revokeAllResellerSessions({
        authUserId: auth.user.id,
        accessToken: token,
        request,
        keepCurrent: false,
        admin: auth.admin,
      });
      try {
        await auth.admin.auth.admin.signOut(token, "global");
      } catch {
        // best-effort — revoked list still blocks API access
      }
      return Response.json({ ok: true, ...result });
    }

    if (others) {
      const result = await revokeAllResellerSessions({
        authUserId: auth.user.id,
        accessToken: token,
        request,
        keepCurrent: true,
        admin: auth.admin,
      });
      return Response.json({ ok: true, ...result });
    }

    if (!sessionId) {
      return Response.json({ error: "sessionId is required." }, { status: 400 });
    }

    const result = await revokeResellerSession({
      authUserId: auth.user.id,
      accessToken: token,
      request,
      sessionId,
      admin: auth.admin,
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
