"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getAuthStorageKey, readStoredAuthUser } from "./auth-session";
import { supabase } from "./supabase";

const authListeners = new Set();

function emitAuthStoreChange() {
  invalidateAuthSnapshot();
  authListeners.forEach((listener) => listener());
}

function subscribeAuth(listener) {
  authListeners.add(listener);

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    emitAuthStoreChange();
  });

  const handleStorage = (event) => {
    const storageKey = event.key || "";
    if (storageKey.includes("-auth-token")) {
      emitAuthStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    authListeners.delete(listener);
    subscription.unsubscribe();
    window.removeEventListener("storage", handleStorage);
  };
}

function readAuthStorageSignature() {
  if (typeof window === "undefined") return "";

  const storageKey = getAuthStorageKey();
  if (!storageKey) return "";

  const userRaw = window.localStorage.getItem(`${storageKey}-user`) || "";
  const sessionRaw = window.localStorage.getItem(storageKey) || "";
  return `${userRaw}::${sessionRaw}`;
}

let cachedAuthSnapshot = null;
let cachedAuthSignature = null;

function getAuthSnapshot() {
  const signature = readAuthStorageSignature();

  if (signature === cachedAuthSignature) {
    return cachedAuthSnapshot;
  }

  cachedAuthSignature = signature;
  cachedAuthSnapshot = readStoredAuthUser();
  return cachedAuthSnapshot;
}

function invalidateAuthSnapshot() {
  cachedAuthSignature = null;
  cachedAuthSnapshot = null;
}

export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function useAuthUser() {
  const cachedUser = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
  const [sessionUser, setSessionUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSessionUser(session?.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user: ready ? sessionUser : cachedUser,
    ready,
  };
}
