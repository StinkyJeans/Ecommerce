import { NextResponse } from "next/server";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = sanitizeString(searchParams.get("input"), 200);

    if (!input || input.length < 2) {
      return createValidationErrorResponse("Input query must be at least 2 characters");
    }

    // Use Nominatim public API (free, no key required)
    const nominatimUrl = process.env.NEXT_PUBLIC_NOMINATIM_URL || "https://nominatim.openstreetmap.org";
    const url = new URL(`${nominatimUrl}/search`);
    url.searchParams.set("q", input);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "20");
    // Filter for cities/towns/villages (locality types)
    url.searchParams.set("featuretype", "city,town,village");

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
            error: "Rate limit exceeded. Please wait a moment and try again.",
            suggestions: []
          },
          { status: 429 }
        );
      }
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    // Nominatim returns an array of results
    if (Array.isArray(data)) {
      const suggestions = data.map((result) => {
        // Extract city name from name field or first part of display_name
        const mainText = result.name || result.display_name?.split(",")[0]?.trim() || result.display_name;
        // Secondary text is the rest of display_name (province, country, etc.)
        const secondaryText = result.display_name
          ?.split(",")
          .slice(1)
          .join(",")
          .trim() || "";

        return {
          placeId: result.place_id?.toString() || "",
          description: result.display_name || mainText,
          mainText: mainText,
          secondaryText: secondaryText,
          lat: result.lat,
          lon: result.lon
        };
      });

      return NextResponse.json({
        success: true,
        suggestions
      });
    } else {
      // Empty result or unexpected format
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }
  } catch (error) {
    return handleError(error, "geocode/autocomplete");
  }
}
