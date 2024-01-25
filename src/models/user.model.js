import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,// Cloudinary url
        required: true
    },
    coverImage: {
        type: String// Cloudinary url
    },
    passward: {
        type: String,
        required: [true, "Passward is required"]
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"

    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })

//Middleware (when passward will change the it will be bcrypted) 
userSchema.pre("save", async function (next) {
    if (this.isModified("passward")) {
        this.passward = await bcrypt.hash(this.passward, 10);
        next();
    } else {
        next();
    }
})

// creating middleware to compare passward with bcrypted passward
userSchema.methods.isPasswardCorrect = async function (passward) {
    return await bcrypt.compare(passward, this.passward);
}

//creating middleware for access token
userSchema.methods.generateAccessToken = function () {
    //sign mehtod is used to generate tokens
    return jwt.sign({
        //fullname(name in payload) this.fullname(name from database)
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullName
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
}

export const User = mongoose.model("User", userSchema);