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

// --- HARDCODED CONFIGURATION FOR DEPLOYMENT ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = "mongodb+srv://aaditya_db:aaditya2246@cluster0.jlajnyc.mongodb.net/test?retryWrites=true&w=majority";
const CLIENT_URL = "https://nearmart-frontend-twgi.onrender.com";
const SESSION_SECRET = "nearmart_super_secret_123"; 
const NODE_ENV = "production"; 

/* REQUIRED FOR RENDER (Allows secure cookies over proxy) */
app.set("trust proxy", 1);

/* ---------------- BASIC MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

/* ---------------- SESSION SETUP ---------------- */
// Session must be defined BEFORE routes
const SESSION_HOURS = 8;
app.use(
  session({
    name: "nearmart.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * SESSION_HOURS,
    }),
    cookie: {
      httpOnly: true,
      secure: true, // Forced true for Render HTTPS
      sameSite: "none", // Required for cross-domain cookies
      maxAge: 1000 * 60 * 60 * SESSION_HOURS,
    },
  })
);

/* ---------------- STATIC FILES ---------------- */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ---------------- ROUTES ---------------- */
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", cartRoutes);
app.use("/", orderRoutes);
app.use("/", adminRoutes);
app.use("/", retailerRoutes);

/* ---------------- START SERVER ---------------- */
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS allowed for: ${CLIENT_URL}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

startServer();