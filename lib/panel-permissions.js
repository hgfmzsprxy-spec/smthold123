/** Boolean permission keys + optional numeric limits for panel team staff. */

export const RESELLER_VIEW_PERMS = [
  "view.welcome",
  "view.applications",
  "view.licenses",
  "view.transactions",
  "view.notifications",
  "view.deposit",
  "view.store",
  "view.redeem",
  "view.loader",
  "view.menu",
  "view.guides",
  "view.settings",
  "view.team",
];

export const RESELLER_ACTION_PERMS = [
  "licenses.view",
  "licenses.generate",
  "licenses.copy",
  "licenses.delete",
  "licenses.ban",
  "licenses.reset_hwid",
  "licenses.info",
  "deposit.view",
  "deposit.checkout",
  "store.view",
  "store.purchase",
  "store.redeem",
  "loader.view",
  "loader.edit",
  "loader.generate",
  "settings.view",
  "settings.edit_prefs",
  "notifications.edit_discord",
];

export const ADMIN_VIEW_PERMS = [
  "view.welcome",
  "view.applications",
  "view.licenses",
  "view.transactions",
  "view.changelogs",
  "view.notifications",
  "view.resellers",
  "view.products",
  "view.security",
  "view.protection_logs",
  "view.loader",
  "view.menu",
  "view.team",
  "view.faq",
  "view.settings",
];

export const ADMIN_ACTION_PERMS = [
  "resellers.view",
  "resellers.edit",
  "resellers.delete",
  "resellers.balance",
  "resellers.team_view",
  "resellers.team_edit",
  "resellers.team_limits",
  "licenses.view",
  "licenses.generate",
  "licenses.delete",
  "licenses.ban",
  "licenses.reset_hwid",
  "licenses.edit",
  "apps.view",
  "apps.edit",
  "apps.freeze",
  "apps.package",
  "products.view",
  "products.edit",
  "notifications.view",
  "notifications.edit",
  "notifications.edit_discord",
  "changelogs.view",
  "changelogs.edit",
  "protections.view",
  "protections.edit",
  "settings.view",
];

/** Never grant these to reseller team staff (owner-only tabs / branding). */
export const RESELLER_STAFF_FORBIDDEN_PERMS = [
  "view.team",
  "view.loader",
  "view.menu",
  "loader.view",
  "loader.edit",
  "loader.generate",
];

/** Always on for reseller team staff — not assignable in the permission editor. */
export const RESELLER_STAFF_ALWAYS_ON_PERMS = [
  "view.welcome",
  "view.settings",
  "settings.view",
  "settings.edit_prefs",
];

export const RESELLER_STAFF_ASSIGNABLE_VIEW_PERMS = RESELLER_VIEW_PERMS.filter(
  (key) =>
    !RESELLER_STAFF_FORBIDDEN_PERMS.includes(key) && !RESELLER_STAFF_ALWAYS_ON_PERMS.includes(key)
);

/** Always on for admin second-staff — not assignable in the permission editor. */
export const ADMIN_STAFF_ALWAYS_ON_PERMS = ["view.faq"];

export const ADMIN_STAFF_ASSIGNABLE_VIEW_PERMS = ADMIN_VIEW_PERMS.filter(
  (key) => !ADMIN_STAFF_ALWAYS_ON_PERMS.includes(key)
);

