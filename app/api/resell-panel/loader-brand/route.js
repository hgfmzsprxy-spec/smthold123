import { hasPermission, permissionDeniedResponse } from "../../../../lib/panel-permissions";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import {
  buildLoaderBrandSlug,
  readResellersStore,
  updateResellerRecord,
} from "../../../../lib/resellers";

export const dynamic = "force-dynamic";

function normalizeHex(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const hex = raw.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return "#" + hex.split("").map((c) => c + c).join("");
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return "#" + hex;
  }
  return "";
}

export async function PUT(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor === "staff") {
      return permissionDeniedResponse("Loader branding is only available to the reseller owner.");
    }

    if (
      !hasPermission(auth.permissions, "loader.edit") &&
      !hasPermission(auth.permissions, "loader.generate")
    ) {
      return permissionDeniedResponse("Missing permission: Edit or generate loader branding.");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const color = normalizeHex(body.color) || "#a32e3b";
    const brandName = String(body.brandName || body.brand_name || "").trim().slice(0, 48);
    const logo = String(body.logo || "").trim();
    const discordLink = String(body.discordLink || body.discord_link || "").trim();
    const autoLogoSize = body.auto_logo_size !== undefined
      ? Boolean(body.auto_logo_size)
      : body.autoLogoSize !== undefined
        ? Boolean(body.autoLogoSize)
        : true;
    const removeLoaderFaq = body.remove_loader_faq !== undefined
      ? Boolean(body.remove_loader_faq)
      : Boolean(body.removeLoaderFaq);
    const removeGuides = body.remove_guides !== undefined
      ? Boolean(body.remove_guides)
      : Boolean(body.removeGuides);

    if (!brandName) {
      return Response.json({ error: "Brand name is required." }, { status: 400 });
    }
    if (!logo) {
      return Response.json({ error: "Logo is required." }, { status: 400 });
    }
    if (discordLink && !/^https?:\/\//i.test(discordLink)) {
      return Response.json(
        { error: "Discord link must start with http:// or https://." },
        { status: 400 }
      );
    }

    const store = await readResellersStore(auth.admin);
    const current = (store.resellers || []).find((entry) => entry.id === auth.reseller.id);
    if (current?.loader_brand?.blocked) {
      return Response.json(
        { error: "Your custom loader has been blocked by an administrator.", blocked: true },
        { status: 403 },
      );
    }

    // Keep the public loader slug permanent once created — brand name edits must not change the link.
    const existingSlug = String(current?.loader_brand?.slug || "").trim();
    const slug =
      existingSlug || buildLoaderBrandSlug(brandName, store.resellers, auth.reseller.id);
    if (!slug) {
      return Response.json({ error: "Could not create a loader link from this brand name." }, { status: 400 });
    }

    const loaderBrand = {
      color,
      brand_name: brandName,
      logo,
      discord_link: discordLink,
      auto_logo_size: autoLogoSize,
      remove_loader_faq: removeLoaderFaq,
      remove_guides: removeGuides,
      slug,
      blocked: Boolean(current?.loader_brand?.blocked),
    };

    await updateResellerRecord(auth.reseller.id, { loader_brand: loaderBrand }, auth.admin);

    const origin =
      String(process.env.NEXT_PUBLIC_SITE_URL || "").trim() || new URL(request.url).origin;
    const link = `${origin.replace(/\/$/, "")}/loader?${slug}`;

    return Response.json({ ok: true, brand: loaderBrand, link });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
