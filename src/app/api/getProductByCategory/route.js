import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createSuccessResponse } from "@/lib/errors";
import { getByCategory } from "@/lib/services/productService";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

function getCategoryParam(request) {
  try {
    if (request.nextUrl?.searchParams) {
      return request.nextUrl.searchParams.get("category");
    }
    const url = new URL(request.url, "http://localhost");
    return url.searchParams.get("category");
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const rateLimitResult = checkRateLimit(request, 'publicRead');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
    const supabase = await createClient();
    const categoryParam = getCategoryParam(request);
    const category = sanitizeString(categoryParam, 50);
    if (!category) {
      return createValidationErrorResponse("Category parameter is required");
    }

    const { products: transformedProducts, error } = await getByCategory(supabase, category);
    if (error) {
      return handleError(error, "getProductByCategory");
    }

    return createSuccessResponse(
      { products: transformedProducts, category },
      200,
      { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
    );
  } catch (err) {
    console.error("Category product fetch error:", err);
    return handleError(err, "getProductByCategory");
  }
}