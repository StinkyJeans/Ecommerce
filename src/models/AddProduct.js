import mongoose, {Schema} from "mongoose";

const AddProductSchema = new Schema(
  {
    username: { type: String, required: true }, 
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    idUrl: { type: String, required: true },
  },
  { timestamps: true }
);

AddProductSchema.index({ username: 1, productName: 1 }, { unique: true });

export default mongoose.models.AddProduct || mongoose.model("AddProduct", AddProductSchema);