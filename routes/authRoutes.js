import express from "express";
import User from "../models/User.js";
import uploadShopImage from "../middleware/uploadShopImage.js";

import { checkRetailerSession, checkUserBlocked } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {

  if (req.session?.userId) {
    console.log(req.session.role);
    return res.status(409).json({
      message: "You are already logged in, first logout existing account"
    });
  }

  const { email, pass } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.role === "retailer") {
      if (user.status === "pending")
        return res.status(403).json({ message: "Waiting for admin approval" });
      if (user.status === "rejected")
        return res.status(403).json({ message: "Account rejected" });
    }

    if (user.block)
      return res.status(403).json({ message: "User blocked by admin" });

    if (user.pass !== pass)
      return res.status(401).json({ message: "Wrong password" });

    req.session.userId = user._id.toString();
    req.session.role = user.role;

    res.json({ message: "Login successful", role: user.role });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   SIGNUP
========================= */
router.post("/signup", uploadShopImage.single("shopImage"), async (req, res) => {

  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const {
      email,
      name,
      pass,
      role,
      address,
      city,
      pincode,
      phone,
      shopName,
      productType,
      serviceablePincodes
    } = req.body;

    if (!email || !pass || !role) {
      return res.status(400).send("Missing required fields");
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send("User already exists");

    const userData = {
      email,
      name,
      pass,
      role,
      status: role === "retailer" ? "pending" : "approved",
      block: false,
      address: { at: address, city, pincode },
      phone,
    };

    if (role === "retailer") {
      if (!req.file) {
        return res.status(400).send("Shop image required");
      }

      let pins = [];
      if (typeof serviceablePincodes === "string") {
        pins = JSON.parse(serviceablePincodes);
      }

      const uniquePins = [...new Set(pins)].filter(
        pin => pin !== pincode
      );

      if (uniquePins.length < 2 || uniquePins.length > 6) {
        return res
          .status(400)
          .send("Serviceable pincodes must be 2–6");
      }

      userData.shopName = shopName;
      userData.productType = productType;
      userData.serviceablePincodes = uniquePins;
      userData.shopImage = req.file.filename;
    }

    await User.create(userData);
    res.send("Signup successful");

  } catch (err) {
    console.error("SIGNUP ERROR: ", err);
    res.status(500).send("Server error");
  }
}
);


/* =========================
   LOGOUT
========================= */
router.post("/logout", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  req.session.destroy(err => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("nearmart.sid");
    res.json({ message: "Logout successful" });
  });
});

/* =========================
   ME (SESSION CHECK)
========================= */
router.get("/me", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json({
    message: "User authenticated successfully",
    userId: req.session.userId,
    role: req.session.role
  });
});




router.get("/userDetails", async (req, res) => {
  try {

    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Please login to view profile details",
      });
    }

    const user = await User.findById(req.session.userId).select(
      "-pass -__v"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error("UserDetails Error:", error);
    res.status(500).json({
      message: "Server error while fetching user details",
    });
  }
});




router.put("/user/updateAddress",checkUserBlocked, async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { at, city, pincode } = req.body;

  if (!at || !city || !pincode) {
    return res.status(400).json({ message: "All address fields are required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      {
        address: { at, city, pincode }
      },
      { new: true }
    );

    res.json({
      message: "Address updated successfully",
      address: user.address
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update address" });
  }
});



export default router;
