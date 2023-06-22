const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const secret_key = "Rana";


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

//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
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
      res.status(404).json("user not found");
     }else{
    res.status(200).json(user);
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
  

  

module.exports = router;
