/**
 * Watermark Landing Page — Interactive Scripts
 *
 * Handles:
 * 1. Scroll-based reveal animations via IntersectionObserver
 * 2. Cursor-following glow blob effect
 * 3. Navbar background on scroll
 */

/* =========================================================================
   1. Reveal-on-Scroll Animations
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show everything immediately for older browsers
    revealElements.forEach((el) => el.classList.add("active"));
  }

  /* =========================================================================
     2. Cursor Blob Effect
     ========================================================================= */
  const cursorBlob = document.getElementById("cursorBlob");

  if (cursorBlob) {
    let blobVisible = false;

    document.addEventListener("mousemove", (e) => {
      if (!blobVisible) {
        cursorBlob.style.opacity = "0.12";
        blobVisible = true;
      }
      cursorBlob.style.left = e.clientX + "px";
      cursorBlob.style.top = e.clientY + window.scrollY + "px";
    });

    document.addEventListener("mouseleave", () => {
      cursorBlob.style.opacity = "0";
      blobVisible = false;
    });
  }

  /* =========================================================================
     3. Navbar Background on Scroll
     ========================================================================= */
  const navbar = document.querySelector(".navbar");

  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 40) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load
  }
});
