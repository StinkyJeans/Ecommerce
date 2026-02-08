import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

function toCanonicalCategory(lower) {
  if (!lower || typeof lower !== "string") return null;
  const s = lower.trim().toLowerCase();
  if (s === "pc" || s === "computers" || s === "computers & laptops" || s === "pc & computers") return "Pc";
  if (s === "mobile" || s === "mobile devices") return "Mobile";
  if (s === "watch" || s === "watches") return "Watch";
  return null;
}

const CATEGORY_ALIASES = {
  pc: ["pc", "computers", "pc & computers", "computers & laptops"],
  mobile: ["mobile", "mobile devices"],
  watch: ["watch", "watches"],
};

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

function productMatchesCategory(productCategory, requestedCategoryLower) {
  const pCat = (productCategory || "").toString().trim().toLowerCase();
  if (!pCat) return false;
  if (pCat === requestedCategoryLower) return true;
  const aliases = CATEGORY_ALIASES[requestedCategoryLower];
  return Array.isArray(aliases) && aliases.includes(pCat);
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const categoryParam = getCategoryParam(request);
    const category = sanitizeString(categoryParam, 50);
    if (!category) {
      return createValidationErrorResponse("Category parameter is required");
    }

    const categoryLower = category.toLowerCase();
    const canonicalCategory = toCanonicalCategory(category) || category;

    let { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", canonicalCategory)
      .order("created_at", { ascending: false });

    if (error || !products || products.length === 0) {
      const { data: allProducts, error: allError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!allError && allProducts && allProducts.length > 0) {
        products = allProducts.filter((p) =>
          productMatchesCategory(p.category, categoryLower)
        );
      } else {
        products = products || [];
      }
    }

    if (error && (!products || products.length === 0)) {
      return handleError(error, "getProductByCategory");
    }

    let filteredProducts = (products || []).filter((p) => {
      if (p.is_available === false) return false;
      return true;
    });

    const transformedProducts = filteredProducts.map((product) => ({
      ...product,
      productId: product.product_id,
      productName: product.product_name,
      idUrl: product.id_url,
      sellerUsername: product.seller_username,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    const response = NextResponse.json({
      products: transformedProducts,
      category,
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (err) {
    console.error("Category product fetch error:", err);
    return handleError(err, "getProductByCategory");
  }
}