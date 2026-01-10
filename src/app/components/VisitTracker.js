"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function VisitTracker() {
  const pathname = usePathname();
  const { role } = useAuth();

  useEffect(() => {
    // Skip tracking for admin pages and admin users
    if (pathname.startsWith('/admin') || role === 'admin') {
      return; // Don't track admin pages or admin user visits
    }

    // Generate or get visitor ID from sessionStorage
    let visitorId = sessionStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_id', visitorId);
    }

    // Track the visit
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
            // Note: IP address should be tracked server-side for security
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Failed to track visit:', error);
      }
    };

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(trackVisit, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, role]);

  return null; // This component doesn't render anything
}
