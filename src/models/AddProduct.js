import mongoose from "mongoose";

const AddProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    idUrl: { type: String, required: true }, // the uploaded ID image URL

  },
  { timestamps: true }
);

export default mongoose.models.AddProduct || mongoose.model("AddProduct", AddProductSchema);

