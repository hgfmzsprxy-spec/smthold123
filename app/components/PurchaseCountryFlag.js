const flagIcons = {
  de: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#000" />
      <rect y="13.33" width="60" height="13.33" fill="#D00" />
      <rect y="26.67" width="60" height="13.33" fill="#FFCE00" />
    </svg>
  ),
  us: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#B22234" />
      <rect y="3.08" width="60" height="3.08" fill="#fff" />
      <rect y="9.23" width="60" height="3.08" fill="#fff" />
      <rect y="15.38" width="60" height="3.08" fill="#fff" />
      <rect y="21.54" width="60" height="3.08" fill="#fff" />
      <rect y="27.69" width="60" height="3.08" fill="#fff" />
      <rect y="33.85" width="60" height="3.08" fill="#fff" />
      <rect width="24" height="21.54" rx="3" fill="#3C3B6E" />
      <circle cx="4" cy="4" r="1.1" fill="#fff" />
      <circle cx="8" cy="4" r="1.1" fill="#fff" />
      <circle cx="12" cy="4" r="1.1" fill="#fff" />
      <circle cx="16" cy="4" r="1.1" fill="#fff" />
      <circle cx="20" cy="4" r="1.1" fill="#fff" />
      <circle cx="6" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="10" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="14" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="18" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="4" cy="11" r="1.1" fill="#fff" />
      <circle cx="8" cy="11" r="1.1" fill="#fff" />
      <circle cx="12" cy="11" r="1.1" fill="#fff" />
      <circle cx="16" cy="11" r="1.1" fill="#fff" />
      <circle cx="20" cy="11" r="1.1" fill="#fff" />
      <circle cx="6" cy="14.5" r="1.1" fill="#fff" />
      <circle cx="10" cy="14.5" r="1.1" fill="#fff" />
      <circle cx="14" cy="14.5" r="1.1" fill="#fff" />
      <circle cx="18" cy="14.5" r="1.1" fill="#fff" />
      <circle cx="4" cy="18" r="1.1" fill="#fff" />
      <circle cx="8" cy="18" r="1.1" fill="#fff" />
      <circle cx="12" cy="18" r="1.1" fill="#fff" />
      <circle cx="16" cy="18" r="1.1" fill="#fff" />
      <circle cx="20" cy="18" r="1.1" fill="#fff" />
    </svg>
  ),
  pl: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#DC143C" />
    </svg>
  ),
  gb: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="7" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="11" />
      <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#fff" />
      <rect width="20" height="40" rx="3" fill="#002395" />
      <rect x="40" width="20" height="40" rx="3" fill="#ED2939" />
    </svg>
  ),
  nl: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#21468B" />
      <rect y="13.33" width="60" height="13.33" fill="#fff" />
      <rect y="26.67" width="60" height="13.33" fill="#AE1C28" />
    </svg>
  ),
  ca: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#fff" />
      <rect width="15" height="40" rx="3" fill="#D80621" />
      <rect x="45" width="15" height="40" rx="3" fill="#D80621" />
      <path
        d="M30 10L31.8 15.5H37.5L33 18.8L34.8 24.3L30 21L25.2 24.3L27 18.8L22.5 15.5H28.2L30 10Z"
        fill="#D80621"
      />
    </svg>
  ),
  br: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#009B3A" />
      <path d="M30 4L56 20L30 36L4 20Z" fill="#FEDF00" />
      <circle cx="30" cy="20" r="8" fill="#002776" />
      <path d="M22 20C22 15.6 25.6 12 30 12" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </svg>
  ),
  it: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#fff" />
      <rect width="20" height="40" rx="3" fill="#009246" />
      <rect x="40" width="20" height="40" rx="3" fill="#CE2B37" />
    </svg>
  ),
  se: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#006AA7" />
      <rect x="16" width="6" height="40" fill="#FECC00" />
      <rect y="17" width="60" height="6" fill="#FECC00" />
    </svg>
  ),
  no: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#BA0C2F" />
      <rect x="16" width="8" height="40" fill="#fff" />
      <rect y="16" width="60" height="8" fill="#fff" />
      <rect x="18" width="4" height="40" fill="#00205B" />
      <rect y="18" width="60" height="4" fill="#00205B" />
    </svg>
  ),
  au: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#012169" />
      <rect width="30" height="20" rx="3" fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="3.5" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
      <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="5.5" />
      <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth="3" />
      <circle cx="45" cy="28" r="2.2" fill="#fff" />
      <circle cx="52" cy="12" r="1.6" fill="#fff" />
      <circle cx="38" cy="10" r="1.4" fill="#fff" />
      <circle cx="48" cy="22" r="1.3" fill="#fff" />
    </svg>
  ),
  tr: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#E30A17" />
      <circle cx="24" cy="20" r="9" fill="#fff" />
      <circle cx="27" cy="20" r="7.2" fill="#E30A17" />
      <path d="M36 16L37.8 21.2L43.2 21.2L38.7 24.5L40.5 29.7L36 26.4L31.5 29.7L33.3 24.5L28.8 21.2L34.2 21.2L36 16Z" fill="#fff" />
    </svg>
  ),
  ua: (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" rx="3" fill="#005BBB" />
      <rect y="20" width="60" height="20" fill="#FFD500" />
    </svg>
  ),
};

export function PurchaseCountryFlag({ code }) {
  const normalized = String(code || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const icon = flagIcons[normalized];
  if (!icon) return null;

  return <span className="purchase-country-flag">{icon}</span>;
}
