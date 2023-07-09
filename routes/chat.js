const Chat = require('../models/Chat');
const router = require("express").Router();


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
  

module.exports = router;







