import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
productId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product"   // MUST MATCH mongoose.model("Product", ...)
},
  imageUrl: String,
  productName: String,
  productPrice: Number,
  quantity: {
    type: Number,
    default: 1
  }
}, { timestamps: true });


export default mongoose.model("Cart", cartSchema);
