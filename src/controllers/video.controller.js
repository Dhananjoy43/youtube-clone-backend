import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, extractPublicId, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    // Execute the aggregation pipeline
    const videos = query
        ? await Video.aggregate([
            {
                $match: {
                    $and: [
                        { owner: new mongoose.Types.ObjectId(userId) },
                        { isPublished: true },
                        {
                            $or: [
                                { title: { $regex: query, $options: 'i' } },
                                { description: { $regex: query, $options: 'i' } }
                            ]
                        }
                    ]
                }
            },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            { $sort: { [sortBy]: sortType === "ase" ? 1 : -1 } }
        ])
        : await Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId), isPublished: true } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            { $sort: { [sortBy]: sortType === "ase" ? 1 : -1 } }
        ]);

    return res.status(200).json(new ApiResponse(200, videos, "Successfully fetched Videos"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Check if title or description is empty
    if (!(title && description)) {
        throw new ApiError(400, 'Please provide a valid title and description')
    }

    const user = await User.findById(req.user?._id);
    // get video
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(422, 'No video was uploaded!');
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(422, 'No thumbnail was uploaded!');
    }

    // upload to cloudinary
    const video = await uploadOnCloudinary(videoFileLocalPath, "videos");
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

    if (!video.secure_url) {
        throw new ApiError(500, `Failed to upload the video!`);
    }
    if (!thumbnail.secure_url) {
        throw new ApiError(500, `Failed to upload the thumbnail!`);
    }

    // create video object with data
    const uploadedVideo = await Video.create({
        title,
        description,
        videoFile: video.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: video.duration,
        owner: user._id
    });

    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video!");
    }

    return res.status(201).json(new ApiResponse(201, uploadedVideo, "Video uploaded successfully!"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //get video by id
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "The requested video does not exist.");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully!"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, isPublic } = req.body;

    const thumbnailLocalPath = req.file?.path;
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

    if (!thumbnail.secure_url) {
        throw new ApiError(500, 'Thumbnail could not be uploaded on Cloudinary');
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "The video you are trying to update does not exist.")
    }
    const prevThumbnailPublicId = extractPublicId(video.thumbnail);

    //TODO: update video details like title, description, thumbnail
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        isPublic,
        thumbnail: thumbnail.secure_url
    }, { new: true })  //return updated document instead of original one

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video");
    }

    //delete previous image from cloudinary
    const detetedResult = await deleteFromCloudinary(prevThumbnailPublicId, "image");

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video has been updated"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        throw new ApiError(404, "The video you are trying to delete does not exist.")
    }

    const prevVideoPublicId = extractPublicId(video.videoFile);
    const prevThumbnailPublicId = extractPublicId(video.thumbnail);
    const detetedVideo = await deleteFromCloudinary(prevVideoPublicId, "video");
    const detetedThumbnail = await deleteFromCloudinary(prevThumbnailPublicId, "image");

    return res.status(200).json(new ApiResponse(200, null, "Video has been deleted."))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "The video you want to publish/unpublish is not available")
    }

    video.isPublished = !video.isPublished;
    await video.save();
    return res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? 'published' : 'unpublished'} Successfully`));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
