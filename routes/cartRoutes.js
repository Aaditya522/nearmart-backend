import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

import { checkRetailerSession, checkUserBlocked } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/cart", checkUserBlocked, async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    if (req.session.role !== "user") {
      return res.status(403).json({
        role: req.session.role,
        message: "Not authorized, Only Customers Have Cart!"
      });
    }

    const products = await Cart.find({ userId: req.session.userId });

    if (!products || products.length === 0) {
      return res.status(200).json({
        products: [],
        message: "Your Cart is Empty!"
      });
    }

    const retailerId = products[0].retailerId;

    const retailer = await User.findById(retailerId).select("shopName");

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    return res.status(200).json({ retailerName: retailer.shopName, products });

  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/addCart", checkUserBlocked, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    if (req.session.role !== "user") {
      return res.status(401).json({ message: "Not authorized, Only Customers Have Cart!"});
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const retailerId = product.userId;

    const existingCartItem = await Cart.findOne({
      userId: req.session.userId
    });

    if (
      existingCartItem &&
      existingCartItem.retailerId &&
      existingCartItem.retailerId.toString() !== retailerId.toString()
    ) {
      return res.status(400).json({ message: "You can add products from only one retailer at a time" });
    }

    const existing = await Cart.findOne({ userId: req.session.userId, productId});

    if (existing) {
      existing.quantity += 1;
      await existing.save();
      return res.json({ message: "Cart quantity updated" });
    }

    await Cart.create({
      userId: req.session.userId,
      retailerId,
      productId,
      imageUrl: product.imageUrl,
      productName: product.productName,
      productPrice: product.price,
      quantity: 1
    });

    res.json({ message: "Added to cart" });

  } catch (err) {
    console.error("Add cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.put("/update-quantity", checkUserBlocked, async (req, res) => {
  try {
    const { cartId, quantity } = req.body;

    if (!cartId || quantity < 1) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Find cart item
    const cartItem = await Cart.findById(cartId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Find product stock
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Cap quantity to available stock
    let finalQuantity = quantity;
    if (quantity > product.quantity) {
      finalQuantity = product.quantity;
    }

    cartItem.quantity = finalQuantity;
    await cartItem.save();

    return res.status(200).json({
      quantity: finalQuantity,
      availableStock: product.quantity
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});



router.delete("/removeProduct", checkUserBlocked, async (req, res) => {
  try {
    const { cartItemId } = req.body;

    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    if (req.session.role !== "user") {
      return res.status(403).json({
        message: "Not authorized, Only Customers Have Cart!"
      });
    }

    const removedItem = await Cart.findOneAndDelete({ _id: cartItemId,userId: req.session.userId });

    if (!removedItem) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      message: "Item removed from cart",
    });

  } catch (error) {
    console.error("Remove cart error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});


export default router;