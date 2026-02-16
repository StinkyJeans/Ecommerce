"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cartFunctions } from "@/lib/supabase/api";
import { cartQueryKey } from "./useCart";

export function useAddToCartToast(username, onClosePopup, onSuccess) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const queryClient = useQueryClient();

  const handleAddToCart = useCallback(
    async (product, qty = 1, successCallback) => {
      if (!product) return;
      if (!username) {
        setCartMessage("login");
        setTimeout(() => setCartMessage(""), 3000);
        return;
      }

      setAddingToCart(true);
      try {
        const data = await cartFunctions.addToCart({
          username,
          productId: product.product_id || product.productId,
          productName: product.product_name || product.productName,
          description: product.description,
          price: product.price,
          idUrl: product.id_url || product.idUrl,
          quantity: qty,
        });

        const success =
          data.cartItem ||
          data.updated ||
          (data.message && (data.message.includes("successfully") || data.message.includes("updated")));
        const exists =
          data.message && (data.message.includes("already in cart") || data.message.includes("already in"));

        if (success) {
          setCartMessage("success");
          queryClient.invalidateQueries({ queryKey: cartQueryKey(username) });
          window.dispatchEvent(new Event("cartUpdated"));
          successCallback?.();
          onSuccess?.(product);
          setTimeout(() => {
            setCartMessage("");
            onClosePopup?.();
          }, 2000);
        } else if (exists) {
          setCartMessage("exists");
          setTimeout(() => setCartMessage(""), 3000);
        } else if (data.success === false) {
          setCartMessage("error");
          setTimeout(() => setCartMessage(""), 3000);
        } else {
          setCartMessage("success");
          queryClient.invalidateQueries({ queryKey: cartQueryKey(username) });
          window.dispatchEvent(new Event("cartUpdated"));
          successCallback?.();
          onSuccess?.(product);
          setTimeout(() => {
            setCartMessage("");
            onClosePopup?.();
          }, 2000);
        }
      } catch (err) {
        const isExists =
          err.response?.message && err.response.message.includes("already in cart");
        setCartMessage(isExists ? "exists" : "error");
        setTimeout(() => setCartMessage(""), 3000);
      } finally {
        setAddingToCart(false);
      }
    },
    [username, onClosePopup, queryClient]
  );

  return { handleAddToCart, addingToCart, cartMessage, setCartMessage };
}
