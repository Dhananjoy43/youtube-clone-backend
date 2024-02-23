import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    if (!isValidObjectId(channelId) || !isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid channel id or user id");
    }
    const credentials = { channel: channelId, subscriber: subscriberId };
    const subscribed = await Subscription.findOne(credentials);

    // toggle subscription
    if (!subscribed) {
        const newSubscription = await Subscription.create(credentials);
        if (!newSubscription) {
            throw new ApiError(409, 'Unable to subscribe channel');
        }
        return res.status(201).json(new ApiResponse(201, newSubscription, "Channel has been successfully added to your subscription list"));
    } else {
        const deletedSubscription = await Subscription.deleteOne(credentials);
        if (!deletedSubscription) {
            throw new ApiError(500, "Unable to unsubscribe channel")
        }
        return res.status(200).json(new ApiResponse(200, null, "Channel Unsubscribed"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }
    const subscribers = await Subscription.aggregate([
        {
            '$match': {
                'channel': new mongoose.Types.ObjectId(channelId)
            }
        }, {
            '$group': {
                '_id': 'channel',
                'subscribers': {
                    '$push': '$subscriber'
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'subscribers': 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }
    const channels = await Subscription.aggregate([
        {
            '$match': {
                'subscriber': new mongoose.Types.ObjectId(subscriberId)
            }
        }, {
            '$group': {
                '_id': '$subscriber',
                'subscribedChannels': {
                    '$push': '$channel'
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'subscribedChannels': 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, channels, "Channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}