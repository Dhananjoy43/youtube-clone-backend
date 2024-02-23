import { isValidObjectId } from "mongoose"
import { ComunityPost } from "../models/comunityPost.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createComunityPost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) throw new ApiError(400, 'Content field is required');

    //create comunity post
    const comunityPost = await ComunityPost.create({ content, owner: req.user._id });
    if (!comunityPost) { throw new ApiError(400, 'Cannot create the comunity post') };
    return res.status(201).json(new ApiResponse(201, comunityPost, "Comunity post created successfully!"));
})

const getUserComunityPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) throw new ApiError(400, 'User id parameter is missing');
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id!");
    }
    // Get user comunity posts
    const allComunityPosts = await ComunityPost.find({ owner: userId });
    return res.status(200).json(new ApiResponse(200, allComunityPosts, `Retrieved ${allComunityPosts.length} comunity post for this user`));
})

const updateComunityPost = asyncHandler(async (req, res) => {
    const { comunityPostId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(comunityPostId)) {
        throw new ApiError(400, "Invalid comunity post id!");
    }
    if (!content) throw new ApiError(400, "Content field can't be empty");
    // update comunity post
    const newComunityPost = await ComunityPost.findByIdAndUpdate(comunityPostId, { $set: { content } }, { new: true });

    if (!newComunityPost) {
        throw new ApiError(404, `No comunity post found with id ${comunityPostId}!`);
    }
    return res.status(200).json(new ApiResponse(200, newComunityPost, "Comunity post updated successfully!"));
})

const deleteComunityPost = asyncHandler(async (req, res) => {
    const { comunityPostId } = req.params;
    if (!isValidObjectId(comunityPostId)) {
        throw new ApiError(400, "Invalid comunity post id!");
    }
    //delete comunity post
    const deletedComunityPost = await ComunityPost.findByIdAndDelete(comunityPostId);

    if (!deletedComunityPost) {
        throw new ApiError(404, `No comunity post with this id was found!`);
    }

    return res.status(200).json(new ApiResponse(200, null, "The comunity post has been deleted!"));
})

export {
    createComunityPost,
    getUserComunityPosts,
    updateComunityPost,
    deleteComunityPost
}
