import mongoose from "mongoose";

const SellerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    idUrl: { type: String, required: true }, // the uploaded ID image URL
    role: { type: String, default: "seller" },
  },
  { timestamps: true }
);

export default mongoose.models.Seller || mongoose.model("Seller", SellerSchema);
