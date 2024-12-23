const express = require("express");
const router = express.Router();
const Tweet = require("../models/tweet");
const User = require("../models/users");

router.get("/", async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .populate("author")
      .populate("likes")
      .sort({ createdAt: -1 }); // Obtenir les tweets les plus récents en premier
    res.status(200).json(tweets);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tweets" });
  }
});

router.post("/", async (req, res) => {
  const { content, token } = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newTweet = new Tweet({
      content,
      author: user._id,
      createdAt: new Date(),
      hashtags: content.match(/#\S*/gi),
    });
    const tweet = await newTweet.save();
    res.json({ result: true, tweet });
  } catch (err) {
    res.json({ result: false, error: "Erreur lors de la création du tweet" });
  }
});

router.delete("/:id", async (req, res) => {
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.json({ result: false, error: "tweet non trouvé" });
    }

    await Tweet.deleteOne({ _id: tweetId });
    res.json({ result: true, error: "Tweet supprimé avec succès" });
  } catch (err) {
    res.json({
      result: false,
      error: "Erreur lors de la suppression du tweet",
    });
  }
});

router.post("/:id/", async (req, res) => {
  const tweetId = req.params.id;
  const userToken = req.body.userToken;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.json({ result: false, error: "Tweet non trouvé" });
    }
    const user = await User.findOne({ token: userToken });

    if (!user) {
      return res.json({ result: false, error: "User n'existe pas" });
    }

    if (tweet.likes.some((e) => e.toString() === user._id.toString())) {
      tweet.likes.splice(tweet.likes.indexOf(user._id.toString()), 1);
      await tweet.save();

      return res.json({ result: true, like: false });
    } else {
      tweet.likes.push(user._id);

      await tweet.save();

      return res.json({ result: true, like: true });
    }
  } catch (err) {
    res.json({ result: false, error: "Erreur lors de l'ajout du like" });
  }
});

router.get("/trends", async (req, res) => {
  try {
    const trends = await Tweet.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ result: true, trends });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tendances" });
  }
});

module.exports = router;
