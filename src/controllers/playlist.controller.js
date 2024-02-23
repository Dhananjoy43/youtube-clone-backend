import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    // check for empty fields
    if (!name || !description) throw new ApiError(400, 'Please provide all fields');
    //create playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(400, "Insufficient information to create playlist")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id!");
    }
    //TODO: get user playlists
    const playlists = await Playlist.find({ owner: userId });
    if (!playlists) {
        throw new ApiError(400, "No playlist found");
    }
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    try {
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(400, "Playlist cannot be found");
        }
        return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Cannot get the playlist");
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id!")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const videoIndex = playlist.videos.indexOf(videoId);

    if (videoIndex > -1) {
        // Video already exists in the playlist
        throw new ApiError(400, "Video already exists in the playlist");
    }

    playlist.videos.push(videoId);
    const updatedPlaylist = await playlist.save();

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to the playlist"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id!");
    }
    // remove video from playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );


    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id!");
    }
    // delete playlist
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Error occured while deleting the playlist");
    }
    return res.status(200).json(new ApiResponse(200, [], "Playlist deleted"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id!");
    }
    if (!name && !description) {
        throw new ApiError(401, "Atleast one field is required");
    }
    //TODO: update playlist
    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        name,
        description
    }, { new: true });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated"));

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
