import mongoose, { Schema } from "mongoose";

const AddProductSchema = new Schema(
  {
    productId: { 
      type: String, 
      required: true, 
      unique: true
    },
    sellerUsername: { type: String, required: true }, 
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    idUrl: { type: String, required: true },
  },
  { timestamps: true }
);

AddProductSchema.index({ sellerUsername: 1, productName: 1 }, { unique: true });
AddProductSchema.index({ productId: 1 }, { unique: true });

// Force delete cached model in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.AddProduct;
}

export default mongoose.models.AddProduct || mongoose.model("AddProduct", AddProductSchema);