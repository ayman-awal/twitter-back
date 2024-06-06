const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  username: {
    type: String
  },
  bookmarks: [
    {
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
      }
    }
  ],
  posts: [
    {
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
      }
    }
  ],
  following: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  followers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  website: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    required: true
  },
  bio: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('profile', ProfileSchema);
