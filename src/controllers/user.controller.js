import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uplpadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generaring refresh and acsess token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from backend
    // validate user deatils (if empty)
    // check if username and email already exists
    // check if avatar image is uploaded by user
    // check if avatar is uploaded to cloudinary  
    // create user object in db
    // remove passward and refresh token from response
    // check for user creation
    // return response

    // body is used when data is coming from json or form
    const { fullName, username, email, passward } = req.body;
    // console.log("email: " + email);

    if (
        // some function will return ture if any field in the array will empty
        ["username", "fullName", "username", "email"].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        // it will return true if username or email will already exist
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // files access is given by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImgLocalPath = req.files?.coverImage[0]?.path;
    // console.log(req.files);
    let coverImgLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImgLocalPath = req.files?.coverImage[0]?.path;
    } else {
        coverImgLocalPath = "";
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // console.log("Path " + avatar);
    const avatar = await uplpadOnCloudinary(avatarLocalPath);
    const coverImg = await uplpadOnCloudinary(coverImgLocalPath);

    if (!avatar) {
        throw new ApiError(409, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        passward,
        avatar: avatar.url,
        coverImage: coverImg?.url || ""
    })

    // finding if data from user is stored in db or not. And removing passward and refresh token
    // _id field is created while storing data in db
    const createdUser = await User.findById(user._id).select(
        "-passward -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // take data from req body
    // username or email
    // find the user
    // check passward
    // access and refresh token
    // send cookie

    const { username, email, passward } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or passward is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const isPasswardValid = user.isPasswardCorrect(passward);

    if (!isPasswardValid) {
        throw new ApiError(401, "Invalid passward");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select(
        "-passward -refreshToken"
    )
    const options = {
        // cookies will be only modified by server
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { loggedInUser, accessToken, refreshToken },
                "User logged In successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        },
        // $unset:{
        //     refreshAccessToken:1
        // }
    }, {
        new: true
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    try {
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorised request")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Refresh token exipred or used");
        }

        const options = {
            https: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken)
            .cookie("newRefreshToken", newRefreshToken)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token");
    }
})

const changeCurrentPassward = asyncHandler(async (req, res) => {
    const { oldPassward, newPassward } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswardCorrect = await user.isPasswardCorrect(oldPassward);

    if (!isPasswardCorrect) {
        throw new ApiError(400, "invalid passward");
    }

    user.passward = newPassward;

    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Passward changed successfully")
        )
})

const currentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName || email)) {
        throw new ApiError(400, "All feilds are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName: fullName,
            email: email
        }
    },
        // information after updation
        { new: true }).select("-passward");

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Accounts details updated successfully")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uplpadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }).select("-passward")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    const oldCoverImage = req.user?.coverImage;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing")
    }

    const coverImage = await uplpadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(201, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }).select("-passward")

    if (!oldCoverImage === "") {
        try {
            const isOldImageDelete = await deleteOldFileInCloudinary(oldCoverImage);
            console.log("isOldImageDelete ", isOldImageDelete);
        } catch (error) {
            console.log("error - ", error);
        }
    }

    return res.status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    // req.params is used for data coming from url
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    // aggregate function is used to filter the data with the help of multiple pipelines
    const channel = await User.aggregate([
        {
            // match is used to find document where username is same
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // lookup is used to replace the data value with (object in array) with the matched data value (also called left join)
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannels"
            }
        },
        {
            // addFields is used to add feilds in documents
            $addFields: {
                subcribersCount: {
                    $size: "$subscribers"
                },
                subscribedChannelsCount: {
                    $size: "$subscribedChannels"
                },
                isSubscribed: {
                    // cond is used to apply condition
                    $cond: {
                        // $in is used to find data in the given object or array
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // $project is used to filter selected feilds
            $project: {
                username: 1,
                fullName: 1,
                subcribersCount: 1,
                subscribedChannelsCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, channel, "User channel successfully fetched")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                // to convert id string into id and compare it with id
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        }, {
            // nested lookup
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            // to exchange first object of array with array
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "User history fetched successfully")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassward,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}