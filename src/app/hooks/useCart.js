"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cartFunctions } from "@/lib/supabase/api";

export const cartQueryKey = (username) => ["cart", username];

async function fetchCart(username) {
  const data = await cartFunctions.getCart(username);
  return data?.cart ?? [];
}

export function useCart(username) {
  const queryClient = useQueryClient();
  const { data: cartItems = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: cartQueryKey(username),
    queryFn: () => fetchCart(username),
    enabled: Boolean(username),
    staleTime: 30 * 1000,
  });

  const invalidateCart = () => {
    if (username) {
      queryClient.invalidateQueries({ queryKey: cartQueryKey(username) });
    }
  };

  return {
    cartItems,
    loading: isLoading,
    isError,
    error,
    refetch,
    invalidateCart,
    queryClient,
  };
}
