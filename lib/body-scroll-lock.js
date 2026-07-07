const SCROLL_LOCK_CLASS = "menu-open";

let lockCount = 0;
let lockedScrollY = 0;

export function lockBodyScroll() {
  if (typeof document === "undefined") {
    return () => {};
  }

  lockCount += 1;

  if (lockCount === 1) {
    lockedScrollY = window.scrollY;
    document.documentElement.classList.add(SCROLL_LOCK_CLASS);
    document.body.classList.add(SCROLL_LOCK_CLASS);
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  return unlockBodyScroll;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined" || lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
  document.body.classList.remove(SCROLL_LOCK_CLASS);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, lockedScrollY);
}
