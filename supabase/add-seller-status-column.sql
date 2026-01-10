-- Add seller_status column to users table if it doesn't exist
-- This migration adds the seller_status column for tracking seller approval status

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'seller_status'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN seller_status TEXT 
        DEFAULT NULL 
        CHECK (seller_status IN ('pending', 'approved', 'rejected'));
        
        RAISE NOTICE 'seller_status column added successfully';
    ELSE
        RAISE NOTICE 'seller_status column already exists';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN users.seller_status IS 'Status of seller account: pending, approved, or rejected';
