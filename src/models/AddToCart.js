import mongoose, { Schema } from "mongoose";

const AddToCartSchema = new Schema(
  {
    username: { type: String, required: true }, // Added username field
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    idUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can't add the same product twice
AddToCartSchema.index({ username: 1, productName: 1 }, { unique: true });

export default mongoose.models.AddToCart ||
  mongoose.model("AddToCart", AddToCartSchema);