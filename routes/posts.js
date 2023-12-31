const router = require("express").Router();
const Post = require("../models/Post");
const multer = require('multer');
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const secret_key = "Rana";
const cloudinary = require("cloudinary").v2;
const util = require("util");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
 // Import Multer for handling multipart/form-data




cloudinary.config({
  cloud_name: 'dvop5hsdw',
  api_key: '432668353397378',
  api_secret: 'JtY42piPH7fDM5ue2eQxtIRKQ50'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Posts",
  },
});
const upload = multer({ storage: storage });
// Convert the callback-based method to a promise-based method
const uploadAsync = util.promisify(cloudinary.uploader.upload);
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


//create a post

router.post("/", upload.single("img"), async (req, res) => {
  try {
    const newPost = new Post({
      userId: req.body.userId,
      desc: req.body.desc,
      img: req.file.path, // Save the secure URL of the uploaded image from Cloudinary
    });

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

router.post("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post not found");
    }

    const { userId, text } = req.body;
    const newComment = {
      userId,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/:postId/comments/:commentId/replies", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.find((comment) => comment._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const newReply = {
      userId,
      text,
      createdAt: new Date(),
    };

    comment.replies.push(newReply);
    await post.save();

    res.status(200).json({ message: "Reply added successfully", post });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/timeline/all", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const userPosts = await Post.find({ userId: currentUser._id }).populate("userId", "username profilePicture");
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId }).populate("userId", "username profilePicture");
      })
    );

    // Combine userPosts and friendPosts into a single array
    let allPosts = userPosts.concat(...friendPosts);
    // Sort the allPosts array based on createdAt in descending order
    allPosts.sort((a, b) => b.createdAt - a.createdAt);
    allPosts.reverse();
    res.json(allPosts);

  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/", verifyToken, async (req, res) => {

  try {
    const currentUser = await User.findById(req.user.userId);

     const userPosts = await Post.find({ userId: currentUser._id }).populate("userId", "username profilePicture");
    res.json(userPosts);
  } catch (err) {

    res.status(500).json(err);
  }
});



module.exports = router;
