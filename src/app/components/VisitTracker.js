"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function VisitTracker() {
  const pathname = usePathname();
  const { role } = useAuth();

  useEffect(() => {
    if (pathname.startsWith('/admin') || role === 'admin') {
      return;
    }

    let visitorId = sessionStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_id', visitorId);
    }

    const trackVisit = async () => {
      try {
        await fetch('/api/trackVisit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pagePath: pathname,
            visitorId: visitorId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          }),
        });
      } catch (error) {
        // Failed to track visit
      }
    };

    const timeoutId = setTimeout(trackVisit, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, role]);

  return null;
}
