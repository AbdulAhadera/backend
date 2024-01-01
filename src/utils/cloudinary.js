import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: 'ddmxpjosk',  // yeh sab env variable mein rkhayege
    api_key: '494183635338429', // yeh sab env variable mein rkhayege
    api_secret: 'PpTj-5tPLZXUKpyxUXb_GK3ihdc' // yeh sab env variable mein rkhayege
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // file has been uploaded succesfully
        console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlink(localFilePath)
        // removed the locally saved temporary file as the ipload operation got failed
        return null

    }

}


export { uploadOnCloudinary };
