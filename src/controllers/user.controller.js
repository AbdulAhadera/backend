
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateRefreshToken()
        const refreshToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from front-end
    // validation - not empty , correct email , etc etc
    // check if user already exist : username or email
    // check for images , check for avatar
    // upload them to cloudinary , avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response
    // check for user creation
    // return response , if !response throw error

    const { fullName, email, username, password } = req.body


    // hard logic sab 1 sath check hoga .some method hai 
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")

    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        // dollar sign laga kr check kr mongodb method hai 
        $or: [{ email }, { username }]

    })

    if (existedUser) throw new ApiError(409, "user with this email or username already exist");


    // multer middleware cloudinary pr file upload krni hai 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file i required")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Succesfully")
    )

});

const loginUser = asyncHandler(async (req, res) => {

    // req body se dara le aoo
    // username or email 
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggendInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("rereshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggendInUser, accessToken, refreshToken
                },
                "User Logged In Succesfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }

    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse
            (200, {},"User Logged out")
        )
})


export {
    registerUser,
    loginUser,
    logoutUser
};