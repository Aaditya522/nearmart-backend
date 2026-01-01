import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { checkAdminSession } from "../middleware/authMiddleware.js";


const router = express.Router();


router.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();

    // if (users && users.length > 0) {
    //   await User.deleteMany({ status: "rejected" }); //delete the REJECTED USERS
    // }

    res.json(users);
    
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/block_unblock",checkAdminSession, async (req, res) => {
  try {
    const { userid } = req.body;

    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.block = !user.block;
    await user.save();

    res.json({ message: "User status updated" });

  } catch (err) {
    console.error("Block/unblock error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/api/pendingRetailers", async (req, res) => {
  try {
    const retailers = await User.find({
      role: "retailer",
      status: "pending"
    });

    res.json(retailers);

  } catch (err) {
    console.error("Pending retailers error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




router.post("/api/approveRetailer",checkAdminSession, async (req, res) => {
  try {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      status: "approved"
    });

    res.json({ message: "Approved" });

  } catch (err) {
    console.error("Approve retailer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




router.post("/api/rejectRetailer",checkAdminSession, async (req, res) => {
  try {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      status: "rejected"
    });

    res.json({ message: "Rejected" });

  } catch (err) {
    console.error("Reject retailer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// ADMIN – get all orders
router.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("retailerId", "name email shopName")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Admin orders fetch error:", err);
    res.status(500).json({
      message: "Failed to fetch orders"
    });
  }
});



router.post("/api/admin/updateOrderStatus",checkAdminSession, async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const allowedStatuses = ["PLACED", "CONFIRMED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    console.error("Admin order update error:", err);
    res.status(500).json({
      message: "Failed to update order status"
    });
  }
});

export default router;
