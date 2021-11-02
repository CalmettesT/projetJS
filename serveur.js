const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const sessions = require("express-session");
const { stringify } = require("querystring");
const mongoDBsession = require("connect-mongodb-session")(sessions);
const fs = require("fs");

const saleMdp = 10;
app.use(express.json());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));

app.set("views", "./public");
app.set("view engine", "ejs");

// let methodOverride = require('method-override')
// const { boolean } = require('webidl-conversions')

mongoose
  .connect("mongodb://localhost:27017/ProjetJS", { useNewUrlParser: true })
  .then(() =>
    //connection en localhost
    console.log("Connected to Mongo…")
  )
  .catch(
    (
      error //affiche message
    ) => console.log(error.message)
  );

const usersSchema = mongoose.Schema({
  pseudo: String,
  mdp: String,
});

const sessionSchema = new mongoose.Schema({
  session: {
    userid: String,
    isAuth: Boolean,
  },
});

const partiesSchema = mongoose.Schema({
  nomPartie: String,
  lot: { type: Number, required: true, default: 6 },
  J1: {
    nomJ1: { type: String, required: true },
    jetons: { type: Number, default: 100 },
    isConnected: { type: Boolean, required: true, default: false },
  },
  J2: {
    nomJ2: { type: String, required: true },
    jetons: { type: Number, default: 100 },
    isConnected: { type: Boolean, required: true, default: false },
  },
  round: { type: Number, required: true, default: 1 },
  spectateur: { type: Array },
  createurPartie: String,
  statue: {
    type: String,
    enum: ["en Attente", "En cours", "Terminé"],
    default: "en Attente",
  },
  date: { type: Date, default: Date.now },
});

const store = new mongoDBsession({
  uri: "mongodb://localhost:27017/ProjetJS",
  collection: "sessions",
});

const Users = mongoose.model("Users", usersSchema);
const Session = mongoose.model("Session", sessionSchema);
const Parties = mongoose.model("Parties", partiesSchema);

app.use(
  sessions({
    secret: "mon petit sercret",
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    saveUninitialized: false,
    resave: false,
    store: store,
  })
);

async function createUsers(pseudo, mdp) {
  bcrypt.genSalt(saleMdp, async function (err, salt) {
    bcrypt.hash(mdp, salt, async function (err, hash) {
      const mdhHash = hash;
      bcrypt.compare(mdp, hash, async function (err, result) {
        if (result) {
          mdp = mdhHash;
          const users = new Users({
            pseudo: pseudo,
            mdp: mdp,
          });
          const result = await users.save();
          console.log(result);
        }
      });
    });
  });
}

app.post("/newParties", (req, res) => {
  createParties(
    req.body.nomDesParties,
    req.body.votrePseudo,
    req.body.pseudoAd,
    req.session.userid
  );
  res.redirect("/listePartie");
});

async function createParties(nomPartie, j1, j2, createur) {
  // nomJ1=req.body.votrePseudo
  // nomJ2=req.body.pseudoAd
  const parties = new Parties({
    nomPartie: nomPartie,
    J1: {
      nomJ1: j1,
    },
    J2: {
      nomJ2: j2,
    },
    createurPartie: createur,
  });
  const result = await parties.save();
  console.log(result);
}

app.post("/users", (req, res) => {
  createUsers(req.body.pseudo, req.body.password);
  req.session.userid = req.body.pseudo;
  res.redirect("/connexion.html");
});

app.get("/", (req, res) => {
  if (req.session.isAuth === true) {
    res.redirect("/listeDesParties.html");
  } else res.sendFile("Index.html");
});

app.post("/usersConnexion", async (req, res) => {
  await Users.findOne({
    pseudo: req.body.pseudoCo,
  }).then(function (user) {
    if (!user) return res.redirect("/connexion.html");
    bcrypt.compare(req.body.passwordCo, user.mdp, function (err, result) {
      if (!result) return res.redirect("/connexion.html");

      req.session.isAuth = true;
      req.session.userid = req.body.pseudoCo;

      req.session.user = {
        id: user._id,
        pseudo: user.pseudoCo,
      };
      // res.send("Hey there, welcome <a href='/logout'>click to logout</a>");
      res.redirect("/listePartie");
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/connexion.html");
});

app.get("/listePartie", (req, res) => {
  if (!req.session.user) return res.redirect("/connexion.html");
  res.render("listePartie.ejs", {});
});

app.get("/recupPartie", async (req, res) => {
  await Parties.find().then((games) => {
    res.json(games);
  });
});

app.get("/deletePartie/:id", async (req, res) => {
  Parties.findOne({ _id: req.params.id }, "_id", async function (err, gamebdd) {
    await Parties.deleteOne({ _id: req.params.id });
  });
});

app.get("/session", (req, res) => {
  res.json(req.session);
});

app.get('/partieEncour/:id', (req, res) => {
    res.render('partieEnCour.ejs');
})

// app.get("/partieEncour/:id", async (req, res) => {
//   if (!req.session.user) return res.redirect("/listePartie");
//   let game = await Parties.findById(req.params.id);
//   if (!game) return res.redirect("/listePartie");

//   let user1 = await Users.findOne({ "pseudo": game.J1.nomJ1 });
//   let user2 = await Users.findOne({ "pseudo": game.J2.nomJ2 });

//   let type = null;

//   if (user1.id == req.session.user.id || user2.id == req.session.user.id) {
//     type = true;
//   } else {
//     type = false;
//   }
//   console.log(game);
//   return res.render("partieEnCour.ejs", {
//     game: game,
//     user1: user1,
//     user2: user2,
//     isplayer: type,
//   });
// });

app.get('/comboAD',async(req,res) => {
    await Users.find()
    .then((utilisateur)=>{
        res.json(utilisateur)
    })
})

app.listen(3000, () => {
  console.log("Server started on port...");
});
