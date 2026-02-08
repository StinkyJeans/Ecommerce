export const CANONICAL_CATEGORIES = ["Pc", "Mobile", "Watch"];

export const CATEGORY_ALIASES = {
  pc: ["pc", "computers", "pc & computers", "computers & laptops"],
  mobile: ["mobile", "mobile devices"],
  watch: ["watch", "watches"],
};

const VALUE_TO_LABEL = {
  Pc: "PC & Computers",
  Mobile: "Mobile Devices",
  Watch: "Watches",
};

const VALUE_TO_PATH = {
  Pc: "/product/category/computers",
  Mobile: "/product/category/mobilephones",
  Watch: "/product/category/watches",
};

export function toCanonicalCategory(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (s === "pc" || s === "computers" || s === "computers & laptops" || s === "pc & computers") return "Pc";
  if (s === "mobile" || s === "mobile devices") return "Mobile";
  if (s === "watch" || s === "watches") return "Watch";
  return null;
}

export function productMatchesCategory(productCategory, requestedCategoryLower) {
  const pCat = (productCategory || "").toString().trim().toLowerCase();
  if (!pCat) return false;
  if (pCat === requestedCategoryLower) return true;
  const aliases = CATEGORY_ALIASES[requestedCategoryLower];
  return Array.isArray(aliases) && aliases.includes(pCat);
}

export function getCategoryLabel(value) {
  return VALUE_TO_LABEL[value] ?? value;
}

export function getCategoryPath(value) {
  return VALUE_TO_PATH[value] ?? "/search";
}

export function getShopCategories() {
  return CANONICAL_CATEGORIES.map((value) => ({
    value,
    label: getCategoryLabel(value),
    path: getCategoryPath(value),
  }));
}

export function getCategoryOptionsForForm() {
  return CANONICAL_CATEGORIES.map((value) => ({
    value,
    label: getCategoryLabel(value),
  }));
}

export function isAllowedCategory(value) {
  return CANONICAL_CATEGORIES.includes(value);
}
