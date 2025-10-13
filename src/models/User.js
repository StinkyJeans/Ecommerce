import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "seller", "admin"], default: "user" },
  email: { type: String },
  contact: { type: String },
  idUrl: { type: String },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
