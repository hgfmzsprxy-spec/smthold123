"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

function getRenderedImageBounds(img) {
  const rect = img.getBoundingClientRect();
  const naturalRatio = img.naturalWidth / img.naturalHeight;
  const elementRatio = rect.width / rect.height;

  if (!img.naturalWidth || !img.naturalHeight) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  if (naturalRatio > elementRatio) {
    const height = rect.width / naturalRatio;
    return {
      left: rect.left,
      top: rect.top + (rect.height - height) / 2,
      width: rect.width,
      height,
    };
  }

  const width = rect.height * naturalRatio;
  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top,
    width,
    height: rect.height,
  };
}

function ProductImageMagnifier({ src, alt }) {
  const containerRef = useRef(null);
  const [lens, setLens] = useState(null);
  const zoom = 2.5;
  const lensSize = 180;

  useEffect(() => {
    setLens(null);
  }, [src]);

  function updateLens(event) {
    const container = containerRef.current;
    const img = container?.querySelector("img");

    if (!container || !img) {
      return;
    }

    const bounds = getRenderedImageBounds(img);
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
      setLens(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const ratioX = x / bounds.width;
    const ratioY = y / bounds.height;
    const backgroundWidth = bounds.width * zoom;
    const backgroundHeight = bounds.height * zoom;

    setLens({
      left: event.clientX - containerRect.left - lensSize / 2,
      top: event.clientY - containerRect.top - lensSize / 2,
      backgroundPosition: `${-(ratioX * backgroundWidth - lensSize / 2)}px ${-(ratioY * backgroundHeight - lensSize / 2)}px`,
      backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
    });
  }

  return (
    <div
      ref={containerRef}
      className="product-image-magnifier"
      onMouseMove={updateLens}
      onMouseLeave={() => setLens(null)}
    >
      <img src={src} alt={alt} draggable={false} />
      {lens ? (
        <div
          className="product-image-magnifier-lens"
          style={{
            width: lensSize,
            height: lensSize,
            transform: `translate(${lens.left}px, ${lens.top}px)`,
            backgroundImage: `url(${src})`,
            backgroundPosition: lens.backgroundPosition,
            backgroundSize: lens.backgroundSize,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export default function ProductImageLightbox({ images, index, onIndexChange, onClose }) {
  useEffect(() => {
    if (index === null) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % images.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, index, onClose, onIndexChange]);

  if (index === null || typeof document === "undefined") {
    return null;
  }

  const image = images[index];

  return createPortal(
    <div
      className="product-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <div className="product-image-lightbox-inner" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="product-image-lightbox-arrow product-image-lightbox-arrow-prev"
          onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
          aria-label="Previous image"
        >
          <ChevronLeft size={24} strokeWidth={2.2} />
        </button>

        <figure className="product-image-lightbox-figure">
          <div className="product-image-lightbox-stage">
            <ProductImageMagnifier src={image.src} alt={image.alt} />
            <div className="product-secondary-more product-image-lightbox-counter" aria-live="polite">
              <Images size={12} strokeWidth={2.4} />
              <span>
                {index + 1}/{images.length}
              </span>
            </div>
          </div>
          <figcaption>{image.alt}</figcaption>
        </figure>

        <button
          type="button"
          className="product-image-lightbox-arrow product-image-lightbox-arrow-next"
          onClick={() => onIndexChange((index + 1) % images.length)}
          aria-label="Next image"
        >
          <ChevronRight size={24} strokeWidth={2.2} />
        </button>

        <div className="product-image-lightbox-thumbs" role="tablist" aria-label="Image previews">
          {images.map((thumb, thumbIndex) => (
            <button
              type="button"
              key={thumb.src}
              role="tab"
              aria-selected={thumbIndex === index}
              className={`product-image-lightbox-thumb${thumbIndex === index ? " is-active" : ""}`}
              onClick={() => onIndexChange(thumbIndex)}
              aria-label={thumb.alt || `Image ${thumbIndex + 1}`}
            >
              <img src={thumb.src} alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
