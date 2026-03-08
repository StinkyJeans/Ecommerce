import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createSupabaseAdminClient } from "../src/lib/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

const CATEGORIES = ["Pc", "Mobile", "Watch"];
const SELLER_COUNT = 5;
const PRODUCTS_PER_SELLER = 10;
const SEED_TAG = Date.now().toString().slice(-8);

function buildSellers() {
  const sellers = [];
  for (let i = 1; i <= SELLER_COUNT; i++) {
    sellers.push({
      username: `seller_${SEED_TAG}_${i}`,
      email: `seller.${SEED_TAG}.${i}@example.test`,
      password: `Seller#2026!${i}A`,
      contact: `091700000${i}${i}`,
      id_url: `https://picsum.photos/seed/seller-id-${SEED_TAG}-${i}/800/500`,
      role: "seller",
      seller_status: "approved",
    });
  }
  return sellers;
}

function createProductsForSeller(sellerUsername, sellerIndex) {
  const products = [];
  for (let i = 1; i <= PRODUCTS_PER_SELLER; i++) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length];
    const productNumeric = sellerIndex * 100 + i;
    products.push({
      product_id: `SEED-${SEED_TAG}-${sellerIndex}-${i}`,
      seller_username: sellerUsername,
      product_name: `Seed Product ${productNumeric}`,
      description: `Demo seeded product ${productNumeric} for ${sellerUsername}.`,
      price: (499 + i * 37).toString(),
      category,
      id_url: `https://picsum.photos/seed/seed-product-${SEED_TAG}-${sellerIndex}-${i}/900/900`,
      stock_quantity: 25 + i,
      is_available: true,
    });
  }
  return products;
}

async function seedSellersAndProducts() {
  const supabase = createSupabaseAdminClient();
  const sellers = buildSellers();
  const credentials = [];

  console.log("Starting seller + product seeding...");
  console.log(`Seed tag: ${SEED_TAG}`);

  for (let index = 0; index < sellers.length; index++) {
    const seller = sellers[index];
    const sellerNumber = index + 1;
    console.log(`\n[${sellerNumber}/${SELLER_COUNT}] Creating seller: ${seller.username}`);

    const { data: authUserData, error: authError } = await supabase.auth.admin.createUser({
      email: seller.email,
      password: seller.password,
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        role: "seller",
      },
    });

    if (authError) {
      throw new Error(`Failed creating auth user for ${seller.username}: ${authError.message}`);
    }

    const { error: userInsertError } = await supabase.from("users").insert({
      username: seller.username,
      email: seller.email,
      contact: seller.contact,
      id_url: seller.id_url,
      role: seller.role,
      seller_status: seller.seller_status,
    });

    if (userInsertError) {
      throw new Error(`Failed inserting users row for ${seller.username}: ${userInsertError.message}`);
    }

    const products = createProductsForSeller(seller.username, sellerNumber);
    const { error: productsInsertError } = await supabase.from("products").insert(products);

    if (productsInsertError) {
      throw new Error(`Failed inserting products for ${seller.username}: ${productsInsertError.message}`);
    }

    credentials.push({
      username: seller.username,
      password: seller.password,
      email: seller.email,
      authUserId: authUserData?.user?.id || null,
      productsCreated: products.length,
    });

    console.log(`Created ${products.length} products for ${seller.username}`);
  }

  console.log("\nSeeding complete.");
  console.log("Seller credentials:");
  for (const entry of credentials) {
    console.log(`- ${entry.username} | ${entry.password} | ${entry.email}`);
  }
}

seedSellersAndProducts().catch((error) => {
  console.error("\nSeeding failed:", error.message);
  process.exit(1);
});
