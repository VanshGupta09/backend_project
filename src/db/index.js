import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB connected ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("connection error: " + error);
        //running process will be exit
        process.exit(1);
    }
}

export default connectDB;