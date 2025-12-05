import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    username: { 
      type: String, 
      required: true 
    },
    sellerUsername: { 
      type: String, 
      required: true 
    },
    productName: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    price: { 
      type: String, 
      required: true 
    },
    idUrl: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      default: 1, 
      min: 1 
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ready_to_ship", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    totalAmount: {
      type: Number,
      required: true
    },
    shippingAddress: {
      type: String
    },
    contactNumber: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster queries
OrderSchema.index({ sellerUsername: 1, status: 1 });
OrderSchema.index({ username: 1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);