"use client";

import Link from "next/link";
import { Bitcoin, Check, Copy, Download, Loader2, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CHECKOUT_COUPON_KEY,
  CHECKOUT_EMAIL_KEY,
  KOMERZA_COUPON_MAX_LENGTH,
  readCheckoutEmail,
  readCheckoutCoupon,
  startKomerzaCheckout,
} from "../../lib/komerza";
import { runAccessChecks } from "../../lib/site-access";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";

const CHECKOUT_VERIFY_MS = 1800;

export function ProductCheckoutModal({
  open,
  onOpenChange,
  product,
  variant,
  onCheckout = null,
  couponMaxLength = KOMERZA_COUPON_MAX_LENGTH,
  initialEmail = "",
  initialPaymentMethod = "crypto",
  showEmail = true,
  showCoupon = true,
  showPaymentMethod = false,
  theme = "dark",
  balance = null,
  balanceLabel = "",
}) {
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(
    initialPaymentMethod === "balance" ? "balance" : "crypto"
  );
  const [cfStatus, setCfStatus] = useState("idle");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState({ text: "", tone: "" });
  const [deliveryCode, setDeliveryCode] = useState("");
  const [copiedDelivery, setCopiedDelivery] = useState(false);
  const verifyTimeoutRef = useRef(null);
  const copiedTimeoutRef = useRef(null);
  const isCheckingOutRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  const initialEmailRef = useRef(initialEmail);
  const initialPaymentMethodRef = useRef(initialPaymentMethod);

  useEffect(() => {
    isCheckingOutRef.current = isCheckingOut;
  }, [isCheckingOut]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    initialEmailRef.current = initialEmail;
  }, [initialEmail]);

  useEffect(() => {
    initialPaymentMethodRef.current = initialPaymentMethod;
  }, [initialPaymentMethod]);

  // Only reset form when the modal opens/closes — not when parent re-renders
  // with a new inline onOpenChange / initialEmail (reseller panel).
  useEffect(() => {
    if (!open) {
      setMessage({ text: "", tone: "" });
      setIsCheckingOut(false);
      setTermsAccepted(false);
      setPaymentMethod("crypto");
      setDeliveryCode("");
      setCopiedDelivery(false);
      setCfStatus("idle");
      if (verifyTimeoutRef.current) {
        window.clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
      document.body.classList.remove("menu-open");
      return undefined;
    }

    setPaymentMethod(initialPaymentMethodRef.current === "balance" ? "balance" : "crypto");
    setEmail(readCheckoutEmail() || String(initialEmailRef.current || "").trim());
    setCouponCode(readCheckoutCoupon());
    setTermsAccepted(false);
    setPaymentMethod("crypto");
    setDeliveryCode("");
    setCopiedDelivery(false);
    setCfStatus("idle");
    setMessage({ text: "", tone: "" });
    setIsCheckingOut(false);
    document.body.classList.add("menu-open");

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isCheckingOutRef.current) {
        onOpenChangeRef.current?.(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-open");
      if (verifyTimeoutRef.current) {
        window.clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
    };
  }, [open]);

  function startCloudflareVerify() {
    if (cfStatus !== "idle" || isCheckingOut) return;

    setMessage({ text: "", tone: "" });
    setCfStatus("verifying");

    verifyTimeoutRef.current = window.setTimeout(() => {
      if (!runAccessChecks()) {
        setCfStatus("idle");
        setMessage({ text: "Verification failed. Please try again.", tone: "error" });
        return;
      }

      setCfStatus("success");
    }, CHECKOUT_VERIFY_MS);
  }

  async function handleCheckout() {
    setMessage({ text: "", tone: "" });

    if (!termsAccepted) {
      setMessage({ text: "Please accept the Terms of Service to continue.", tone: "error" });
      return;
    }

    if (cfStatus !== "success") {
      setMessage({ text: "Please complete the Cloudflare verification.", tone: "error" });
      return;
    }

    setIsCheckingOut(true);

    try {
      const normalizedEmail = showEmail ? email.trim() : "";
      const normalizedCoupon = showCoupon ? couponCode.trim() : "";

      if (showEmail || showCoupon) {
        try {
          if (showEmail) {
            window.sessionStorage.setItem(CHECKOUT_EMAIL_KEY, normalizedEmail);
          }
          if (showCoupon) {
            if (normalizedCoupon) {
              window.sessionStorage.setItem(CHECKOUT_COUPON_KEY, normalizedCoupon);
            } else {
              window.sessionStorage.removeItem(CHECKOUT_COUPON_KEY);
            }
          }
        } catch {
          // Ignore storage errors and keep checkout usable.
        }
      }

      if (typeof onCheckout === "function") {
        const result = await onCheckout({
          email: normalizedEmail,
          couponCode: normalizedCoupon,
          product,
          variant,
          paymentMethod: showPaymentMethod ? paymentMethod : "crypto",
        });

        if (result?.deliveryCode) {
          const code = String(result.deliveryCode);
          setDeliveryCode(code);
          setMessage({
            text: result.message || "Purchase complete. Your delivery code is ready below.",
            tone: "success",
          });
          setIsCheckingOut(false);
          try {
            await navigator.clipboard.writeText(code);
            setCopiedDelivery(true);
            if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
            copiedTimeoutRef.current = window.setTimeout(() => setCopiedDelivery(false), 2000);
          } catch {
            // ignore auto-copy failures; manual buttons remain available
          }
          return;
        }

        if (result?.keepOpen) {
          setIsCheckingOut(false);
          return;
        }

        return;
      }

      await startKomerzaCheckout({
        items: [
          {
            slug: product.slug,
            name: product.name,
            variant: variant.label,
            quantity: 1,
          },
        ],
        email: normalizedEmail,
        couponCode: normalizedCoupon,
      });
    } catch (error) {
      setMessage({
        text: error?.message || "Checkout failed. Please try again.",
        tone: "error",
      });
      setIsCheckingOut(false);
    }
  }

  async function handleCopyDeliveryCode() {
    const code = String(deliveryCode || "").trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedDelivery(true);
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = window.setTimeout(() => setCopiedDelivery(false), 2000);
    } catch {
      setMessage({ text: "Could not copy coupon. Please copy it manually.", tone: "error" });
    }
  }

  function handleDownloadDeliveryCode() {
    const code = String(deliveryCode || "").trim();
    if (!code || typeof document === "undefined") return;
    const productName = String(product?.name || "product")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product";
    const blob = new Blob([`${code}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${productName}-coupon.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!open || !product || !variant) return null;

  const balanceAmount = Number(balance);
  const hasBalanceInfo = Number.isFinite(balanceAmount);
  const payLabel =
    showPaymentMethod && paymentMethod === "balance"
      ? isCheckingOut
        ? "Processing..."
        : "Pay with balance"
      : isCheckingOut
        ? "Processing..."
        : "Continue to payment";
  const canCheckout = termsAccepted && cfStatus === "success" && !isCheckingOut && !deliveryCode;

  return (
    <div
      className={`redeem-modal${theme === "light" ? " is-theme-light" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-checkout-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isCheckingOut) {
          onOpenChange(false);
        }
      }}
    >
      <div className="redeem-panel">
        <div className="redeem-panel-header">
          <div>
            <div className="redeem-panel-kicker">Secure Checkout</div>
            <h3 id="product-checkout-title">Complete Purchase</h3>
          </div>
          <button
            className="redeem-close"
            type="button"
            aria-label="Close checkout"
            disabled={isCheckingOut}
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="redeem-panel-body">
          <div className="checkout-order-summary">
            <div>
              <span className="checkout-order-label">Product</span>
              <strong>{product.name}</strong>
            </div>
            <div>
              <span className="checkout-order-label">Duration</span>
              <strong>{variant.label}</strong>
            </div>
            <div className="checkout-order-total">
              <span className="checkout-order-label">Total</span>
              <strong>{variant.price}</strong>
            </div>
          </div>

          {showEmail ? (
            <div className="redeem-field checkout-order-field">
              <label htmlFor="product-checkout-email">Email for delivery</label>
              <input
                id="product-checkout-email"
                className="redeem-input"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                value={email}
                disabled={isCheckingOut}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleCheckout();
                  }
                }}
              />
            </div>
          ) : null}

          {showCoupon ? (
            <div className="redeem-field checkout-order-field">
              <label htmlFor="product-checkout-coupon">
                Discount code <span className="checkout-optional">(optional)</span>
              </label>
              <input
                id="product-checkout-coupon"
                className="redeem-input"
                type="text"
                placeholder="Enter coupon code"
                autoComplete="off"
                spellCheck={false}
                maxLength={couponMaxLength}
                value={couponCode}
                disabled={isCheckingOut}
                onChange={(event) => setCouponCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleCheckout();
                  }
                }}
              />
            </div>
          ) : null}

          <label className={`checkout-terms${termsAccepted ? " is-checked" : ""}`}>
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={isCheckingOut || Boolean(deliveryCode)}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <span className="checkout-terms-box" aria-hidden="true">
              {termsAccepted ? <Check size={14} strokeWidth={3} /> : null}
            </span>
            <span className="checkout-terms-text">
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                Terms of Service
              </Link>
            </span>
          </label>

          {showPaymentMethod ? (
            <div className="checkout-payment-method">
              <div
                className={`checkout-payment-switch${paymentMethod === "crypto" ? " is-crypto" : ""}`}
                role="group"
                aria-label="Payment method"
              >
                <span className="checkout-payment-switch-thumb" aria-hidden="true" />
                <button
                  type="button"
                  className={`checkout-payment-switch-option${paymentMethod === "balance" ? " is-active" : ""}`}
                  aria-pressed={paymentMethod === "balance"}
                  disabled={isCheckingOut || Boolean(deliveryCode)}
                  onClick={() => setPaymentMethod("balance")}
                >
                  <Wallet size={14} />
                  Balance
                </button>
                <button
                  type="button"
                  className={`checkout-payment-switch-option${paymentMethod === "crypto" ? " is-active" : ""}`}
                  aria-pressed={paymentMethod === "crypto"}
                  disabled={isCheckingOut || Boolean(deliveryCode)}
                  onClick={() => setPaymentMethod("crypto")}
                >
                  <Bitcoin size={14} />
                  Crypto
                </button>
              </div>
              {paymentMethod === "balance" && hasBalanceInfo ? (
                <p className="checkout-payment-balance-hint">
                  Available balance: <strong>{balanceLabel || `$${balanceAmount.toFixed(2)}`}</strong>
                </p>
              ) : null}
            </div>
          ) : null}

          {deliveryCode ? (
            <div className="checkout-delivery-code">
              <span className="checkout-order-label">Delivery code</span>
              <strong className="checkout-delivery-code-value">{deliveryCode}</strong>
              <div className="checkout-delivery-actions">
                <button
                  type="button"
                  className="checkout-delivery-action"
                  onClick={() => void handleCopyDeliveryCode()}
                >
                  {copiedDelivery ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} />}
                  {copiedDelivery ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  className="checkout-delivery-action"
                  onClick={handleDownloadDeliveryCode}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          ) : null}

          <div className="checkout-pay-actions">
            <button
              className={`checkout-pay-button${isCheckingOut ? " is-processing" : ""}`}
              type="button"
              disabled={!canCheckout}
              onClick={() => void handleCheckout()}
            >
              <span className="checkout-pay-points" aria-hidden="true">
                {Array.from({ length: 10 }, (_, index) => (
                  <i className="checkout-pay-point" key={index} />
                ))}
              </span>
              <span className="checkout-pay-inner">
                {isCheckingOut ? (
                  <Loader2 size={18} strokeWidth={2.4} className="checkout-pay-spinner" />
                ) : showPaymentMethod && paymentMethod === "balance" ? (
                  <Wallet size={18} strokeWidth={2.4} className="checkout-pay-icon" />
                ) : (
                  <svg
                    className="checkout-pay-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
                {payLabel}
              </span>
            </button>
          </div>

          <CloudflareTurnstileWidget
            status={cfStatus}
            onStart={startCloudflareVerify}
            disabled={isCheckingOut}
            className="checkout-turnstile"
          />

          <div className={`redeem-message${message.tone ? ` is-${message.tone}` : ""}`}>{message.text}</div>
        </div>
      </div>
    </div>
  );
}
