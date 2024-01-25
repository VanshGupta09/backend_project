import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });
          
cloudinary.config({ 
  cloud_name: 'dvfkhelsx', 
  api_key: '519188859494886', 
  api_secret: 'lv9zrjEwonc_A5jsB8EZiyNJd28' 
});

// function for uploading file from local server to cloudinary
const uplpadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) {
            return null
        }
        //uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file sucessfully uploaded on cloudinary
        // console.log("file sucessfully uploaded on cloudinary " + response.url);
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        fs.unlink(localFilePath);//removing file from localy saved temprorary file as the file upload operation got failed
        return null
    }
}

export {uplpadOnCloudinary}   