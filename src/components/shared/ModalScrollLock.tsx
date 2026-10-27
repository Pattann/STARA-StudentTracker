"use client";

import { useEffect } from "react";

/**
 * ModalScrollLock
 * Secara otomatis mendeteksi saat ada pop-up dialog/modal (dialog-overlay) yang aktif di DOM,
 * mengunci scroll latar belakang halaman (html & body), dan mencegah pergerakan wheel/touch
 * pada backdrop overlay agar background di belakangnya tidak bisa di-scroll sama sekali.
 */
export function ModalScrollLock() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const MODAL_SELECTOR = '.dialog-overlay, [data-modal-overlay="true"], .modal-overlay, [role="dialog"][aria-modal="true"]';

    let isLocked = false;
    let originalBodyOverflow = "";
    let originalHtmlOverflow = "";

    const lockScroll = () => {
      if (isLocked) return;
      isLocked = true;
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");
    };

    const unlockScroll = () => {
      if (!isLocked) return;
      isLocked = false;

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };

    const checkModalState = () => {
      const modalElements = document.querySelectorAll(MODAL_SELECTOR);
      let visibleModals = 0;

      modalElements.forEach((el) => {
        // Abaikan elemen jika display: none atau visibility: hidden
        const style = window.getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
          visibleModals++;
        }
      });

      if (visibleModals > 0) {
        lockScroll();
      } else {
        unlockScroll();
      }
    };

    // Jalankan pemeriksaan awal
    checkModalState();

    // Pantau perubahan elemen di DOM secara dinamis
    const observer = new MutationObserver(() => {
      checkModalState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "role", "aria-modal"],
    });

    // Mencegah scroll wheel langsung pada latar/backdrop dialog-overlay
    const handleWheel = (e: WheelEvent) => {
      if (!isLocked) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.classList?.contains("dialog-overlay") ||
        target.classList?.contains("modal-overlay") ||
        target.getAttribute("data-modal-overlay") === "true"
      ) {
        e.preventDefault();
      }
    };

    // Mencegah pull/scroll layar pada touch device saat menyentuh backdrop
    const handleTouchMove = (e: TouchEvent) => {
      if (!isLocked) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.classList?.contains("dialog-overlay") ||
        target.classList?.contains("modal-overlay") ||
        target.getAttribute("data-modal-overlay") === "true"
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      unlockScroll();
    };
  }, []);

  return null;
}
