import mongoose, { Schema } from "mongoose";

const AddToCartSchema = new Schema(
  {
    username: { type: String, required: true },
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    idUrl: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

AddToCartSchema.index({ username: 1, productName: 1 }, { unique: true });

export default mongoose.models.AddToCart || mongoose.model("AddToCart", AddToCartSchema);