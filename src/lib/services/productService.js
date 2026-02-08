import { toCanonicalCategory, productMatchesCategory } from "@/lib/categories";

export async function getByCategory(supabase, categoryParam) {
  const categoryLower = (categoryParam || "").trim().toLowerCase();
  const canonicalCategory = toCanonicalCategory(categoryParam) || categoryParam;

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

  const filtered = (products || []).filter((p) => p.is_available !== false);
  const transformed = filtered.map((product) => ({
    ...product,
    productId: product.product_id,
    productName: product.product_name,
    idUrl: product.id_url,
    sellerUsername: product.seller_username,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }));

  return { products: transformed, error: (products?.length === 0 && error) ? error : null };
}
