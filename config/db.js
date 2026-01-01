import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/econ");
        console.log("MongoDB connected (Mongoose)");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

export default connectDB;
