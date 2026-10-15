"use client";

import { useEffect } from "react";

export default function NativeLaunchReady() {
  useEffect(() => {
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        const bridge = (
          window as Window & {
            AndroidLaunchScreen?: { markReady?: () => void };
          }
        ).AndroidLaunchScreen;
        bridge?.markReady?.();
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return null;
}
