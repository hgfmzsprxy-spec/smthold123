"use client";

import { useSyncExternalStore } from "react";
import { getNavAuthSnapshot, subscribeNavAuthCache } from "./nav-auth-cache";

export function useNavAuthCache() {
  return useSyncExternalStore(subscribeNavAuthCache, getNavAuthSnapshot, () => null);
}
