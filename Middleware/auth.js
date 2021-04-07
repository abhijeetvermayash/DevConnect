const jwt = require("jsonwebtoken"); //this middleware helped us to get our user in req.user
//and by using this middleware we can protect our routes
//just by adding routes.get('/dasd',auth,(req,res)=>{})    //just pass auth
const config = require("config");
const Users = require("../models/Users");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token"); //we will value of token from the header

  //if no token is there

  if (!token) {
    return res.status(401).json({ msg: "No token,access denied" });
  }

  try {
    const decode = jwt.verify(token, config.get("secret")); //we will decode this token using jwt.verify

    req.user = decode.user; //assign decoded user value to req.user
    //by doing this means setting up our req.user to decoded value of token
    //now we can access persent user by req.user from any route
    next();
  } catch (err) {
    console.log("server error");
    res.status(400).json({ msg: "token is not valid" });
  }
};
