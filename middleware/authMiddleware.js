import mongoose from "mongoose";
import User from "../models/User.js";


const checkAdminSession = (req, res, next) => {
  try {
    // 🔒 not logged in
    if (!req.session?.userId) {
      return res.status(401).json({
        message: "Not Verified! First Login"
      });
    }

    // 🚫 not admin
    if (req.session.role !== "admin") {
      return res.status(403).json({
        message: "Not Authorized! Only Admin can access."
      });
    }

    next();
  } catch (error) {
    console.error("Admin session check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const checkRetailerSession = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  if (req.session.role !== "retailer") {
    return res.status(403).json({ message: "Retailer access only" });
  }

  next();
};


const checkUserBlocked = async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.block) {
      return res.status(403).json({
        message: "You are Blocked by Admin!"
      });
    }

    next();
  } catch (error) {
    console.error("User block check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export { checkRetailerSession, checkUserBlocked ,checkAdminSession};