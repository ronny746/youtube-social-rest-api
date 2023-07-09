const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Chat = require('../models/Chat');
const secret_key = "Rana";
const util = require("util");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: 'dvop5hsdw',
  api_key: '432668353397378',
  api_secret: 'JtY42piPH7fDM5ue2eQxtIRKQ50'
});

const uploadAsync = util.promisify(cloudinary.uploader.upload);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
  }
});
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json('Access denied. No token provided');
  }
  const user = token.split(" ");
  const xx = user[1];
  try {
    const decoded = jwt.verify(xx, secret_key); // Replace 'secret_key' with your own secret key

    // Attach the decoded user information to the request object
    req.user = decoded;

    next(); // Call the next middleware or route handler
  } catch (err) {
    res.status(401).json('Invalid token');
  }
};



// Get all users
router.get('/alluser', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

const upload = multer({ storage });

//update user
router.put("/user-update",verifyToken,upload.single('profilePicture'), async (req, res) => {
  try {
    const  userId  = req.user.userId;
    // const { name, profilePicture, email, specification } = req.body;
    const result = await uploadAsync(req.file.path);
    // Find the user by ID
    const user = await User.findById(userId);

    // Update user fields
    user.name = req.body.name;
    user.profilePicture = result.secure_url;
    user.email = req.body.email;
    user.specification = req.body.specification;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

//delete user
router.delete("/",verifyToken, async (req, res) => {
  console.log(req.user.userId);
  console.log(req.body.userId);
  
    try {
      await User.findByIdAndDelete(req.user.userId);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  
   
});

//get a user
// router.get("/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     const { password, updatedAt, ...other } = user._doc;
//     res.status(200).json(other);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });


// Middleware function to verify JWT token and get user


// Example route that requires authentication
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Retrieve user profile based on the userId
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json("User not found");
    } else {
      // Count the number of followers and followings
      const followersCount = user.followers.length;
      const followingsCount = user.followings.length;

      // Update the user object with the counts
      const userProfile = {
        ...user.toObject(),
        followersCount,
        followingsCount
      };

      res.status(200).json(userProfile);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});



//follow a user

router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});

//unfollow a user

router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
      try {
        const user = await User.findById(req.params.id);
        const currentUser = await User.findById(req.body.userId);
        if (user.followers.includes(req.body.userId)) {
          await user.updateOne({ $pull: { followers: req.body.userId } });
          await currentUser.updateOne({ $pull: { followings: req.params.id } });
          res.status(200).json("user has been unfollowed");
        } else {
          res.status(403).json("you dont follow this user");
        }
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("you cant unfollow yourself");
    }
  });
// count followers and get profile
  router.get("/followers",verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json("user not found");
       }else{
     
      const followerCount = user.followers.length;
      const followers = await User.find({ _id: { $in: user.followers } }, "username email followers"); // Modify the fields to retrieve as needed
      res.status(200).json({ count: followerCount, followers });
       }
    } catch (err) {
      res.status(500).json(err);
    }

  });
  
  
  router.get("/not-followers-following", verifyToken, async (req, res) => {
    try {
      const currentUser = await User.findById(req.user.userId);
      const currentFollowers = currentUser.followers;
      const currentFollowing = currentUser.followings;
  
      // Find all users who are not in the current user's followers or followings array
      const usersNotFollowedOrFollowing = await User.find({
        _id: { $nin: [...currentFollowers, ...currentFollowing] },
      });
  
      res.status(200).json(usersNotFollowedOrFollowing);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });
  

module.exports = router;
