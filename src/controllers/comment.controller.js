import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    // Add a comment to a video
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    if (!comment) {
        throw new ApiError(404, 'Failed to create the comment');
    }
    return res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    // Update a comment
    const newComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });

    if (!newComment) {
        throw new ApiError(404, 'The comment does not exist')
    }

    return res.status(200).json(new ApiResponse(200, newComment, "Comment updated Successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    // Delete a comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
        throw new ApiError(404, 'This comment does not exist!');
    }
    return res.status(200).json(new ApiResponse(200, null, "Comment deleted Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
