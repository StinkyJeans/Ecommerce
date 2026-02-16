"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { utilityFunctions } from "@/lib/supabase/api";

export default function VisitTracker() {
  const pathname = usePathname();
  const { role } = useAuth();

  useEffect(() => {
    // Only track visits for authenticated, non-admin users.
    // When role is null, the user is not logged in yet.
    if (!role || pathname.startsWith('/admin') || role === 'admin') {
      return;
    }

    let visitorId = sessionStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_id', visitorId);
    }

    const trackVisit = async () => {
      try {
        await utilityFunctions.trackVisit({
          pagePath: pathname,
          visitorId: visitorId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
      } catch (error) {

      }
    };

    // Delay tracking to avoid blocking page load
    const timeoutId = setTimeout(trackVisit, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [pathname, role]);

  return null;
}
