import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import crypto from "crypto";

// import razorpay from "../utils/razorpay.js";

import { checkRetailerSession, checkUserBlocked } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * CREATE ORDER FROM CART
 */
router.post("/createOrder", checkUserBlocked, async (req, res) => {

  try {
    const userId = req.session.userId;
    console.log("UserId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const cartItems = await Cart.find({ userId }).populate("productId", "userId"); // fetches just the userId with productId from cart product;

    console.log("Cart items:", cartItems);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const retailerId = cartItems[0].productId.userId.toString();
    console.log("RetailerId:", retailerId);

    const isSameRetailer = cartItems.every( item => item.productId.userId.toString() === retailerId);

    console.log("Same retailer:", isSameRetailer);

    let totalAmount = 0;

    const items = cartItems.map(item => {
      totalAmount += item.productPrice * item.quantity;
      return {
        productId: item.productId._id,
        productName: item.productName,
        imageUrl: item.imageUrl,
        price: item.productPrice,
        quantity: item.quantity
      };
    });

    console.log("Order items:", items);
    console.log("Total:", totalAmount);

    const user = await User.findById(userId);
    console.log("User:", user);

    const order = await Order.create({
      userId,
      retailerId,
      items,
      totalAmount,
      deliveryAddress: user.address,
      payment: { status: "PENDING" }
    });

    console.log("Order created:", order._id);

    res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
      totalAmount
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});




router.post("/confirmOrder",checkUserBlocked, async (req, res) => { //CONFIRM ORDER (PAYMENT SUCCESS)
  try {
    const { orderId, paymentId, gateway } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment details
    order.payment.status = "PAID";
    order.payment.paymentId = paymentId;
    order.payment.gateway = gateway;
    order.orderStatus = "CONFIRMED";

    await order.save();

    await Cart.deleteMany({ userId: order.userId });

    res.json({ message: "Order confirmed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Order confirmation failed" });
  }
});




router.get("/order/:orderId", async (req, res) => { //route for order_summary page
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.session.userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});




router.post("/createPaymentOrder", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.session.userId
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const paymentOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100, // paise
      currency: "INR",
      receipt: order._id.toString()
    });

    res.json({
      razorpayOrderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment order failed" });
  }
});



// router.post("/verifyPayment", async (req, res) => {
//   try {
//     const {
//       orderId,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ message: "Invalid payment signature" });
//     }

//     // ✅ Payment verified → confirm order
//     const order = await Order.findById(orderId);

//     order.payment.status = "PAID";
//     order.payment.paymentId = razorpay_payment_id;
//     order.orderStatus = "CONFIRMED";

//     await order.save();

//     await Cart.deleteMany({ userId: order.userId });

//     res.json({ message: "Payment successful, order confirmed" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Payment verification failed" });
//   }
// });






















router.post("/mockPayment", async (req, res) => {
  try {
    if (!req.session.userId || req.session.role !== "user") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.session.userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payment.status = "PAID";
    order.payment.gateway = "MOCK";
    order.payment.paymentId = `MOCK_${Date.now()}`;
    order.orderStatus = "CONFIRMED";

    await order.save();
    await Cart.deleteMany({ userId: order.userId });

    res.json({ message: "Mock payment successful" });
  } catch (err) {
    res.status(500).json({ message: "Mock payment failed" });
  }
});





router.get("/myOrders", checkUserBlocked, async (req, res) => { //returns user_ORDERS
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    console.error("Fetch myOrders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});



export default router;
