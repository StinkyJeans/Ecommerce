import mongoose, { Schema } from "mongoose";

const AddToCartSchema = new Schema(
  {
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    idUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AddToCart ||
  mongoose.model("AddToCart", AddToCartSchema);
