const express = require("express"); //1
const router = express.Router(); //1
const { body, validationResult } = require("express-validator"); //lines from documentation

var gravatar = require("gravatar"); //gravtar is used to get avatar,follow documentation

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const config = require("config");

const User = require("../../models/Users"); //User Schema

//post users/register
//registration
//public
router.post(
  "/register", // username must not be null
  body("name", "invalid name").not().isEmpty(), //written all the lines of validation from express validator documentation
  body("email", "enter valid email").isEmail(), //email should be valid
  // password must be at least 8 chars long
  body("password", "password length should be 8").isLength({ min: 8 }),
  async (req, res) => {
    //we have to add data to db or if user already exists we have to get it from db,so we will make it async
    console.log(req.body);
    const { name, email, password } = req.body; //as it is in req.body.name
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      try {
        //first check user already exists or not
        let user = await User.findOne({ email });
        if (user) {
          console.log(user);
          res.status(400).json({ errors: [{ msg: "user already exists" }] });
        }
        //registration of new user
        //get user gavatar
        var avatar = gravatar.url(email, { s: "200", r: "pg", d: "retro" });
        //create a new user
        user = new User({ name, email, password, avatar });
        //encrypt password using bcrypt
        //from documentatio of bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

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
