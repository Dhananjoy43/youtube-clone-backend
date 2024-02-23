import mongoose, { isValidObjectId } from "mongoose"
import { LikedComment, LikedComunityPost, LikedVideo } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { ComunityPost } from "../models/comunityPost.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, 'No Video ID provided');

    // Check if valid ObjectID format
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Invalid Video ID!');

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found!");

    //toggle like on video
    const likedVideo = await LikedVideo.findOne({ likedBy: req.user?._id, video: videoId });
    if (!likedVideo) {
        const newLikedVideo = await LikedVideo.create({
            video: videoId,
            likedBy: req.user?._id
        });

        if (!newLikedVideo) throw new ApiError(500, "Error while liking the video!");

        return res.status(200).json(new ApiResponse(200, newLikedVideo, "Successfully liked the video."));
    } else {
        const removeLike = await LikedVideo.deleteOne({ likedBy: req.user?._id, video: videoId });
        if (!removeLike) throw new ApiError(500, "Error while removing like from the video!");

        return res.status(200).json(new ApiResponse(200, null, "Successfully removed from the liked videos!"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId) throw new ApiError(400, 'No Comment ID provided');

    // Check if valid ObjectID format
    if (!isValidObjectId(commentId)) throw new ApiError(400, 'Invalid Comment ID!');

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found!");
    //toggle like on comment
    const likedComment = await LikedComment.findOne({ likedBy: req.user?._id, comment: commentId });
    if (!likedComment) {
        const newLikedComment = await LikedComment.create({
            likedBy: req.user?._id,
            comment: commentId
        });

        if (!newLikedComment) throw new ApiError(500, "Error while liking the comment!");

        return res.status(200).json(new ApiResponse(200, newLikedComment, "Successfully liked the comment."));
    } else {
        const removeLike = await LikedComment.deleteOne({ likedBy: req.user?._id, comment: commentId });
        if (!removeLike) throw new ApiError(500, "Error removing from the liked comments!");

        return res.status(200).json(new ApiResponse(200, null, "Successfully removed from the liked comments!"));
    }
})

const toggleComunityPostLike = asyncHandler(async (req, res) => {
    const { comunityPostId } = req.params;
    if (!comunityPostId) throw new ApiError(400, 'No comunity post id provided');

    // Check if valid ObjectID format
    if (!isValidObjectId(comunityPostId)) throw new ApiError(400, 'Invalid comunity post id!');

    const comunityPost = await ComunityPost.findById(comunityPostId);
    if (!comunityPost) throw new ApiError(404, "Comunity post not found!");

    const likedComunityPost = await LikedComunityPost.findOne({ likedBy: req.user?._id, comunityPost: comunityPostId });
    if (!likedComunityPost) {
        const newLikedComunityPost = await LikedComunityPost.create({
            likedBy: req.user?._id,
            comunityPost: comunityPostId
        });

        if (!newLikedComunityPost) throw new ApiError(500, "Error while liking the comunity post!");

        return res.status(200).json(new ApiResponse(200, newLikedComunityPost, "Successfully liked the comunity post."));
    } else {
        const removeLike = await LikedComunityPost.deleteOne({ likedBy: req.user?._id, comunityPost: comunityPostId });
        if (!removeLike) throw new ApiError(500, "Error removing from the liked comunity post!");

        return res.status(200).json(new ApiResponse(200, null, "Successfully removed from the liked comunity posts!"));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(404, "User id not found!");
    if (!isValidObjectId(userId)) throw new ApiError(400, 'Invalid User ID!');

    //Get all liked videos
    const likedVideos = await LikedVideo.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                video: 1,
            },
        },
        {
            $group: {
                _id: null,
                videos: { $push: "$video" }
            },
        },
        {
            $project: {
                _id: 0,
                videos: 1
            }
        }
    ])

    if (!likedVideos) throw new ApiError(404, "No liked video found.");
    return res.status(200).json(new ApiResponse(200, likedVideos, "Successfully fetched the list of liked videos."));
})

export {
    toggleCommentLike,
    toggleComunityPostLike,
    toggleVideoLike,
    getLikedVideos
}