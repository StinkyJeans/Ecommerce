import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import {
  sanitizeString,
  validateLength,
  isValidPhone,
  isValidPostalCode,
} from '../../_shared/validation.ts';
import { requireAuth } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    // Require authentication
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { supabase, userData } = authResult;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const username = sanitizeString(url.searchParams.get('username') || userData.username, 50);

      // Verify ownership
      if (userData.username !== username && userData.role !== 'admin') {
        return createCorsResponse(
          { message: 'Forbidden: You can only access your own addresses', success: false },
          403
        );
      }

      const { data: addresses, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('username', username)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        return createCorsResponse(
          { message: 'Failed to fetch addresses', success: false },
          500
        );
      }

      return createCorsResponse({
        success: true,
        addresses: addresses || [],
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();

      // Sanitize inputs
      const username = sanitizeString(body.username || userData.username, 50);
      const fullName = sanitizeString(body.fullName, 100);
      const phoneNumber = sanitizeString(body.phoneNumber, 20);
      const addressLine1 = sanitizeString(body.addressLine1, 200);
      const addressLine2 = body.addressLine2 ? sanitizeString(body.addressLine2, 200) : null;
      const city = sanitizeString(body.city, 100);
      const province = sanitizeString(body.province, 100);
      const postalCode = sanitizeString(body.postalCode, 20);
      const country = sanitizeString(body.country || 'Philippines', 100);
      const isDefault = body.isDefault === true || body.isDefault === 'true';

      // Verify ownership
      if (userData.username !== username && userData.role !== 'admin') {
        return createCorsResponse(
          { message: 'Forbidden: You can only add addresses to your own account', success: false },
          403
        );
      }

      // Input validation
      if (!username || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
        return createCorsResponse(
          { message: 'Missing required fields', success: false },
          400
        );
      }

      // Validate field lengths and formats
      if (!validateLength(fullName, 2, 100)) {
        return createCorsResponse(
          { message: 'Full name must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!isValidPhone(phoneNumber)) {
        return createCorsResponse(
          { message: 'Invalid phone number format', success: false },
          400
        );
      }
      if (!validateLength(addressLine1, 5, 200)) {
        return createCorsResponse(
          { message: 'Address line 1 must be between 5 and 200 characters', success: false },
          400
        );
      }
      if (!validateLength(city, 2, 100)) {
        return createCorsResponse(
          { message: 'City must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!validateLength(province, 2, 100)) {
        return createCorsResponse(
          { message: 'Province must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!isValidPostalCode(postalCode)) {
        return createCorsResponse(
          { message: 'Invalid postal code format', success: false },
          400
        );
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('username', username)
          .eq('is_default', true);
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
          is_default: isDefault,
        })
        .select()
        .single();

      if (insertError) {
        return createCorsResponse(
          { message: 'Failed to add address', success: false },
          500
        );
      }

      return createCorsResponse(
        {
          success: true,
          message: 'Shipping address added successfully',
          address: newAddress,
        },
        201
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();

      // Sanitize inputs
      const id = body.id;
      const username = sanitizeString(body.username || userData.username, 50);
      const fullName = sanitizeString(body.fullName, 100);
      const phoneNumber = sanitizeString(body.phoneNumber, 20);
      const addressLine1 = sanitizeString(body.addressLine1, 200);
      const addressLine2 = body.addressLine2 ? sanitizeString(body.addressLine2, 200) : null;
      const city = sanitizeString(body.city, 100);
      const province = sanitizeString(body.province, 100);
      const postalCode = sanitizeString(body.postalCode, 20);
      const country = sanitizeString(body.country || 'Philippines', 100);
      const isDefault = body.isDefault === true || body.isDefault === 'true';

      // Verify ownership
      if (userData.username !== username && userData.role !== 'admin') {
        return createCorsResponse(
          { message: 'Forbidden: You can only update your own addresses', success: false },
          403
        );
      }

      // Input validation
      if (!id || !username || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
        return createCorsResponse(
          { message: 'Missing required fields', success: false },
          400
        );
      }

      // Validate field lengths and formats
      if (!validateLength(fullName, 2, 100)) {
        return createCorsResponse(
          { message: 'Full name must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!isValidPhone(phoneNumber)) {
        return createCorsResponse(
          { message: 'Invalid phone number format', success: false },
          400
        );
      }
      if (!validateLength(addressLine1, 5, 200)) {
        return createCorsResponse(
          { message: 'Address line 1 must be between 5 and 200 characters', success: false },
          400
        );
      }
      if (!validateLength(city, 2, 100)) {
        return createCorsResponse(
          { message: 'City must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!validateLength(province, 2, 100)) {
        return createCorsResponse(
          { message: 'Province must be between 2 and 100 characters', success: false },
          400
        );
      }
      if (!isValidPostalCode(postalCode)) {
        return createCorsResponse(
          { message: 'Invalid postal code format', success: false },
          400
        );
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('username', username)
          .eq('is_default', true)
          .neq('id', id);
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
          is_default: isDefault,
        })
        .eq('id', id)
        .eq('username', username)
        .select()
        .single();

      if (updateError) {
        return createCorsResponse(
          { message: 'Failed to update address', success: false },
          500
        );
      }

      if (!updatedAddress) {
        return createCorsResponse(
          { message: 'Address not found', success: false },
          404
        );
      }

      return createCorsResponse({
        success: true,
        message: 'Shipping address updated successfully',
        address: updatedAddress,
      });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const username = sanitizeString(url.searchParams.get('username') || userData.username, 50);

      // Verify ownership
      if (userData.username !== username && userData.role !== 'admin') {
        return createCorsResponse(
          { message: 'Forbidden: You can only delete your own addresses', success: false },
          403
        );
      }

      if (!id) {
        return createCorsResponse(
          { message: 'Address ID is required', success: false },
          400
        );
      }

      const { error: deleteError } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', id)
        .eq('username', username);

      if (deleteError) {
        return createCorsResponse(
          { message: 'Failed to delete address', success: false },
          500
        );
      }

      return createCorsResponse({
        success: true,
        message: 'Shipping address deleted successfully',
      });
    }

    return createCorsResponse(
      { message: 'Method not allowed', success: false },
      405
    );
  });
});
