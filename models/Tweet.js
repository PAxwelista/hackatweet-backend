const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 280 },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: [String], default: [] }, // Liste des utilisateurs qui ont aimé le tweet
  hashtags: { type: [String], default: [] } // Liste des hashtags
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
