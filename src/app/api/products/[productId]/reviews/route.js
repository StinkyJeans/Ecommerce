import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString, validateLength } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import {
  createValidationErrorResponse,
  handleError,
} from "@/lib/errors";

async function getParams(context) {
  const params = typeof context?.params?.then === "function"
    ? await context.params
    : context?.params || {};
  return params;
}

export async function GET(req, context) {
  try {
    const rateLimitResult = checkRateLimit(req, "publicRead");
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
    const params = await getParams(context);
    const productId = sanitizeString(params?.productId ?? "", 200);
    if (!productId) {
      return createValidationErrorResponse("product_id is required");
    }
    const { searchParams } = new URL(req.url);
    const ratingFilter = searchParams.get("rating");
    const rating = ratingFilter ? parseInt(ratingFilter, 10) : null;

    const supabase = await createClient();
    let query = supabase
      .from("product_reviews")
      .select("id, product_id, username, rating, review_text, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (rating >= 1 && rating <= 5) {
      query = query.eq("rating", rating);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return handleError(error, "getProductReviews");
    }

    const list = reviews || [];
    const totalCount = list.length;
    const averageRating =
      totalCount > 0
        ? list.reduce((sum, r) => sum + r.rating, 0) / totalCount
        : 0;

    return NextResponse.json({
      success: true,
      reviews: list,
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount,
    });
  } catch (err) {
    return handleError(err, "getProductReviews");
  }
}

export async function POST(req, context) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;

    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;

    const rateLimitResult = checkRateLimit(req, "submitReview", userData.username);
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const params = await getParams(context);
    const productId = sanitizeString(params?.productId ?? body?.product_id ?? "", 200);
    if (!productId) {
      return createValidationErrorResponse("product_id is required");
    }

    const ratingRaw = body?.rating;
    const rating = typeof ratingRaw === "number" ? ratingRaw : parseInt(ratingRaw, 10);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return createValidationErrorResponse("rating must be between 1 and 5");
    }

    const reviewText = body?.review_text != null ? sanitizeString(String(body.review_text), 2000) : null;
    if (reviewText !== null && !validateLength(reviewText, 0, 2000)) {
      return createValidationErrorResponse("review_text must be at most 2000 characters");
    }

    const username = userData.username;
    const supabase = await createClient();

    const row = {
      product_id: productId,
      username,
      rating,
      review_text: reviewText || null,
    };
    const { data: inserted, error: upsertError } = await supabase
      .from("product_reviews")
      .upsert([row], { onConflict: "product_id,username" })
      .select("id, product_id, username, rating, review_text, created_at")
      .single();

    if (upsertError) {
      if (upsertError.code === "23503") {
        return NextResponse.json({ message: "Product not found", success: false }, { status: 404 });
      }
      return handleError(upsertError, "submitProductReview");
    }

    return NextResponse.json({
      success: true,
      review: inserted,
    });
  } catch (err) {
    return handleError(err, "submitProductReview");
  }
}
