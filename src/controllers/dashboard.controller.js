import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { LikedVideo } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose, { isValidObjectId } from "mongoose"

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id!");
    }
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const videoStats = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId),
                },
            },
            {
                $facet: {
                    totalVideos: [{ $count: "totalVideos" }],
                    totalViews: [
                        {
                            $group: {
                                _id: null,
                                totalViews: { $sum: "$views" },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalViews: 1,
                            },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 0,
                    totalVideos: {
                        $arrayElemAt: [
                            "$totalVideos.totalVideos",
                            0,
                        ],
                    },
                    totalViews: {
                        $arrayElemAt: [
                            "$totalViews.totalViews",
                            0,
                        ],
                    },
                },
            },
        ]
    );
    const totalSubscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.ObjectId(channelId)
            }
        },
        {
            $count: 'totalSubscriber'
        }
    ]);

    const stats = {
        totalVideos: videoStats?.totalVideos || 0,
        totalViews: videoStats?.totalViews || 0,
        totalSubscriber: totalSubscriber || 0
    }

    return res.status(200).json(new ApiResponse(200, stats, "All stats fetched successfully!"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id!");
    }
    // TODO: Get all the videos uploaded by the channel
    const allVideos = await Video.find({ owner: channelId });
    if (!allVideos) {
        throw new ApiError(500, "Error fetching the videos!");
    }
    return res.status(200).json(new ApiResponse(200, allVideos, "All videos fetched successfully!"))
})

export {
    getChannelStats,
    getChannelVideos
}