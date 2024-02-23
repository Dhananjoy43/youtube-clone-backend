import mongoose, { Schema } from "mongoose";

const likedVideoSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

}, { timestamps: true })

export const LikedVideo = mongoose.model("LikedVideo", likedVideoSchema);


const likedCommentSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true })

export const LikedComment = mongoose.model("LikedComment", likedCommentSchema);


const likedComunityPostSchema = new Schema({
    comunityPost: {
        type: Schema.Types.ObjectId,
        ref: "ComunityPost"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

}, { timestamps: true })

export const LikedComunityPost = mongoose.model("LikedComunityPost", likedComunityPostSchema);