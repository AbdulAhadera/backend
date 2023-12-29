
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

//  Register se pehle middleware lagado or post se pehle q ke jate huye mujh se mil kr jana 


router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        },
    ]),
    registerUser
)


export default router