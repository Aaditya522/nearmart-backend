import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

/* BODY PARSERS */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* CORS */
const allowedOrigins = [
  "https://nearmart-frontend-seven.vercel.app",
  "https://nearmart-frontend-2ebf0x7gn-aaditya-bansals-projects-7fa0391f.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


/* STATIC */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* DB */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const SESSION_HOURS = 8;

    app.use(session({
      name: "nearmart.sid",
      secret: "MY_SECRET_KEY",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: "sessions",
        ttl: 60 * 60 * SESSION_HOURS
      }),
cookie: {
  httpOnly: true,
  secure: true,        // REQUIRED on HTTPS
  sameSite: "none",    // REQUIRED for cross-origin cookies
  maxAge: 1000 * 60 * 60 * SESSION_HOURS
}
    }));

    app.use("/", authRoutes);
    app.use("/", productRoutes);
    app.use("/", cartRoutes);
    app.use("/", orderRoutes);
    app.use("/", adminRoutes);
    app.use("/", retailerRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

startServer();