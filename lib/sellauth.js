export const SELLAUTH_CHECKOUT_API = "https://api-internal-3.sellauth.com/v1/checkout";
export const SELLAUTH_ALTCHA_URL = "https://api-internal-3.sellauth.com/v1/altcha";

/** Public shop ID for SellAuth embed (client-side). */
export const SELLAUTH_SHOP_ID = Number(
  process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || process.env.SELLAUTH_SHOP_ID || "255364"
) || 0;

function ensureSellAuthModalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("sellauth-embed-style")) return;

  const style = document.createElement("style");
  style.id = "sellauth-embed-style";
  style.textContent = `
    #sellauth-modal {
      position: relative;
      max-width: 100vw;
      margin: auto;
      padding: 0;
      border: none;
      border-radius: 0.75rem;
      background-color: #141414;
      color: #ffffff;
      scrollbar-width: none;
    }
    #sellauth-modal::-webkit-scrollbar { display: none; }
    #sellauth-modal .close {
      position: absolute;
      top: 1.5rem;
      right: 1.125rem;
      z-index: 2;
      padding: 0.25rem;
      border: none;
      outline: none;
      cursor: pointer;
      background: none;
      color: #ffffff;
    }
    #sellauth-modal [role="alertdialog"] { padding: 0; overflow: hidden; }
    #sellauth-modal::backdrop { background: rgba(0, 0, 0, 0.75); }
    #sellauth-modal iframe {
      width: 98vw;
      height: 46rem;
      border: none;
    }
    @media (min-width: 768px) {
      #sellauth-modal { max-width: 32rem; }
      #sellauth-modal iframe { width: 32rem; height: 52rem; }
    }
  `;
  (document.head || document.body).appendChild(style);
}

export function closeSellAuthEmbedModal() {
  if (typeof document === "undefined") return;
  const modal = document.getElementById("sellauth-modal");
  if (modal) modal.remove();
  const wrap = document.getElementById("sellauth-modal-wrap");
  if (wrap) wrap.remove();
  document.body.style.overflow = "";
}

function openSellAuthEmbedModal(url, scrollTop = true) {
  ensureSellAuthModalStyles();
  closeSellAuthEmbedModal();

  const wrap = document.createElement("div");
  wrap.id = "sellauth-modal-wrap";

  const dialog = document.createElement("dialog");
  dialog.id = "sellauth-modal";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "close";
  closeBtn.setAttribute("aria-label", "Close payment");
  closeBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>';
  closeBtn.onclick = () => closeSellAuthEmbedModal();

  const alertDiv = document.createElement("div");
  alertDiv.setAttribute("role", "alertdialog");

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "SellAuth Embed";
  iframe.referrerPolicy = "no-referrer";
  iframe.allow = "payment; clipboard-write";

  alertDiv.appendChild(iframe);
  dialog.appendChild(closeBtn);
  dialog.appendChild(alertDiv);
  wrap.appendChild(dialog);
  document.body.appendChild(wrap);
  dialog.showModal();

  if (scrollTop) window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";

  dialog.addEventListener("close", () => closeSellAuthEmbedModal());
}

async function ensureAltchaReady() {
  await import("altcha");
  if (!customElements.get("altcha-widget")) {
    await customElements.whenDefined("altcha-widget");
  }
}

async function solveSellAuthAltcha(timeoutMs = 20000) {
  await ensureAltchaReady();

  document.querySelectorAll("altcha-widget[data-sellauth-embed]").forEach((node) => node.remove());

  const widget = document.createElement("altcha-widget");
  widget.setAttribute("data-sellauth-embed", "1");
  widget.setAttribute("challengeurl", SELLAUTH_ALTCHA_URL);
  widget.setAttribute("auto", "onload");
  widget.setAttribute("hidefooter", "true");
  widget.setAttribute("hidelogo", "true");
  widget.style.cssText = "display:none;position:absolute;top:-9999px;left:-9999px;";

  let token = null;
  let lastError = "";
  const onStateChange = (event) => {
    const detail = event?.detail || {};
    if (detail.state === "verified" && detail.payload) {
      token = detail.payload;
      return;
    }
    if (detail.state === "error") {
      lastError = String(detail.error || detail.message || "Captcha error");
    }
  };

  widget.addEventListener("statechange", onStateChange);
  document.body.appendChild(widget);

  try {
    await new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (token) {
          window.clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          window.clearInterval(timer);
          reject(new Error(lastError || "Payment captcha timed out. Please try again."));
        }
      }, 100);
    });
    return token;
  } finally {
    widget.removeEventListener("statechange", onStateChange);
    widget.remove();
  }
}

/**
 * Opens SellAuth payment embed (no Business Checkout API required).
 * @see https://docs.sellauth.com/guides/embed
 */
export async function openSellAuthEmbedCheckout(product, _buttonEl = null, { modal = true, scrollTop = true } = {}) {
  if (typeof window === "undefined") {
    throw new Error("SellAuth embed is only available in the browser.");
  }

  if (!SELLAUTH_SHOP_ID) {
    throw new Error("SellAuth shop is not configured. Set NEXT_PUBLIC_SELLAUTH_SHOP_ID.");
  }

  if (!product?.productId || !product?.variantId) {
    throw new Error("Invalid store product.");
  }

  const altcha = await solveSellAuthAltcha();

  const response = await fetch(SELLAUTH_CHECKOUT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cart: [
        {
          productId: product.productId,
          variantId: product.variantId,
          quantity: 1,
        },
      ],
      shopId: SELLAUTH_SHOP_ID,
      altcha,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (result?.error) {
    throw new Error(String(result.error));
  }

  const url = String(result?.url || "").trim();
  if (!url) {
    throw new Error("No checkout URL returned. Please try again.");
  }

  if (modal) {
    openSellAuthEmbedModal(url, scrollTop);
    return { url, modal: true };
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return { url, modal: false };
}
