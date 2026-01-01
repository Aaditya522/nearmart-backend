import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Customer
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // Retailer (important for retailer dashboard)
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: String,
        imageUrl: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    payment: {
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
      paymentId: String,
      gateway: String,
    },

    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "CANCELLED"],
      default: "PLACED",
    },

    deliveryAddress: {
      at: String,
      city: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("orders", orderSchema);
