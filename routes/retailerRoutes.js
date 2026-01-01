import express from "express";
import User from "../models/User.js"; // adjust path if needed
import Order from "../models/Order.js";
import { checkRetailerSession, checkUserBlocked } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/nearbyretailers",checkUserBlocked, async (req, res) => {
  try {
  
    if (!req.session.userId) {
      return res.status(401).json({ error: "User not logged in" });
    }

    const loggedUser = await User.findById(req.session.userId);

    if (!loggedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userPincode = loggedUser.address.pincode;

    const retailers = await User.find({
      role: "retailer",
      status: "approved",
      block: false,
      $or: [
        { serviceablePincodes: userPincode },
        { "address.pincode": userPincode }
      ]
    });

    res.json(retailers);

  } catch (err) {
    console.error("Nearby retailers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/retailerDetails/:retailerId",checkUserBlocked, async (req, res) => {
  try {
    const { retailerId } = req.params;

    const retailer = await User.findOne({ 
      _id: retailerId,
      role: "retailer",
      status: "approved",
      block: false
    }).select("-pass");

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    res.json(retailer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/retailerOrders", checkRetailerSession, async (req, res) => { // GET ORDERS FOR RETAILER
  try {
    const retailerId = req.session.userId;

    if (!retailerId) {
      return res.status(401).json({ message: "Login required" });
    }

    const orders = await Order.find({ retailerId })
      .populate("userId", "name email address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

export default router;
