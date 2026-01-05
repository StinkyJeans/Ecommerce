import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    username: { type: String, required: true }, // buyer
    sellerUsername: { type: String, required: true }, // seller
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "pending" } 
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
