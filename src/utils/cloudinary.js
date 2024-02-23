import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: `VideoTube/${folder}`
        })
        // file has been uploaded successfully
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId, fileType) => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.api.delete_resources(publicId, { type: 'upload', resource_type: fileType });
        if (response.deleted)
            return true
        else return false

    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
};

const extractPublicId = (cloudinaryUrl) => {
    // Check if the provided URL is a Cloudinary URL
    const cloudinaryPattern = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/(?:video|image)\/upload\/v\d+\/(.+?)\.\w+$/;
    const match = cloudinaryUrl.match(cloudinaryPattern);

    if (match && match.length === 2) {
        return match[1]; // Return the extracted public ID
    } else {
        console.error("Invalid Cloudinary URL:", cloudinaryUrl);
        return null; // Return null if the URL doesn't match the expected pattern
    }
}

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicId }