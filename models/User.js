import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        pass: { type: String, required: true },

        role: {
            type: String,
            enum: ["user", "retailer"],
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved"
        },

        block: { type: Boolean, default: false },

        address: {
            at: String,
            city: String,
            pincode: { type: String, required: true }
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },

        // Retailer-only
        shopName: {
            type: String,
            required: function () {
                return this.role === "retailer";
            }
        },

        productType: {
            type: String,
            required: function () {
                return this.role === "retailer";
            }
        },

        shopImage: {
            type: String, // filename
            required: function () {
                return this.role === "retailer";
            }
        },

        serviceablePincodes: {
            type: [String],
            default: [],
            validate: {
                validator: function (pins) {
                    if (this.role !== "retailer") return true;
                    return pins.length >= 2 && pins.length <= 6 &&
                        !pins.includes(this.address.pincode);
                },
                message: "Retailers must have 2–6 serviceable pincodes excluding shop pincode"
            }
        }
    },
    { timestamps: true }
);


export default mongoose.model("users", userSchema);
