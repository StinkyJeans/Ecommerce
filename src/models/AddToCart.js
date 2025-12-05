import mongoose, { Schema } from "mongoose";

const AddToCartSchema = new Schema(
  {
    username: { type: String, required: true },
    productId: { type: String, required: true }, // Add productId
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    idUrl: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

// Update index to use productId instead of productName for uniqueness
AddToCartSchema.index({ username: 1, productId: 1 }, { unique: true });

// Force delete cached model in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.AddToCart;
}

export default mongoose.models.AddToCart || mongoose.model("AddToCart", AddToCartSchema);