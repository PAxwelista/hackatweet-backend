const express = require('express');
const router = express.Router();

//const Tweet = require('../models/Tweet'); 
const User = require('../models/users');  
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

router.post("/signup",  (req, res) =>{
  if (req.body.firstname && req.body.username && req.body.password) {
    const usernameRegExp = new RegExp(`^${req.body.username}$`, "i");
    User.findOne({ username: usernameRegExp }).then((data) => {
      if (data) {
        res.json({ result: false, error: "username déjà utilisé" });
        return;
      }
      const token = uid2(32);
      const newUser = new User({
        firstname: req.body.firstname,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 10),
        token,
      });
      newUser.save().then(() => res.json({ result: true, token: token }));
    });
  } else {
    res.json({
      result: false,
      error: "Il manque une information",
    });
  }
});

router.post("/signin",  (req, res) => {
  if (req.body.username && req.body.password) {
    const usernameRegExp = new RegExp(`^${req.body.username}$`, "i");
    User.findOne({ username: usernameRegExp }).then((data) => {
      if (!data) {
        res.json({ result: false, error: "utilisateur non inscrit" });
        return;
      }
      if(bcrypt.compareSync(req.body.password , data.password)){
        res.json({ result: true, token: data.token });
      }else{
        res.json({ result: false, error: "mot de passe incorrect" });
      }
    });
  } else {
    res.json({
      result: false,
      error: "Il manque une information",
    });
  }
});

router.get("/firstname/:token",  (req, res) => {
  User.findOne({token : req.params.token})
  .then(data=>{
    if (!data){
      res.json({result : false , error : "Token non trouvé"})
      return;
    }
    res.json({result : true , firstname : data.firstname})
  })
});

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
    const tweets = await Tweet.find().sort({ createdAt: -1 }); // Obtenir les tweets les plus récents en premier
    res.status(200).json(tweets);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tweets' });
  }
});

// Route pour ajouter un nouveau tweet
router.post('/tweets', isAuthenticated, async (req, res) => {
  const { content } = req.body;
  const author = req.user.username; // Supposons que le middleware d'authentification ait défini req.user

  // Validation du contenu du tweet
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Le tweet ne peut pas être vide' });
  }

  if (content.length > 280) {
    return res.status(400).json({ error: 'Le tweet ne doit pas dépasser 280 caractères' });
  }

  try {
    const newTweet = new Tweet({
      content,
      author,
      createdAt: new Date()
    });
    await newTweet.save();
    res.status(201).json(newTweet); // Tweet créé avec succès
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du tweet' });
  }
});

// Route pour supprimer un tweet (uniquement par l'auteur)
router.delete('/tweets/:id', isAuthenticated, async (req, res) => {
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet non trouvé' });
    }

    // Vérifier si l'utilisateur connecté est bien l'auteur du tweet
    if (tweet.author !== req.user.username) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer ce tweet' });
    }

    await tweet.remove();
    res.status(200).json({ message: 'Tweet supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du tweet' });
  }
});

// Route pour aimer un tweet
router.post('/tweets/:id/like', isAuthenticated, async (req, res) => {
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet non trouvé' });
    }

    if (tweet.likes.includes(req.user.username)) {
      return res.status(400).json({ error: 'Vous avez déjà aimé ce tweet' });
    }

    tweet.likes.push(req.user.username);
    await tweet.save();

    res.status(200).json({ message: 'Tweet aimé avec succès', tweet });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du like' });
  }
});

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
