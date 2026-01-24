"use client";
import { useEffect } from "react";
export function useLoadingFavicon(isLoading, pageTitle = "Totally Normal Store") {
  useEffect(() => {
    let faviconLink = document.querySelector("link[rel='icon']");
    let originalFavicon = null;
    let canvas = null;
    let animationFrameId = null;
    let angle = 0;
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      document.head.appendChild(faviconLink);
    }
    originalFavicon = faviconLink.href;
    const createSpinnerFavicon = () => {
      canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      const animate = () => {
        ctx.clearRect(0, 0, 32, 32);
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        const centerX = 16;
        const centerY = 16;
        const radius = 11;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle - Math.PI / 2, angle + Math.PI * 1.2);
        ctx.stroke();
        angle += 0.15;
        if (angle > Math.PI * 2) angle = 0;
        faviconLink.href = canvas.toDataURL("image/png");
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    };
    const restoreFavicon = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (faviconLink) {
        faviconLink.href = originalFavicon || "/favicon.ico";
      }
    };
    if (isLoading) {
      createSpinnerFavicon();
    } else {
      restoreFavicon();
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (faviconLink && !isLoading) {
        faviconLink.href = originalFavicon || "/favicon.ico";
      }
    };
  }, [isLoading, pageTitle]);
}