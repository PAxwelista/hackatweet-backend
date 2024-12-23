const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 280 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], // Liste des utilisateurs qui ont aimé le tweet
  hashtags: { type: [String], default: [] } // Liste des hashtags
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
