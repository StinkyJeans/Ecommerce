# Shipping Addresses Setup Guide

This guide explains how to set up the shipping addresses feature for user account management.

## Database Migration

The shipping addresses feature requires a new database table. Run the following SQL script in your Supabase Dashboard:

### Option 1: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/add-shipping-addresses-table.sql`
4. Click **Run** to execute the script

### Option 2: Using Supabase CLI

If you have Supabase CLI set up, you can run:

```bash
supabase db push
```

## Database Schema

The `shipping_addresses` table includes the following fields:

- `id` (UUID): Primary key
- `username` (TEXT): Username of the address owner
- `full_name` (TEXT): Full name for delivery
- `phone_number` (TEXT): Contact phone number
- `address_line1` (TEXT): Primary address line
- `address_line2` (TEXT, optional): Secondary address line (apartment, unit, etc.)
- `city` (TEXT): City
- `province` (TEXT): Province/State
- `postal_code` (TEXT): Postal/ZIP code
- `country` (TEXT): Country (defaults to 'Philippines')
- `is_default` (BOOLEAN): Whether this is the default shipping address
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Row Level Security (RLS)

The following RLS policies are automatically created:

- **Users can read own addresses**: Users can view their own shipping addresses
- **Users can insert own addresses**: Users can add new shipping addresses
- **Users can update own addresses**: Users can edit their own shipping addresses
- **Users can delete own addresses**: Users can delete their own shipping addresses

## Features

### Account Management Page

Users can access their account management page at `/account` which includes:

1. **Shipping Addresses Tab**:
   - View all saved shipping addresses
   - Add new shipping addresses
   - Edit existing addresses
   - Delete addresses
   - Set default address (only one default per user)

2. **My Orders Tab**:
   - View all past orders
   - See order details (product, quantity, price, status)
   - Track order status (pending, shipped, delivered)

### API Endpoints

The following API endpoints are available:

- `GET /api/shipping-addresses?username={username}`: Fetch all addresses for a user
- `POST /api/shipping-addresses`: Add a new shipping address
- `PUT /api/shipping-addresses`: Update an existing shipping address
- `DELETE /api/shipping-addresses?id={id}`: Delete a shipping address

## Usage

1. Users can navigate to the account management page by clicking "Manage My Account" in the header dropdown menu
2. In the Shipping Addresses tab, click "Add Address" to create a new address
3. Fill in the required fields (marked with *)
4. Optionally check "Set as default address" to make it the default
5. Click "Add Address" to save

## Default Address Management

When a user sets an address as default:
- All other addresses for that user are automatically set to `is_default = false`
- Only one default address is allowed per user
- The default address is displayed with a badge and highlighted styling

## Notes

- All addresses are user-specific and cannot be accessed by other users
- The country field defaults to "Philippines" but can be changed
- Address Line 2 is optional for additional address details (apartment numbers, building names, etc.)
- The account management page is protected and requires user authentication
