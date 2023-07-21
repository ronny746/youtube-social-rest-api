const multer = require('multer');
const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const util = require("util");
const { CloudinaryStorage } = require("multer-storage-cloudinary");


const storage = multer.diskStorage({
    // destination: function (req, file, cb) {
    //   cb(null, 'posts'); // Specify the destination folder to store the videos
    // },
    filename: function (req, file, cb) {
      // Generate a unique filename for the video
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.mp4');
    }
  });
  const upload = multer({ storage: storage });


router.post('/upload-video', upload.single('img'), async (req, res) => {
    try {
      // Upload the video to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video'
      });
  
      // Return the uploaded video details
      res.json({
        success: true,
        video: result.secure_url
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload video'
      });
    }
  });

  module.exports = router;