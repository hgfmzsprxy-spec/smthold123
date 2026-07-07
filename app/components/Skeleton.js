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
        <SkeletonBlock className="skeleton-loader-title" />
        <SkeletonBlock className="skeleton-loader-description" />
        <div className="loader-card-spacer" />
        <div className="loader-card-info">
          <div className="loader-card-feature-label">
            <SkeletonBlock className="skeleton-loader-feature-label" />
          </div>
          <div className="loader-card-feature-list">
            {Array.from({ length: featurePreviewCount }).map((_, index) => (
              <SkeletonBlock className="skeleton-loader-feature-chip" key={`feature-skeleton-${index}`} />
            ))}
            <SkeletonBlock className="skeleton-loader-feature-chip skeleton-loader-feature-chip--more" />
          </div>
          <div className="loader-card-update">
            <SkeletonBlock className="skeleton-loader-update" />
          </div>
        </div>
        <div className="loader-card-action loader-card-action--skeleton">
          <SkeletonBlock className="skeleton-loader-action" />
        </div>
      </div>
    </div>
  );
}
