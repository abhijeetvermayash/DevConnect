const express = require("express");
const connectDB = require("./config/db");

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const auth = require("./routes/api/auth");
const posts = require("./routes/api/posts");

const app = express();

//init middleware
app.use(express.json({ extended: false })); //this is same as bodyparser.json(),that we used to do.This will allow us to get req.body()

connectDB(); //connectDB function

app.use("/users", users);
app.use("/profile", profile);
app.use("/posts", posts);
app.use("/auth", auth);

//just for testing
app.get("/", (req, res) => {
  res.send("checkingg.....");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on ${PORT}`));
