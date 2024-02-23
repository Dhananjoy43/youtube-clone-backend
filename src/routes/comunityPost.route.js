import { Router } from 'express';
import {
    createComunityPost,
    getUserComunityPosts,
    updateComunityPost,
    deleteComunityPost
} from "../controllers/comunityPost.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createComunityPost);
router.route("/user/:userId").get(getUserComunityPosts);
router.route("/:comunityPostId").patch(updateComunityPost).delete(deleteComunityPost);

export default router