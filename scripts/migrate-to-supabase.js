import mongoose from 'mongoose';
import { createSupabaseAdminClient } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGODB_URI || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- MONGODB_URI:', !!MONGODB_URI);
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

const UserSchema = new mongoose.Schema({}, { strict: false });
const SellerSchema = new mongoose.Schema({}, { strict: false });
const AddProductSchema = new mongoose.Schema({}, { strict: false });
const AddToCartSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Seller = mongoose.model('Seller', SellerSchema);
const AddProduct = mongoose.model('AddProduct', AddProductSchema);
const AddToCart = mongoose.model('AddToCart', AddToCartSchema);
const Order = mongoose.model('Order', OrderSchema);

async function migrateUsers() {
  console.log('\n📦 Migrating Users...');
  const supabase = createSupabaseAdminClient();
  
  const users = await User.find({});
  console.log(`Found ${users.length} users`);
  
  const userData = users.map(user => ({
    username: user.username,
    email: user.email || null,
    contact: user.contact || null,
    id_url: user.idUrl || null,
    role: user.role || 'user',
    created_at: user.createdAt || new Date().toISOString(),
    updated_at: user.updatedAt || new Date().toISOString()
  }));
  
  if (userData.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'username' });
    
    if (error) {
      console.error('Error migrating users:', error);
      return { success: false, count: 0 };
    }
    console.log(`✅ Migrated ${userData.length} users`);
    return { success: true, count: userData.length };
  }
  
  return { success: true, count: 0 };
}

async function migrateSellers() {
  console.log('\n📦 Migrating Sellers...');
  const supabase = createSupabaseAdminClient();
  
  const sellers = await Seller.find({});
  console.log(`Found ${sellers.length} sellers`);
  
  const sellerData = sellers.map(seller => ({
    username: seller.sellerUsername,
    email: seller.email || null,
    contact: seller.contact || null,
    id_url: seller.idUrl || null,
    role: 'seller',
    created_at: seller.createdAt || new Date().toISOString(),
    updated_at: seller.updatedAt || new Date().toISOString()
  }));
  
  if (sellerData.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .upsert(sellerData, { onConflict: 'username' });
    
    if (error) {
      console.error('Error migrating sellers:', error);
      return { success: false, count: 0 };
    }
    console.log(`✅ Migrated ${sellerData.length} sellers`);
    return { success: true, count: sellerData.length };
  }
  
  return { success: true, count: 0 };
}

async function migrateProducts() {
  console.log('\n📦 Migrating Products...');
  const supabase = createSupabaseAdminClient();
  
  const products = await AddProduct.find({});
  console.log(`Found ${products.length} products`);
  
  const productData = products.map(product => ({
    product_id: product.productId,
    seller_username: product.sellerUsername,
    product_name: product.productName,
    description: product.description,
    price: product.price,
    category: product.category,
    id_url: product.idUrl,
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: product.updatedAt || new Date().toISOString()
  }));
  
  if (productData.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'product_id' });
    
    if (error) {
      console.error('Error migrating products:', error);
      return { success: false, count: 0 };
    }
    console.log(`✅ Migrated ${productData.length} products`);
    return { success: true, count: productData.length };
  }
  
  return { success: true, count: 0 };
}

async function migrateCartItems() {
  console.log('\n📦 Migrating Cart Items...');
  const supabase = createSupabaseAdminClient();
  
  const cartItems = await AddToCart.find({});
  console.log(`Found ${cartItems.length} cart items`);
  
  const cartData = cartItems.map(item => ({
    username: item.username,
    product_id: item.productId,
    product_name: item.productName,
    description: item.description,
    price: item.price,
    id_url: item.idUrl,
    quantity: item.quantity || 1,
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString()
  }));
  
  if (cartData.length > 0) {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(cartData, { onConflict: 'username,product_id' });
    
    if (error) {
      console.error('Error migrating cart items:', error);
      return { success: false, count: 0 };
    }
    console.log(`✅ Migrated ${cartData.length} cart items`);
    return { success: true, count: cartData.length };
  }
  
  return { success: true, count: 0 };
}

async function migrateOrders() {
  console.log('\n📦 Migrating Orders...');
  const supabase = createSupabaseAdminClient();
  
  const orders = await Order.find({});
  console.log(`Found ${orders.length} orders`);
  
  const orderData = orders.map(order => ({
    username: order.username,
    seller_username: order.sellerUsername,
    product_id: order.productId,
    product_name: order.productName,
    price: typeof order.price === 'string' ? parseFloat(order.price) : order.price,
    quantity: order.quantity || 1,
    total_amount: typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount,
    status: order.status || 'pending',
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: order.updatedAt || new Date().toISOString()
  }));
  
  if (orderData.length > 0) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData);
    
    if (error) {
      console.error('Error migrating orders:', error);
      return { success: false, count: 0 };
    }
    console.log(`✅ Migrated ${orderData.length} orders`);
    return { success: true, count: orderData.length };
  }
  
  return { success: true, count: 0 };
}

async function main() {
  console.log('🚀 Starting MongoDB to Supabase migration...\n');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'Ecomerce'
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Run migrations
    const results = {
      users: await migrateUsers(),
      sellers: await migrateSellers(),
      products: await migrateProducts(),
      cartItems: await migrateCartItems(),
      orders: await migrateOrders()
    };
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    console.log(`Users: ${results.users.count}`);
    console.log(`Sellers: ${results.sellers.count}`);
    console.log(`Products: ${results.products.count}`);
    console.log(`Cart Items: ${results.cartItems.count}`);
    console.log(`Orders: ${results.orders.count}`);
    
    const allSuccess = Object.values(results).every(r => r.success);
    if (allSuccess) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the output above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
