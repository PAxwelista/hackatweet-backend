const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require("../models/users")

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
  if (req.user) { // Si l'utilisateur est connecté
    next();
  } else {
    res.status(401).json({ error: 'Utilisateur non authentifié' });
  }
};

// Route pour obtenir tous les tweets
router.get('/tweets', async (req, res) => {
  try {
    const tweets = await Tweet.find().populate("author").sort({ createdAt: -1 }); // Obtenir les tweets les plus récents en premier
    res.status(200).json(tweets);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tweets' });
  }
});

// Route pour ajouter un nouveau tweet
router.post('/tweets', async (req, res) => {
  const { content,token} = req.body; 

  // Validation du contenu du tweet
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Le tweet ne peut pas être vide' });
  }

  if (content.length > 280) {
    return res.status(400).json({ error: 'Le tweet ne doit pas dépasser 280 caractères' });
  }

  try {

    const user = await User.findOne({token:token})

    
    const newTweet = new Tweet({
      content,
      author : user._id,
      createdAt: new Date(),
      hashtags : content.match(/#[a-z]*/gi)
    });
    await newTweet.save();
    res.status(201).json(newTweet); // Tweet créé avec succès
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du tweet' });
  }
});

// Route pour supprimer un tweet (uniquement par l'auteur)
router.delete('/tweets/:id', async (req, res) => {
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet non trouvé' });
    }

    await Tweet.deleteOne({_id : tweetId});
    res.status(200).json({ message: 'Tweet supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du tweet' });
  }
});

// Route pour aimer un tweet
router.post('/tweets/:id/:userToken', async (req, res) => {
  const tweetId = req.params.id;
  const userToken = req.params.userToken;

  try {
    const tweet = await Tweet.findById(tweetId);
   
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet non trouvé' });
    }
    const user = await User.findOne({token : userToken})
    if (tweet.likes.some(e=>e.token === userToken)) {

      
      
      const newTab = tweet.likes.filter(e=>e != user._id)
  
      Tweet.updateOne({_id : tweetId , likes : newTab}).then(data=>res.json({ result : true ,like : false}))
    }
    else{
      
      const newLikeTab = [...tweet.likes,user._id]
      
      Tweet.updateOne({_id : tweetId , likes : newLikeTab}).then(data=>res.json(data))
      
    }

  
    
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du like' });
  }
});

router.get("/isLiked/:id/:token", async (req,res)=>{
  const tweet = await Tweet.findById(req.params.id).populate("author").populate("likes");

  res.json({result : true , isLiked : tweet.likes.some(e=>e.token === req.params.token)})
})

// Route pour obtenir les tendances (hashtags et leur compte d'utilisation)
router.get('/trends', async (req, res) => {



  try { 
    const trends = await Tweet.aggregate([
      { $unwind: '$hashtags' }, // Diviser les tweets pour obtenir chaque hashtag individuellement
      { $group: { _id: '$hashtags', count: { $sum: 1 } } }, // Regrouper par hashtag et compter
      { $sort: { count: -1 } } // Trier par nombre d'utilisations (le plus populaire en premier)
    ]);

    res.status(200).json(trends);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

module.exports = router;
