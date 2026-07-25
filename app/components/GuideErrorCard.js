import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  LifeBuoy,
  OctagonAlert,
  Search,
  Wrench,
} from "lucide-react";
import styles from "./AdminPage.module.css";

const SEVERITY = {
  low: {
    label: "Low",
    fixTime: "2 MIN FIX",
    toneClass: styles.guideErrorSeverityLow,
    Icon: CheckCircle2,
  },
  medium: {
    label: "Medium",
    fixTime: "5 MIN FIX",
    toneClass: styles.guideErrorSeverityMedium,
    Icon: AlertTriangle,
  },
  high: {
    label: "Critical",
    fixTime: "15 MIN FIX",
    toneClass: styles.guideErrorSeverityHigh,
    Icon: OctagonAlert,
  },
};

export function getErrorSeverity(item) {
  if (item.severity && SEVERITY[item.severity]) return item.severity;
  const text = `${item.error} ${item.cause} ${item.fix}`.toLowerCase();
  if (
    /banned|revoked|hwid missmatch|failed to map|failed to load vulnerable|driver data is empty|fault 0x/.test(
      text
    )
  ) {
    return "high";
  }
  if (
    /contact support|expired|version|not found|attach|dtb|base address|blocked|frozen|bridge|winhttp|supabase|mapped but not|resolve|overlay missing|render enable|virtual mouse|dd63330/.test(
      text
    )
  ) {
    return "medium";
  }
  return "low";
}

function getFixTime(item, severityKey) {
  if (item.fixTime) return item.fixTime;
  const text = `${item.error} ${item.fix}`.toLowerCase();
  if (severityKey === "high" && /contact support|banned|revoked|hwid/.test(text)) {
    return "SUPPORT";
  }
  if (severityKey === "medium" && /contact support/.test(text)) {
    return "SUPPORT";
  }
  return SEVERITY[severityKey].fixTime;
}

export default function GuideErrorCard({ item }) {
  const severityKey = getErrorSeverity(item);
  const meta = SEVERITY[severityKey];
  const fixTime = getFixTime(item, severityKey);
  const SeverityIcon = meta.Icon;
  const FixIcon = /support/i.test(fixTime) ? LifeBuoy : Clock3;

  return (
    <article className={`${styles.guideErrorCard} ${meta.toneClass}`}>
      <div className={styles.guideErrorExactRow}>
        <div className={styles.guideErrorBadges}>
          <span className={styles.guideErrorSeverityBadge}>
            <SeverityIcon size={11} aria-hidden="true" />
            {meta.label}
          </span>
          <span className={styles.guideErrorFixBadge}>
            <FixIcon size={11} aria-hidden="true" />
            {fixTime}
          </span>
        </div>
        <code className={styles.guideErrorExact}>{item.error}</code>
      </div>
      <dl className={styles.guideErrorMeta}>
        <div>
          <dt>
            <Search size={12} aria-hidden="true" />
            Cause
          </dt>
          <dd>{item.cause}</dd>
        </div>
        <div>
          <dt>
            <Info size={12} aria-hidden="true" />
            Explanation
          </dt>
          <dd>{item.explain}</dd>
        </div>
        <div>
          <dt>
            <Wrench size={12} aria-hidden="true" />
            Fix
          </dt>
          <dd>{item.fix}</dd>
        </div>
      </dl>
      {item.note ? (
        <p className={styles.guideTipNote}>
          <span className={styles.guideNoteLabel}>NOTE:</span>
          {item.note}
        </p>
      ) : null}
    </article>
  );
}
