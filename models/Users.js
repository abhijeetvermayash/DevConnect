const mongoose = require("mongoose");

const Schema = mongoose.Schema; //just find about mongoose schemas on the net

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now, //this will take date automatically
  },
});

module.exports = user = mongoose.model("users", UserSchema); //users is the name of the schema which will be shown in db
