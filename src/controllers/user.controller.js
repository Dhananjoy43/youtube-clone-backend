import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generation access token and refresh token!");
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const { username, email, fullName, password } = req.body;

    // validation - not empty
    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: using unique email and username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(400, "User with this email or username already exists!");
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing!");
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar is missing!");
    }

    // create user object in db
    const user = await User.create({
        username,
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",  // default value of cover image is an empty string
        password
    });

    // remove password and refresh token field from  the response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating a user");
    }

    // return res
    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered  successfully")
    );
});


// For login
export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    // validate request body fields
    if ((!username && !email)) {
        throw new ApiError(400, "Username or Email is required!");
    }
    // find user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // if no user found with provided credentials
    if (!user) {
        throw new ApiError(401, "Invalid Credentials");
    }

    // compare passwords
    const isMatchedPassword = await user.isPasswordCorrect(password);
    if (!isMatchedPassword) {
        throw new ApiError(401, "Invalid Credentials!");
    }

    // create access & refresh tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

    // save refresh token to the database and set cookie in response header
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    // send response
    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    },
        "User logged in successfully!"
    ));
});


// Logout API - remove refresh token from DB and clear cookies
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true,
    });

    const options = {
        httpOnly: true,
        secure: true,
    }

    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully!"));
});


export const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get the refresh token from the request headers
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request!");
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token!");
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token!");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed!"));
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token!");
    }
})