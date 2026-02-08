export async function getCart(supabase, username) {
  const { data: cart, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  if (error) return { cart: [], error };

  const cartWithSellers = await Promise.all(
    (cart || []).map(async (item) => {
      const { data: product } = await supabase
        .from("products")
        .select("seller_username")
        .eq("product_id", item.product_id)
        .single();
      return {
        ...item,
        idUrl: item.id_url,
        productName: item.product_name,
        seller_username: product?.seller_username || "Unknown",
      };
    })
  );
  return { cart: cartWithSellers, error: null };
}

export async function addItem(supabase, payload) {
  const {
    username,
    product_id,
    product_name,
    description,
    price,
    id_url,
    quantity = 1,
  } = payload;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock_quantity, is_available, price")
    .eq("product_id", product_id)
    .single();

  if (productError || !product) {
    return { success: false, code: "PRODUCT_NOT_FOUND" };
  }
  if (!product.is_available) {
    return { success: false, code: "PRODUCT_UNAVAILABLE" };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("username", username)
    .eq("product_id", product_id)
    .single();

  const currentCartQuantity = existing && !fetchError ? existing.quantity : 0;
  const totalRequested = currentCartQuantity + (quantity || 1);
  const availableStock = product.stock_quantity || 0;

  if (availableStock < totalRequested) {
    return {
      success: false,
      code: "INSUFFICIENT_STOCK",
      available_stock: availableStock,
      requested: totalRequested,
    };
  }

  if (existing && !fetchError) {
    const newQuantity = existing.quantity + (quantity || 1);
    const { data: updated, error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existing.id)
      .select()
      .single();
    if (updateError) return { success: false, error: updateError };
    return {
      success: true,
      updated: true,
      quantity: updated.quantity,
    };
  }

  const currentPrice = parseFloat(product.price) || parseFloat(price);
  const priceString = typeof currentPrice === "number" ? currentPrice.toString() : price;
  const { data: cartItem, error: insertError } = await supabase
    .from("cart_items")
    .insert({
      username,
      product_id,
      product_name,
      description,
      price: priceString,
      id_url,
      quantity: quantity || 1,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, code: "ALREADY_IN_CART" };
    }
    return { success: false, error: insertError };
  }
  return {
    success: true,
    cartItem: {
      productId: cartItem.product_id,
      productName: cartItem.product_name,
      quantity: cartItem.quantity,
    },
  };
}
