import { Router } from "express";
import { changeCurrentPassward, currentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// url will be https://localhost:8000/api/v1/users/register
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);// verifyJWT will verify the user
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassward);
router.route("/current-user").get(verifyJWT,currentUser);
router.route("/update-account").patch(verifyJWT,updateAccountDetails);
router.route("update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("update-coverimg").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);
router.route("/watch-history").get(verifyJWT,getWatchHistory);

export default router;