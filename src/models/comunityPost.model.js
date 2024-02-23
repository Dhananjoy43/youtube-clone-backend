import mongoose, { Schema } from "mongoose";

const comunityPostSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

export const ComunityPost = mongoose.model("ComunityPost", comunityPostSchema);