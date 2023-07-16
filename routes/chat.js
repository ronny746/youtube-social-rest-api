const Chat = require('../models/Chat');
const router = require("express").Router();
const User = require('../models/User');



router.post('/', async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    const newChat = new Chat({ sender, receiver, message });
    const savedChat = await newChat.save();

    res.status(201).json(savedChat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat message' });
  }
});





router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userChats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    res.status(200).json(userChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user chats' });
  }
});
router.get('/mutual-followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user with the given userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the users who follow the current user
    const followers = await User.find({ followings: userId });

    // Find the users who the current user follows
    const followings = await User.find({ _id: { $in: user.followings } });

    // Find the users who follow each other (mutual followers)
    const mutualFollowers = followers.filter((follower) =>
      followings.some((following) => following._id.equals(follower._id))
    );

    res.status(200).json(mutualFollowers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mutual followers' });
  }
});

router.get('/chatted-users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user with the given userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find distinct users in the chat collection whom the user has chatted with as the sender or receiver
    const senderUserIds = await Chat.distinct('sender', {
      $or: [
        { sender: userId, receiver: { $ne: userId } },
        { sender: { $ne: userId }, receiver: userId }
      ]
    });

    const receiverUserIds = await Chat.distinct('receiver', {
      $or: [
        { sender: userId, receiver: { $ne: userId } },
        { sender: { $ne: userId }, receiver: userId }
      ]
    });

    const chattedUserIdsSet = new Set([...senderUserIds, ...receiverUserIds]);
    const chattedUserIds = Array.from(chattedUserIdsSet);

    // Retrieve the details of the chatted users from the User collection, excluding the current user
    const chattedUsers = await User.find({ _id: { $in: chattedUserIds, $ne: userId } });

    // Retrieve the last chat message between the user and each chatted user
    const lastChatMessages = await Promise.all(chattedUsers.map(async (chattedUser) => {
      const lastMessage = await Chat.findOne({
        $or: [
          { sender: userId, receiver: chattedUser._id },
          { sender: chattedUser._id, receiver: userId }
        ]
      }).sort({ timestamp: -1 }).limit(1);

      return {
        chattedUser,
        lastMessage
      };
    }));

    // Sort the chatted users based on the timestamp of the last message in descending order
    const sortedChattedUsers = lastChatMessages.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return b.lastMessage.timestamp - a.lastMessage.timestamp;
      }
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return 0;
    });

    res.status(200).json(sortedChattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get the chatted users and last chat messages' });
  }
});


router.get('/messages/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    // Find the chat messages between the two users
    const chatMessages = await Chat.find({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id }
      ]
    }).sort({ timestamp: 1 });
    

    res.status(200).json(chatMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve chat messages' });
  }
});



module.exports = router;







