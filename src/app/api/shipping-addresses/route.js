import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { sanitizeString, validateLength, isValidPhone, isValidPostalCode } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
export async function GET(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { searchParams } = new URL(req.url);
    const username = sanitizeString(searchParams.get('username'), 50);
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const supabase = await createClient();
    if (!supabase) {
      return handleError(new Error("Supabase client not initialized"), 'getShippingAddresses');
    }
    const { data: addresses, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('username', username)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      return handleError(error, 'getShippingAddresses');
    }
    return NextResponse.json({ 
      success: true,
      addresses: addresses || []
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getShippingAddresses');
  }
}
export async function POST(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const body = await req.json();
    const username = sanitizeString(body.username, 50);
    const fullName = sanitizeString(body.fullName, 100);
    const phoneNumber = sanitizeString(body.phoneNumber, 20);
    const addressLine1 = sanitizeString(body.addressLine1, 200);
    const addressLine2 = body.addressLine2 ? sanitizeString(body.addressLine2, 200) : null;
    const city = sanitizeString(body.city, 100);
    const province = sanitizeString(body.province, 100);
    const postalCode = sanitizeString(body.postalCode, 20);
    const country = sanitizeString(body.country || 'Philippines', 100);
    const isDefault = body.isDefault === true || body.isDefault === 'true';
    if (!username || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
      return createValidationErrorResponse("Missing required fields");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const validationErrors = [];
    if (!validateLength(fullName, 2, 100)) {
      validationErrors.push("Full name must be between 2 and 100 characters");
    }
    if (!isValidPhone(phoneNumber)) {
      validationErrors.push("Invalid phone number format. Please use 7-15 digits (e.g., 09123456789)");
    }
    if (!validateLength(addressLine1, 5, 200)) {
      validationErrors.push("Address line 1 must be between 5 and 200 characters");
    }
    if (!validateLength(city, 2, 100)) {
      validationErrors.push("City must be between 2 and 100 characters");
    }
    if (!validateLength(province, 2, 100)) {
      validationErrors.push("Province must be between 2 and 100 characters");
    }
    if (!isValidPostalCode(postalCode)) {
      validationErrors.push("Invalid postal code format. Please use 3-10 alphanumeric characters");
    }
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }
    const supabase = await createClient();
    if (!supabase) {
      return handleError(new Error("Supabase client not initialized"), 'addShippingAddress');
    }
    if (isDefault) {
      const { error: updateError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('username', username)
        .eq('is_default', true);
      if (updateError) {
      }
    }
    const { data: newAddress, error: insertError } = await supabase
      .from('shipping_addresses')
      .insert({
        username,
        full_name: fullName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        province,
        postal_code: postalCode,
        country,
        is_default: isDefault
      })
      .select()
      .single();
    if (insertError) {
      return handleError(insertError, 'addShippingAddress');
    }
    return NextResponse.json({ 
      success: true,
      message: "Shipping address added successfully",
      address: newAddress
    }, { status: 201 });
  } catch (err) {
    return handleError(err, 'addShippingAddress');
  }
}
export async function PUT(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const body = await req.json();
    const id = sanitizeString(body.id, 100);
    const fullName = sanitizeString(body.fullName, 100);
    const phoneNumber = sanitizeString(body.phoneNumber, 20);
    const addressLine1 = sanitizeString(body.addressLine1, 200);
    const addressLine2 = body.addressLine2 ? sanitizeString(body.addressLine2, 200) : null;
    const city = sanitizeString(body.city, 100);
    const province = sanitizeString(body.province, 100);
    const postalCode = sanitizeString(body.postalCode, 20);
    const country = sanitizeString(body.country || 'Philippines', 100);
    const isDefault = body.isDefault === true || body.isDefault === 'true';
    if (!id || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
      return createValidationErrorResponse("Missing required fields");
    }
    const validationErrors = [];
    if (!validateLength(fullName, 2, 100)) {
      validationErrors.push("Full name must be between 2 and 100 characters");
    }
    if (!isValidPhone(phoneNumber)) {
      validationErrors.push("Invalid phone number format. Please use 7-15 digits (e.g., 09123456789)");
    }
    if (!validateLength(addressLine1, 5, 200)) {
      validationErrors.push("Address line 1 must be between 5 and 200 characters");
    }
    if (!validateLength(city, 2, 100)) {
      validationErrors.push("City must be between 2 and 100 characters");
    }
    if (!validateLength(province, 2, 100)) {
      validationErrors.push("Province must be between 2 and 100 characters");
    }
    if (!isValidPostalCode(postalCode)) {
      validationErrors.push("Invalid postal code format. Please use 3-10 alphanumeric characters");
    }
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }
    const supabase = await createClient();
    if (!supabase) {
      return handleError(new Error("Supabase client not initialized"), 'updateShippingAddress');
    }
    const { data: existingAddress } = await supabase
      .from('shipping_addresses')
      .select('username')
      .eq('id', id)
      .single();
    if (!existingAddress) {
      return NextResponse.json({ 
        message: "Address not found" 
      }, { status: 404 });
    }
    const ownershipCheck = await verifyOwnership(existingAddress.username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    if (isDefault) {
      const { error: updateError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('username', existingAddress.username)
        .eq('is_default', true)
        .neq('id', id);
      if (updateError) {
      }
    }
    const { data: updatedAddress, error: updateError } = await supabase
      .from('shipping_addresses')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        province,
        postal_code: postalCode,
        country,
        is_default: isDefault
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return handleError(updateError, 'updateShippingAddress');
    }
    return NextResponse.json({ 
      success: true,
      message: "Shipping address updated successfully",
      address: updatedAddress
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'updateShippingAddress');
  }
}
export async function DELETE(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get('id'), 100);
    if (!id) {
      return createValidationErrorResponse("Address ID is required");
    }
    const supabase = await createClient();
    if (!supabase) {
      return handleError(new Error("Supabase client not initialized"), 'deleteShippingAddress');
    }
    const { data: existingAddress } = await supabase
      .from('shipping_addresses')
      .select('username')
      .eq('id', id)
      .single();
    if (!existingAddress) {
      return NextResponse.json({ 
        message: "Address not found" 
      }, { status: 404 });
    }
    const ownershipCheck = await verifyOwnership(existingAddress.username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const { error: deleteError } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return handleError(deleteError, 'deleteShippingAddress');
    }
    return NextResponse.json({ 
      success: true,
      message: "Shipping address deleted successfully"
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'deleteShippingAddress');
  }
}