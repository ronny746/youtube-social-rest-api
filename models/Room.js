const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
