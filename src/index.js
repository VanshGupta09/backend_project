import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js"
-
// import mongoose from "mongoose";
// import { DB_NAME } from "./constant";
// require('dotenv').config({ path: './env' });

dotenv.config({ path: './.env' });
connectDB()
.then(
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server running at http://localhost:${process.env.PORT}`);
        app.on("error", (erorr) => {
            console.log(erorr);
        })
    })
)
.catch((erorr) => {
    console.log(erorr);
})


/*
// first way of connecting with database
import { express } from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("erroer", (error) => {
            console.log("erorr: " + error);
            throw error;
        })

    } catch (error) {
        console.log("Error: " + error);
        throw error
    }
})()*/