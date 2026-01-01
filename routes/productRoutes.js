import express from "express";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { checkRetailerSession, checkUserBlocked } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/products", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json([]);
    }

    const loggedUser = await User.findById(req.session.userId);
    if (!loggedUser) {
      return res.status(404).json([]);
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
    }).select("_id");

    if (retailers.length === 0) {
      return res.json([]);
    }

    const retailerIds = retailers.map(r => r._id);

    const products = await Product.find({
      userId: { $in: retailerIds }
    });

    res.json(products);

  } catch (err) {
    console.error("Products fetch error:", err);
    res.status(500).json([]);
  }
});




router.get("/products/search", async (req, res) => { //search product
  try {
    // 1. Ensure user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(401).json([]);
    }

    const { query } = req.query;

    // 2. Get logged-in user & pincode
    const loggedUser = await User.findById(req.session.userId);
    if (!loggedUser || !loggedUser.address?.pincode) {
      return res.json([]);
    }

    const userPincode = loggedUser.address.pincode;

    // 3. Find nearby approved retailers
    const retailers = await User.find({
      role: "retailer",
      status: "approved",
      block: false,
      $or: [
        { serviceablePincodes: userPincode },
        { "address.pincode": userPincode }
      ]
    }).select("_id");

    if (retailers.length === 0) {
      return res.json([]);
    }

    const retailerIds = retailers.map(r => r._id);

    // 4. Find products from nearby retailers matching search
    const products = await Product.find({
      userId: { $in: retailerIds },
      $or: [
        { productName: { $regex: query || "", $options: "i" } },
        { category: { $regex: query || "", $options: "i" } }
      ]
    });

    res.json(products);

  } catch (err) {
    console.error("Nearby product search error:", err);
    res.status(500).json([]);
  }
});


router.get("/filteredproducts/:retailerId", async (req, res) => {
  try {
    const { retailerId } = req.params;

    const products = await Product.find({
      userId: retailerId
    });

    res.json(products);
  } catch (err) {
    console.error("Retailer products error:", err);
    res.status(500).json([]);
  }
});



router.get("/retailerProducts", async(req, res) => { //RETAILER-Products
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    if (req.session.role !== "retailer") {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const products = await Product.find({
      userId: req.session.userId
    });

    res.status(200).json(products);

  } catch (err) {
    console.error("Retailer products error:", err);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});


router.delete("/deleteProduct/:id",checkUserBlocked,checkRetailerSession, async (req, res) => { //DELETE PRODUCT
  try {

    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    if (req.session.role !== "retailer") {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const productId = req.params.id;

    const product = await Product.findOne({
      _id: productId,
      userId: req.session.userId
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found or not authorized"
      });
    }

    await Product.deleteOne({ _id: productId });

    res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});


router.post("/update_product/:id", checkUserBlocked, checkRetailerSession, async (req, res) => {
  
    try {
      const { price, quantity } = req.body;

      if (price < 0 || quantity < 0) {
        return res.status(400).json({
          message: "Price and quantity must be positive values"
        });
      }

      const updated = await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.session.userId // ownership check
        },
        {
          $set: {
            price,
            quantity
          }
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          message: "Product not found or not authorized"
        });
      }

      res.json({
        success: true,
        message: "Product updated successfully",
        product: updated
      });

    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({
        message: "Product update failed"
      });
    }
  }
);


// router.get("/productDetail/:_id", async (req, res) => { //Find PRODUCT with Id
//   try {

//     const productId = req.params._id;
//     console.log(productId);
//     const product = await Product.findOne({_id: productId});

//     console.log(product);

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found."
//       });
//     }

//     const retailer = await User.findOne({_id : product.userId});
    
//     res.json({ product, retailer });
  
//   } catch (err) {
//     console.error("Find-Product error:", err);
//     res.status(500).json({
//       message: "Internal server error"
//     });
//   }
// });


router.get("/productDetail/:productId", async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const retailer = await User.findById(product.userId);
  res.json({ product, retailer });
});


router.post("/addNewProduct",checkUserBlocked, checkRetailerSession, async (req, res) => {
  try {
    const { productName, price, category, imageUrl, description ,quantity} = req.body;

    if (!productName || !price || !category || !imageUrl || !description || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newProduct = new Product({
      userId: req.session.userId,
      productName,
      price,
      category,
      imageUrl,
      description,
      quantity
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product added successfully",
      product: newProduct
    });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



export default router;
