export function SkeletonBlock({ className = "", style, ...props }) {
  return <div className={`skeleton-block ${className}`.trim()} style={style} aria-hidden="true" {...props} />;
}

export function LoaderCardSkeleton({ featurePreviewCount = 3 }) {
  return (
    <div className="loader-card loader-card--skeleton" aria-hidden="true">
      <div className="loader-card-media">
        <SkeletonBlock className="skeleton-fill" />
      </div>
      <div className="loader-card-body">
        <h3>
          <span className="skeleton-block skeleton-loader-title-inline" aria-hidden="true" />
        </h3>
        <p className="loader-card-description">
          <span className="skeleton-block skeleton-loader-description-line" aria-hidden="true" />
          <span className="skeleton-block skeleton-loader-description-line skeleton-loader-description-line--short" aria-hidden="true" />
        </p>
        <div className="loader-card-spacer" />
        <div className="loader-card-info">
          <div className="loader-card-feature-label">
            <span className="skeleton-block skeleton-loader-icon-inline" aria-hidden="true" />
            <span className="skeleton-block skeleton-loader-feature-label-inline" aria-hidden="true" />
          </div>
          <div className="loader-card-feature-list">
            {Array.from({ length: featurePreviewCount }).map((_, index) => (
              <span className="skeleton-block skeleton-loader-feature-chip-inline" key={`feature-skeleton-${index}`} aria-hidden="true" />
            ))}
            <span className="skeleton-block skeleton-loader-feature-chip-inline skeleton-loader-feature-chip-inline--more" aria-hidden="true" />
          </div>
          <div className="loader-card-update">
            <span className="skeleton-block skeleton-loader-icon-inline" aria-hidden="true" />
            <span className="skeleton-block skeleton-loader-line" aria-hidden="true" />
          </div>
          <div className="loader-card-status">
            <span className="skeleton-block skeleton-loader-icon-inline" aria-hidden="true" />
            <span className="skeleton-block skeleton-loader-line" aria-hidden="true" />
          </div>
        </div>
        <div className="loader-card-action-row">
          <div className="checkout-pay-button loader-card-action loader-card-action--skeleton">
            <span className="skeleton-block skeleton-loader-action-inline" aria-hidden="true" />
          </div>
          <span className="loader-card-product-link loader-card-product-link--skeleton" aria-hidden="true">
            <span className="skeleton-block skeleton-loader-product-link-inline" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}
