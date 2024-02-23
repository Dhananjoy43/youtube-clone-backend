import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

playlistSchema.methods.addVideo = function (video) {
    this.videos.push(video);
    return this.save();
};

playlistSchema.methods.removeVideo = async function (video) {
    const index = this.videos.indexOf(video._id);

    if (index === -1) throw Error("No such video in the playlist");

    await this.updateOne({ $pull: { videos: video._id } });
    return video;
};

export const Playlist = mongoose.model('Playlist', playlistSchema);