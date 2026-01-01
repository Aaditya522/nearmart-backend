import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import mongoose from "mongoose";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

// =======================
// BASIC MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// CORS (DEV + PROD)
// =======================
// app.use(
//   cors({
//     origin: [
//       true,          // local React
//       "https://your-frontend.vercel.app" // Vercel/Netlify frontend
//     ],
//     credentials: true
//   })


app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://nearmart-frontend-seven.vercel.app"
  ],
  credentials: true
}));

// =======================
// STATIC FILES
// =======================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// =======================
// DATABASE CONNECTION
// =======================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // =======================
    // SESSION CONFIG
    // =======================
    const SESSION_HOURS = 8;

    app.use(
      session({
        name: "nearmart.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: MONGO_URI,
          collectionName: "sessions",
          ttl: 60 * 60 * SESSION_HOURS
        }),
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 1000 * 60 * 60 * SESSION_HOURS
        }
      })
    );

    // =======================
    // ROUTES
    // =======================
    app.use("/", authRoutes);
    app.use("/", productRoutes);
    app.use("/", cartRoutes);
    app.use("/", orderRoutes);
    app.use("/", adminRoutes);
    app.use("/", retailerRoutes);

    // =======================
    // START SERVER
    // =======================
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

startServer();
