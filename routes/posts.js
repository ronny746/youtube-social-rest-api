const router = require("express").Router();
const Post = require("../models/Post");
const multer = require('multer');
const User = require("../models/User");



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

// Set up Multer storage for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
  }
});

// Create a Multer upload middleware
const upload = multer({ storage });
//create a post

router.post("/", upload.single('img'), async (req, res) => {

  const baseURL = 'localhost:8800/';
  const newimage = baseURL+req.file.path;
  const newPost = new Post({
    userId: req.body.userId,
    desc: req.body.desc,
    img: newimage // Save the file path of the uploaded image
  });
 
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});
//update a post

router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//delete a post

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//like / dislike a post

router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//get a post

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get timeline posts

router.get("/timeline/all",verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    const imageurl = "localhost:"
    res.json(userPosts.concat(...friendPosts))
  } catch (err) {
    res.status(500).json(err);
  }
});


// get post likes with users profile

router.get("/:postId/likes/count", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const likeCount = post.likes.length;
    const users = await User.find({ _id: { $in: post.likes } }, "username email"); // Modify the fields to retrieve as needed
      res.status(200).json({ count: likeCount, users });
   
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;
