import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: "Username is required." }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    const { data: addresses, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('username', username)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get shipping addresses error:", error);
      return NextResponse.json({ 
        message: "Server error", 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      addresses: addresses || []
    }, { status: 200 });
  } catch (err) {
    console.error("Get shipping addresses error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault } = body;

    if (!username || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
      return NextResponse.json({ 
        message: "Missing required fields." 
      }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    if (isDefault) {
      const { error: updateError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('username', username)
        .eq('is_default', true);

      if (updateError) {
        console.error("Error updating default addresses:", updateError);
      }
    }

    const { data: newAddress, error: insertError } = await supabase
      .from('shipping_addresses')
      .insert({
        username,
        full_name: fullName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        province,
        postal_code: postalCode,
        country: country || 'Philippines',
        is_default: isDefault || false
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert shipping address error:", insertError);
      return NextResponse.json({ 
        message: "Failed to add shipping address", 
        error: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Shipping address added successfully",
      address: newAddress
    }, { status: 201 });
  } catch (err) {
    console.error("Add shipping address error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault } = body;

    if (!id || !fullName || !phoneNumber || !addressLine1 || !city || !province || !postalCode) {
      return NextResponse.json({ 
        message: "Missing required fields." 
      }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
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

    if (isDefault) {
      const { error: updateError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('username', existingAddress.username)
        .eq('is_default', true)
        .neq('id', id);

      if (updateError) {
        console.error("Error updating default addresses:", updateError);
      }
    }

    const { data: updatedAddress, error: updateError } = await supabase
      .from('shipping_addresses')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        province,
        postal_code: postalCode,
        country: country || 'Philippines',
        is_default: isDefault || false
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Update shipping address error:", updateError);
      return NextResponse.json({ 
        message: "Failed to update shipping address", 
        error: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Shipping address updated successfully",
      address: updatedAddress
    }, { status: 200 });
  } catch (err) {
    console.error("Update shipping address error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        message: "Address ID is required." 
      }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Delete shipping address error:", deleteError);
      return NextResponse.json({ 
        message: "Failed to delete shipping address", 
        error: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Shipping address deleted successfully"
    }, { status: 200 });
  } catch (err) {
    console.error("Delete shipping address error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
