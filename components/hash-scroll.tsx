"use client";

import { useEffect } from "react";

export function HashScroll() {
  useEffect(() => {
    const timeoutIds: number[] = [];

    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const target = document.getElementById(decodeURIComponent(hash));
      target?.scrollIntoView({ block: "start" });
    };

    const scheduleScroll = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(scrollToHash);
      });

      // App Router can stream the target after the first paint. A few bounded
      // retries keep direct deep links reliable without a permanent observer.
      for (const delay of [120, 400, 900]) {
        timeoutIds.push(window.setTimeout(scrollToHash, delay));
      }
    };

    scheduleScroll();
    window.addEventListener("hashchange", scheduleScroll);

    return () => {
      window.removeEventListener("hashchange", scheduleScroll);
      for (const timeoutId of timeoutIds) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
