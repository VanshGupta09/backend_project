import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//app.use is used for middlewares and configrations
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
));

//middleware
app.use(express.json({ limit: "16kb" }))
//encoding url
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
//making asset for public data
app.use(express.static("public"))
// to perform curd operation on user's cookie
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"

app.get("/", (req, res) => {
    res.status(200).send("working")
})

//routes declaration
app.use("/api/v1/users", userRouter);

export default app;