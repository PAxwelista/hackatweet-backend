var express = require("express");
var router = express.Router();

const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const User = require("../models/users");

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




module.exports = router;
