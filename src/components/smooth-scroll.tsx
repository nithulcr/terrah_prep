"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

export const SmoothScroll = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  useEffect(() => {
    // Disable Lenis on iOS devices - native scroll is smoother and avoids conflicts
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // On iOS, use native scroll - it's already smooth and works better with ScrollTrigger
      return;
    }

    const lenis = new Lenis({
      lerp: 0.06,
      wheelMultiplier: 0.7,
      touchMultiplier: 1,
      smoothWheel: true,
      anchors: true,
    });

    if (typeof window !== "undefined") {
      (window as any).lenis = lenis;

      // Handle hash anchors on mount with a slight delay
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            lenis.scrollTo(element, { offset: -80, duration: 1 });
          }, 500);
        }
      }
    }

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    if ((window as any).lenis) {
        const lenis = (window as any).lenis;
        
        // If there's a hash, let the mount useEffect or native browser handle it
        if (window.location.hash) {
            const id = window.location.hash.substring(1);
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    lenis.scrollTo(element, { offset: -80, duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                }, 100);
            }
        } else {
            // Only scroll to top if no hash is present
            lenis.scrollTo(0, { immediate: true });
        }
    }
    
    // Refresh GSAP ScrollTrigger after route change
    setTimeout(() => {
        import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
            ScrollTrigger.refresh();
        });
    }, 500);
  }, [pathname]);

  return <>{children}</>;
};