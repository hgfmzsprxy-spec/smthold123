"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CHECKOUT_EMAIL_KEY,
  KOMERZA_COUPON_MAX_LENGTH,
  readCheckoutEmail,
  readCheckoutCoupon,
  startKomerzaCheckout,
} from "../../lib/komerza";

export function ProductCheckoutModal({ open, onOpenChange, product, variant }) {
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState({ text: "", tone: "" });

  useEffect(() => {
    if (!open) {
      setMessage({ text: "", tone: "" });
      setIsCheckingOut(false);
      document.body.classList.remove("menu-open");
      return undefined;
    }

    setEmail(readCheckoutEmail());
    setCouponCode(readCheckoutCoupon());
    document.body.classList.add("menu-open");

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isCheckingOut) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-open");
    };
  }, [open, onOpenChange, isCheckingOut]);

  async function handleCheckout() {
    setMessage({ text: "", tone: "" });
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

          <div className="redeem-actions">
            <button
              className="redeem-button redeem-button-primary"
              type="button"
              disabled={isCheckingOut}
              onClick={() => void handleCheckout()}
            >
              {isCheckingOut ? "Processing..." : "Continue to payment"}
            </button>
          </div>

          <div className={`redeem-message${message.tone ? ` is-${message.tone}` : ""}`}>{message.text}</div>
        </div>
      </div>
    </div>
  );
}
