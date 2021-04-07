const express = require("express");
const auth = require("../../Middleware/auth");

const User = require("../../models/Users");
const { body, validationResult } = require("express-validator"); //lines from documentation

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const config = require("config");

const router = express.Router();

///////////////////////////////////////////////////////////////

//get request /auth
//to get the user details from the tokens
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); //-password will not return password key
    return res.status(200).json(user);
  } catch (err) {
    console.log("error");
    return res.status(401).json({ msg: err });
  }
});

///////////////////////////////////////////////////////////////

//post request /auth/login
//we will pass user email and password from the front end so it will be in req.body and we can match it from the db
//id user exists then we return token (same as in registration) let's copy max part from there
router.post(
  "/login",
  body("email", "enter valid email").isEmail(), //email should be valid
  // password must be at least 8 chars long
  body("password", "password is required").exists(),
  async (req, res) => {
    //we have to add data to db or if user already exists we have to get it from db,so we will make it async
    console.log(req.body);
    const { email, password } = req.body; //as it is in req.body.name
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      try {
        //find user from email in db
        let user = await User.findOne({ email });
        if (!user) {
          res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        //match password

        const ismatch = bcrypt.compare(password, user.password);

        if (!ismatch) {
          res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        //return jsonwebtoken

        const payload = {
          user: {
            id: user.id,
          },
        };

        jwt.sign(
          payload,
          config.get("secret"),
          { expiresIn: 360000 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        ); //Now we are giving jwt as response
        //Next thing we will do is to setup middleware that can verify the token with the user's token(Middleware->auth.js)
      } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
      }
    }
  }
);

module.exports = router;
