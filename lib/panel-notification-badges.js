export const NOTIFICATION_BADGE_COLORS = [
  { id: "red", label: "Brand", value: "#9783d1" },
  { id: "orange", label: "Orange", value: "#c2410c" },
  { id: "amber", label: "Amber", value: "#b45309" },
  { id: "green", label: "Green", value: "#15803d" },
  { id: "teal", label: "Teal", value: "#0f766e" },
  { id: "blue", label: "Blue", value: "#1d4ed8" },
  { id: "indigo", label: "Indigo", value: "#4338ca" },
  { id: "purple", label: "Purple", value: "#7e22ce" },
  { id: "pink", label: "Pink", value: "#be185d" },
  { id: "slate", label: "Slate", value: "#475569" },
];

export const NOTIFICATION_BADGE_MAX = 3;

export function emptyNotificationBadgeDraft() {
  return { label: "", color: NOTIFICATION_BADGE_COLORS[0].value };
}