export const RESELLER_PERM_GROUPS = [
  {
    id: "views",
    label: "Views / tabs",
    keys: RESELLER_STAFF_ASSIGNABLE_VIEW_PERMS,
  },
  {
    id: "licenses",
    label: "Licenses",
    keys: [
      "licenses.view",
      "licenses.generate",
      "licenses.copy",
      "licenses.delete",
      "licenses.ban",
      "licenses.reset_hwid",
      "licenses.info",
    ],
  },
  {
    id: "money",
    label: "Deposit & Store",
    keys: [
      "deposit.view",
      "deposit.checkout",
      "store.view",
      "store.purchase",
      "store.redeem",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    keys: ["notifications.edit_discord"],
  },
];

export const ADMIN_PERM_GROUPS = [
  {
    id: "views",
    label: "Views / tabs",
    keys: ADMIN_STAFF_ASSIGNABLE_VIEW_PERMS,
  },
  {
    id: "resellers",
    label: "Resellers",
    keys: [
      "resellers.view",
      "resellers.edit",
      "resellers.delete",
      "resellers.balance",
      "resellers.team_view",
      "resellers.team_edit",
      "resellers.team_limits",
    ],
  },
  {
    id: "licenses",
    label: "Licenses",
    keys: [
      "licenses.view",
      "licenses.generate",
      "licenses.delete",
      "licenses.ban",
      "licenses.reset_hwid",
      "licenses.edit",
    ],
  },
  {
    id: "apps",
    label: "Applications",
    keys: ["apps.view", "apps.edit", "apps.freeze", "apps.package"],
  },
  {
    id: "other",
    label: "Other",
    keys: [
      "products.view",
      "products.edit",
      "notifications.view",
      "notifications.edit",
      "notifications.edit_discord",
      "changelogs.view",
      "changelogs.edit",
      "protections.view",
      "protections.edit",
      "settings.view",
    ],
  },
];

const PERM_LABELS = {
  "view.welcome": "Welcome",
  "view.applications": "Applications",
  "view.licenses": "Licenses",
  "view.transactions": "Transactions",
  "view.notifications": "Notifications",
  "view.deposit": "Deposit",
  "view.store": "Store",
  "view.redeem": "Redeem",
  "view.loader": "Loader branding",
  "view.menu": "Menu(s)",
  "view.guides": "Guides",
  "view.settings": "Settings",
  "view.team": "Team",
  "view.faq": "FAQ",
  "view.changelogs": "Changelogs",
  "view.resellers": "Resellers",
  "view.products": "Products",
  "view.security": "Security",
  "view.protection_logs": "Protections-Logs",
  "licenses.view": "View licenses",
  "licenses.generate": "Generate licenses",
  "licenses.copy": "Copy license keys",
  "licenses.delete": "Delete licenses",
  "licenses.ban": "Ban licenses",
  "licenses.reset_hwid": "Reset HWID",
  "licenses.info": "Open license info",
  "licenses.edit": "Edit / extend licenses",
  "deposit.view": "View deposit",
  "deposit.checkout": "Buy deposits",
  "store.view": "View store",
  "store.purchase": "Purchase store products",
  "store.redeem": "Redeem store coupons",
  "loader.view": "View loader branding",
  "loader.edit": "Edit loader branding",
  "loader.generate": "Generate loader",
  "settings.view": "View settings",
  "settings.edit_prefs": "Edit preferences",
  "resellers.view": "View resellers",
  "resellers.edit": "Edit resellers",
  "resellers.delete": "Delete resellers",
  "resellers.balance": "Adjust reseller balance",
  "resellers.team_view": "View reseller teams",
  "resellers.team_edit": "Edit reseller team members",
  "resellers.team_limits": "Change reseller team limits",
  "apps.view": "View applications",
  "apps.edit": "Edit applications",
  "apps.freeze": "Freeze / unfreeze apps",
  "apps.package": "Manage app packages",
  "products.view": "View products",
  "products.edit": "Edit products",
  "notifications.view": "View notifications",
  "notifications.edit": "Edit notifications",
  "notifications.edit_discord": "Edit Discord notifications",
  "changelogs.view": "View changelogs",
  "changelogs.edit": "Edit changelogs",
  "protections.view": "View protections",
  "protections.edit": "Edit protections",
};

export function permissionLabel(key) {
  return PERM_LABELS[key] || key;
}

export function emptyResellerPermissions() {
  const flags = {};
  [...RESELLER_VIEW_PERMS, ...RESELLER_ACTION_PERMS].forEach((key) => {
    flags[key] = false;
  });
  return {
    ...flags,
    "apps.all": false,
    "apps.ids": [],
    "limits.generate_per_day": null,
    "limits.generate_max_qty": null,
  };
}

export function emptyAdminPermissions() {
  const flags = {};
  [...ADMIN_VIEW_PERMS, ...ADMIN_ACTION_PERMS].forEach((key) => {
    flags[key] = false;
  });
  return {
    ...flags,
    "apps.all": true,
    "apps.ids": [],
    "limits.generate_per_day": null,
    "limits.generate_max_qty": null,
  };
}

export function defaultResellerStaffPermissions() {
  return {
    ...emptyResellerPermissions(),
    "view.welcome": true,
    "view.applications": true,
    "view.licenses": true,
    "view.settings": true,
    "licenses.view": true,
    "licenses.generate": true,
    "licenses.copy": true,
    "licenses.info": true,
    "settings.view": true,
    "settings.edit_prefs": true,
    "apps.all": true,
    "apps.ids": [],
  };
}

export function defaultAdminStaffPermissions() {
  return {
    ...emptyAdminPermissions(),
    "view.welcome": true,
    "view.applications": true,
    "view.licenses": true,
    "view.resellers": true,
    "view.team": true,
    "view.faq": true,
    "view.settings": true,
    "licenses.view": true,
    "licenses.generate": true,
    "resellers.view": true,
    "resellers.team_view": true,
    "apps.view": true,
    "apps.all": true,
    "settings.view": true,
  };
}

export function normalizePermissions(raw, kind = "reseller") {
  const base = kind === "admin" ? emptyAdminPermissions() : emptyResellerPermissions();
  const source = raw && typeof raw === "object" ? raw : {};
  const next = { ...base };

  Object.keys(base).forEach((key) => {
    if (key === "apps.ids") {
      next[key] = Array.isArray(source[key])
        ? [...new Set(source[key].map((value) => String(value || "").trim()).filter(Boolean))]
        : [];
      return;
    }
    if (key === "limits.generate_per_day" || key === "limits.generate_max_qty") {
      const value = source[key];
      if (value == null || value === "") {
        next[key] = null;
        return;
      }
      const num = Number(value);
      next[key] = Number.isFinite(num) && num >= 0 ? Math.floor(num) : null;
      return;
    }
    if (key in source) next[key] = Boolean(source[key]);
  });

  // Admin second-staff: FAQ is always available.
  if (kind === "admin") {
    ADMIN_STAFF_ALWAYS_ON_PERMS.forEach((key) => {
      next[key] = true;
    });
  } else {
    // Reseller team staff: locked-off branding/team tabs, always-on welcome/settings/prefs.
    RESELLER_STAFF_FORBIDDEN_PERMS.forEach((key) => {
      next[key] = false;
    });
    RESELLER_STAFF_ALWAYS_ON_PERMS.forEach((key) => {
      next[key] = true;
    });
  }

  return next;
}

export function clampResellerStaffPermissions(permissions) {
  return normalizePermissions(permissions, "reseller");
}

export function hasPermission(permissions, key) {
  if (!permissions || typeof permissions !== "object") return false;
  if (permissions.__full === true) return true;
  return Boolean(permissions[key]);
}

export function canAccessApp(permissions, applicationId, ownerAppIds = null) {
  if (!permissions) return false;
  const appId = String(applicationId || "").trim();
  if (!appId) return false;

  // Admin-assigned reseller access always wins — even for owner `__full` permissions.
  if (Array.isArray(ownerAppIds)) {
    const allowedOwner = ownerAppIds.map((value) => String(value || "").trim()).filter(Boolean);
    if (!allowedOwner.includes(appId)) return false;
  }

  if (permissions.__full === true) return true;
  if (permissions["apps.all"]) return true;
  const ids = Array.isArray(permissions["apps.ids"]) ? permissions["apps.ids"] : [];
  return ids.map((value) => String(value || "").trim()).includes(appId);
}

export function fullPermissions(kind = "reseller") {
  const base = kind === "admin" ? emptyAdminPermissions() : emptyResellerPermissions();
  const next = { ...base, __full: true, "apps.all": true, "apps.ids": [] };
  Object.keys(base).forEach((key) => {
    if (key === "apps.ids" || key.startsWith("limits.")) return;
    next[key] = true;
  });
  return next;
}

export function permissionDeniedResponse(message = "You do not have permission for this action.") {
  return Response.json({ error: message, code: "ERR_PERMISSION_DENIED" }, { status: 403 });
}

export function assertPermission(permissions, key) {
  if (hasPermission(permissions, key)) return null;
  return permissionDeniedResponse(`Missing permission: ${permissionLabel(key)}.`);
}
