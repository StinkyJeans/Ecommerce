export function formatPrice(price) {
  if (!price) return "0";
  
  const priceStr = String(price);
  const parts = priceStr.split(".");
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return parts.join(".");
}
