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

/* TRUST PROXY (RENDER) */
app.set("trust proxy", 1);

/* BODY PARSERS */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* CORS */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://nearmart-frontend-seven.vercel.app",
    ],
    credentials: true,
  })
);

/* STATIC */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* DB */
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb+srv://Aaditya522:aaditya123@cluster0.nprlzh9.mongodb.net/';

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const SESSION_HOURS = 8;

    app.use(
      session({
        name: "nearmart.sid",
        secret: "Mock_secret_key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: MONGO_URI,
          collectionName: "sessions",
        }),
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * SESSION_HOURS,
        },
      })
    );

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




// import dotenv from "dotenv";
// dotenv.config(); 

// import express from "express";
// import path from "path";
// import session from "express-session";
// import MongoStore from "connect-mongo";
// import cors from "cors";
// import mongoose from "mongoose";

// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import productRoutes from "./routes/productRoutes.js";
// import cartRoutes from "./routes/cartRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import retailerRoutes from "./routes/retailerRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// const MONGO_URI = "mongodb://127.0.0.1:27017/econ";

// const startServer = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("MongoDB connected");

//     const SESSION_HOURS = 8;

//     app.use(session({
//       name: "nearmart.sid",
//       secret: "MY_SECRET_KEY",
//       resave: false,
//       saveUninitialized: false,
//       store: MongoStore.create({
//         mongoUrl: MONGO_URI,
//         collectionName: "sessions",
//         ttl: 60 * 60 * SESSION_HOURS
//       }),
//       cookie: {
//         httpOnly: true,
//         secure: false,
//         sameSite: "lax",
//         maxAge: 1000 * 60 * 60 * SESSION_HOURS
//       }
//     }));


//     app.use("/", authRoutes);
//     app.use("/", productRoutes);
//     app.use("/", cartRoutes);
//     app.use("/", orderRoutes);
//     app.use("/", adminRoutes);
//     app.use("/", retailerRoutes);


//     app.listen(5000, () => {
//       console.log("Server running on http://localhost:5000");
//     });

//   } catch (err) {
//     console.error(" MongoDB connection failed:", err);
//     process.exit(1);
//   }
// };

// startServer();
