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
// BODY PARSERS
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const allowedOrigins = [
  "http://localhost:3000",
  "https://nearmart-frontend-seven.vercel.app",
  "https://nearmart-frontend-520xhror7-aaditya-bansals-projects-7fa0391f.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);


app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(" MongoDB connected");


    const SESSION_HOURS = 8;

    app.set("trust proxy", 1); //  REQUIRED FOR RENDER

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
          secure: true,     //  MUST be true on Render
          sameSite: "none", //  REQUIRED for Vercel
          maxAge: 1000 * 60 * 60 * SESSION_HOURS
        }
      })
    );


    app.use("/", authRoutes);
    app.use("/", productRoutes);
    app.use("/", cartRoutes);
    app.use("/", orderRoutes);
    app.use("/", adminRoutes);
    app.use("/", retailerRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

startServer();
