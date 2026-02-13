import { NextResponse } from "next/server";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function GET(request) {
  try {
    const rateLimitResult = checkRateLimit(request, 'publicRead');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
    const { searchParams } = new URL(request.url);
    const placeId = sanitizeString(searchParams.get("place_id"), 200);
    const lat = sanitizeString(searchParams.get("lat"), 50);
    const lon = sanitizeString(searchParams.get("lon"), 50);

    // Prefer lat/lon for reverse geocoding (more reliable than lookup)
    if (!lat || !lon) {
      if (!placeId) {
        return createValidationErrorResponse("place_id or lat/lon is required");
      }
    }

    // Use Nominatim reverse geocoding API (free, no key required)
    const nominatimUrl = process.env.NEXT_PUBLIC_NOMINATIM_URL || "https://nominatim.openstreetmap.org";
    const url = new URL(`${nominatimUrl}/reverse`);
    
    if (lat && lon) {
      // Use reverse geocoding with coordinates (preferred method)
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lon);
    } else if (placeId) {
      // Fallback: Try lookup API (may not work for all place_ids)
      // Nominatim place_id is OSM ID, but we need to know type (N/W/R)
      // Try as node first (most common for cities)
      const lookupUrl = new URL(`${nominatimUrl}/lookup`);
      lookupUrl.searchParams.set("osm_ids", `N${placeId}`);
      lookupUrl.searchParams.set("format", "json");
      lookupUrl.searchParams.set("addressdetails", "1");

      const headers = {
        "User-Agent": "Totally Normal Store E-commerce App (contact: jome490@gmail.com)",
        "Accept": "application/json",
        "Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      };

      const lookupResponse = await fetch(lookupUrl.toString(), { headers });

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        if (Array.isArray(lookupData) && lookupData.length > 0) {
          const result = lookupData[0];
          const address = result.address || {};

          const city = address.city || address.town || address.village || address.municipality || address.county || address.suburb || "";
          const province = address.state || address.state_district || address.region || address.province || "";
          const country = address.country || "";

          return NextResponse.json({
            success: true,
            city: city,
            province: province,
            country: country,
            formattedAddress: result.display_name || ""
          });
        }
      }
      
      // If lookup fails, return error
      return NextResponse.json({
        success: false,
        error: "Location not found. Please try selecting the city again.",
        city: "",
        province: "",
        country: "",
        formattedAddress: ""
      });
    }

    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    // Nominatim requires User-Agent header (required by their usage policy)
    const headers = {
      "User-Agent": "Totally Normal Store E-commerce App (contact: jome490@gmail.com)",
      "Accept": "application/json",
      "Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded. Please wait a moment and try again."
          },
          { status: 429 }
        );
      }
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    // Nominatim reverse geocoding returns a single object
    if (data && data.address) {
      const address = data.address;

      // Extract address components with fallbacks for different country formats
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality || 
                   address.county ||
                   address.suburb ||
                   "";

      const province = address.state || 
                       address.state_district || 
                       address.region || 
                       address.province ||
                       "";

      const country = address.country || "";

      return NextResponse.json({
        success: true,
        city: city,
        province: province,
        country: country,
        formattedAddress: data.display_name || ""
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Location not found",
        city: "",
        province: "",
        country: "",
        formattedAddress: ""
      });
    }
  } catch (error) {
    return handleError(error, "geocode/details");
  }
}
