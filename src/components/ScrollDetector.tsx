"use client";

import { useEffect } from 'react';

export const ScrollDetector = () => {
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > 0) {
          document.body.classList.add("scrolled");
        } else {
          document.body.classList.remove("scrolled");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
};