"use client";

import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CHECKOUT_EMAIL_KEY,
  KOMERZA_COUPON_MAX_LENGTH,
  readCheckoutEmail,
  readCheckoutCoupon,
  startKomerzaCheckout,
} from "../../lib/komerza";
import { runAccessChecks } from "../../lib/site-access";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";

const CHECKOUT_VERIFY_MS = 1800;

export function ProductCheckoutModal({ open, onOpenChange, product, variant }) {
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cfStatus, setCfStatus] = useState("idle");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState({ text: "", tone: "" });
  const verifyTimeoutRef = useRef(null);
  const isCheckingOutRef = useRef(false);

  useEffect(() => {
    isCheckingOutRef.current = isCheckingOut;
  }, [isCheckingOut]);

  useEffect(() => {
    if (!open) {
      setMessage({ text: "", tone: "" });
      setIsCheckingOut(false);
      setTermsAccepted(false);
      setCfStatus("idle");
      if (verifyTimeoutRef.current) {
        window.clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
      document.body.classList.remove("menu-open");
      return undefined;
    }

    setEmail(readCheckoutEmail());
    setCouponCode(readCheckoutCoupon());
    setTermsAccepted(false);
    setCfStatus("idle");
    setMessage({ text: "", tone: "" });
    setIsCheckingOut(false);
    document.body.classList.add("menu-open");

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isCheckingOutRef.current) {
        onOpenChange(false);
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
  }, [open, onOpenChange]);

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
      const normalizedEmail = email.trim();

      try {
        window.sessionStorage.setItem(CHECKOUT_EMAIL_KEY, normalizedEmail);
      } catch {
        // Ignore storage errors and keep checkout usable.
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
        couponCode,
      });
    } catch (error) {
      setMessage({
        text: error?.message || "Checkout failed. Please try again.",
        tone: "error",
      });
      setIsCheckingOut(false);
    }
  }

  if (!open || !product || !variant) return null;

  const canCheckout = termsAccepted && cfStatus === "success" && !isCheckingOut;

  return (
    <div
      className="redeem-modal"
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
              maxLength={KOMERZA_COUPON_MAX_LENGTH}
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

          <label className={`checkout-terms${termsAccepted ? " is-checked" : ""}`}>
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={isCheckingOut}
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
                {isCheckingOut ? "Processing..." : "Continue to payment"}
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
