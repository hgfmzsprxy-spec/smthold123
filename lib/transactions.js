import { randomUUID } from "crypto";
import { ensureResellersBucket, getResellerDisplayName, RESELLERS_BUCKET } from "./resellers";
import { getSupabaseAdmin } from "./supabase-admin";
import { readStorageJson, writeStorageJson } from "./storage-json";

export const TRANSACTIONS_OBJECT_PATH = "transactions.json";
export const MAX_TRANSACTIONS = 5000;

export const TRANSACTION_TYPES = {
  BALANCE_ADD: "balance_add",
  BALANCE_REMOVE: "balance_remove",
  BALANCE_SET: "balance_set",
  LICENSE_PURCHASE: "license_purchase",
  STORE_PURCHASE: "store_purchase",
  STORE_REDEEM: "store_redeem",
};

const TYPE_LABELS = {
  [TRANSACTION_TYPES.BALANCE_ADD]: "Balance added",
  [TRANSACTION_TYPES.BALANCE_REMOVE]: "Balance removed",
  [TRANSACTION_TYPES.BALANCE_SET]: "Balance set",
  [TRANSACTION_TYPES.LICENSE_PURCHASE]: "License purchase",
  [TRANSACTION_TYPES.STORE_PURCHASE]: "Store purchase",
  [TRANSACTION_TYPES.STORE_REDEEM]: "Store redeem",
};

function emptyStore() {
  return { transactions: [] };
}

export function formatTransactionType(type) {
  return TYPE_LABELS[String(type || "").trim()] || String(type || "Transaction");
}

export function normalizeTransaction(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim() || randomUUID();
  const type = String(entry.type || "").trim();
  if (!type) return null;

  const amountRaw = Number(entry.amount);
  const balanceBeforeRaw = Number(entry.balance_before ?? entry.balanceBefore);
  const balanceAfterRaw = Number(entry.balance_after ?? entry.balanceAfter);

  return {
    id,
    type,
    type_label: formatTransactionType(type),
    reseller_id: String(entry.reseller_id || entry.resellerId || "").trim() || null,
    reseller_email: String(entry.reseller_email || entry.resellerEmail || "").trim().toLowerCase() || null,
    reseller_username: String(entry.reseller_username || entry.resellerUsername || "").trim() || null,
    amount: Number.isFinite(amountRaw) ? Math.round(amountRaw * 100) / 100 : 0,
    balance_before: Number.isFinite(balanceBeforeRaw) ? Math.round(balanceBeforeRaw * 100) / 100 : null,
    balance_after: Number.isFinite(balanceAfterRaw) ? Math.round(balanceAfterRaw * 100) / 100 : null,
    description: String(entry.description || "").trim(),
    meta: entry.meta && typeof entry.meta === "object" ? entry.meta : {},
    actor: String(entry.actor || "").trim() || "system",
    created_at: String(entry.created_at || entry.createdAt || "").trim() || new Date().toISOString(),
  };
}

export async function readTransactionsStore(admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);
  const parsed = await readStorageJson(RESELLERS_BUCKET, TRANSACTIONS_OBJECT_PATH, admin);
  if (!parsed || typeof parsed !== "object") return emptyStore();
  const transactions = Array.isArray(parsed.transactions)
    ? parsed.transactions.map(normalizeTransaction).filter(Boolean)
    : [];
  return { transactions };
}

export async function writeTransactionsStore(transactions, admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);
  const normalized = (Array.isArray(transactions) ? transactions : [])
    .map(normalizeTransaction)
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, MAX_TRANSACTIONS);
  await writeStorageJson(RESELLERS_BUCKET, TRANSACTIONS_OBJECT_PATH, { transactions: normalized }, admin);
  return { transactions: normalized };
}

export function buildResellerTransactionActor(reseller) {
  if (!reseller) return {};
  return {
    reseller_id: String(reseller.id || "").trim() || null,
    reseller_email: String(reseller.email || "").trim().toLowerCase() || null,
    reseller_username: getResellerDisplayName(reseller),
  };
}

export async function appendTransaction(input, admin = getSupabaseAdmin()) {
  const entry = normalizeTransaction({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  });
  if (!entry) throw new Error("Invalid transaction.");

  const store = await readTransactionsStore(admin);
  const next = [entry, ...store.transactions].slice(0, MAX_TRANSACTIONS);
  await writeTransactionsStore(next, admin);
  return entry;
}

export async function listTransactions(
  { resellerId = null, limit = 500 } = {},
  admin = getSupabaseAdmin()
) {
  const store = await readTransactionsStore(admin);
  const scoped = resellerId
    ? store.transactions.filter((entry) => String(entry.reseller_id || "") === String(resellerId))
    : store.transactions;
  const capped = Math.max(1, Math.min(MAX_TRANSACTIONS, Math.trunc(Number(limit) || 500)));
  return scoped.slice(0, capped);
}
