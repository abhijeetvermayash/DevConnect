const express = require("express");

const router = express.Router();

const auth = require("../../Middleware/auth");

const Users = require("../../models/Users");

const Profile = require("../../models/Profile");

const axios = require("axios");

const { body, validationResult } = require("express-validator");

const config = require("config");
const request = require("request");

//get /profile/me
//to get current users profile
//private as we need auth
router.get("/me", auth, async (req, res) => {
  try {
    console.log(req.user.id);
    const userid = req.user.id;
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]); //populate method will populate our resultant object with
    //other values as mentioned,here we are populating by name and
    //avatar from the 'users' schema
    //we populate a key which is user:id_logged_user....we populate it and got the name and avatar associated with this id
    //in the profile mongodb database it is stored as user:<some-id>
    //so if we don't populate we will see our response like this only,but since we are populating the key user
    //we will see in response user{id:<some id>,name:<name of that user with that id>,avatat:<avatar of user with that id>}
    if (!profile) {
      console.log("user doesn't exists");
      return res
        .status(400)
        .json({ msg: "user not found,no profile for the user" });
    } else {
      console.log("profile found");
      console.log(profile);
      return res.status(200).json(profile);
    }
  } catch (err) {
    console.log("server error");
    return res.status(401).json({ msg: "server error", error: err });
  }
});

// post /profile
//private
//create or update a profile of the user
//in this route we have to use auth as well as validator so we will write it inside a array
router.post(
  "/",
  [
    auth,
    [
      body("status", "status is required").not().isEmpty(),
      body("skills", "skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    } else {
      const {
        company,
        website,
        location,
        status,
        skills,
        bio,
        githubusername,
        youtube,
        twitter,
        facebook,
        instagram,
        linkedin,
      } = req.body;

      const profile = {};
      if (company) profile.company = company;
      if (website) profile.website = website;
      if (location) profile.location = location;
      if (status) profile.status = status;
      if (skills) {
        profile.skills = skills.split(",").map((skill) => skill.trim());
      }

      if (bio) profile.bio = bio;
      if (githubusername) profile.githubusername = githubusername;

      console.log(profile);

      const social = {};
      if (youtube) social.youtube = youtube;
      if (instagram) social.instagram = instagram;
      if (twitter) social.twitter = twitter;
      if (facebook) social.facebook = facebook;
      if (linkedin) social.linkedin = linkedin;

      profile.social = social;

      profile.user = req.user.id;

      console.log(profile);

      let UserProfile = await Profile.findOne({ user: req.user.id });

      if (UserProfile) {
        console.log("Updating....");

        UserProfile = await Profile.findOneAndUpdate(
          { user: req.user.id }, //find where user id is this
          { $set: profile }, //update the profile,It will look for key and values in profile and update it in previous data
          { new: true } //new :true will help us to return updated profile in res
        );

        return res
          .status(200)
          .json({ profile: UserProfile, msg: "profile updated" });
      } else {
        console.log("adding new profile");
        UserProfile = new Profile(profile);

        await UserProfile.save();
        return res
          .status(200)
          .json({ profile: UserProfile, msg: "profile saved" });
      }
    }
  }
);
// get /profile/allprofiles
//private
//get profile of all the users

router.get("/allprofiles", async (req, res) => {
  try {
    const allprofiles = await Profile.find({}).populate("user", [
      "name",
      "avatar",
    ]);
    if (allprofiles) {
      console.log(allprofiles);
      res.status(200).send(allprofiles);
    } else {
      console.log("no profiles");
      res.send(200).send({});
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: err });
  }
});

// get /profile/user/:user_id
//public
//get profile of user by id
router.get("/user/:id", async (req, res) => {
  try {
    const profile = (
      await Profile.findOne({ user: req.params.id })
    ).populate("user", ["name", "avatar"]);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(200).json({ msg: "profile not found" });
    }
  } catch (err) {
    console.log(err); //suppose we are giving any id greater than length of actual id which didn't exists then it will come to catch
    if (err.kind == "ObjectId") {
      //so we want to still print profile not found in that case
      //this is done by err.kind
      res.status(200).json({ msg: "profile not found" });
    }
    res.status(500).send({ error: err });
  }
});
//delete request /profile
//private route
//delete profile and user and posts of user
router.delete("/", auth, async (req, res) => {
  try {
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await Users.findOneAndRemove({ _id: req.user.id });
    res.status(200).json({ msg: "user and its profile deleted" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
});

// put request /profile/addexperience
//add experience in logged in user
//put request as we are updating/adding experience in profile data which already exists
//private route
router.put(
  "/addexperience",
  [
    auth,

    [
      body("title", "title is required").not().isEmpty(),
      body("company", "company is required").not().isEmpty(),
      body("from", "from data is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    console.log(req.body);
    const error = validationResult(req);
    if (!error.isEmpty()) {
      res.status.send({ error });
    }
    const {
      title,
      company,
      from,
      location,
      to,
      current,
      description,
    } = req.body;

    const experience = {
      title: title,
      company: company,
      to: to,
      from: from,
      location: location,
      current: current,
      description: description,
    };

    try {
      const userid = await req.user;
      console.log(userid.id);
      const profile = await Profile.findOne({ user: userid.id });
      profile.experience.unshift(experience);
      //  profile.experience=[...profile.experience,experience];
      //The unshift method inserts the given values to the beginning of an array-like object.
      //for ex
      // let arr=[1,2,3]
      //arr.unshift(4)
      //arr will become--->[4,1,2,3]

      //since profile.experience is an array it will add at the beginning of that array.

      await profile.save();

      res.status(200).json(profile);
    } catch (err) {
      res.status(400).send({ "error message": `server error` });
    }
  }
);

//delete experience by id of experience
//delete request profile/experience/:exp_id
//private route
router.delete("/experience/:exp_id", auth, async (req, res) => {
  console.log(req.params.exp_id);
  try {
    const expr_id = req.params.exp_id;
    const profile = await Profile.findOne({ user: req.user.id });

    const removeId = profile.experience.map((item) => item.id).indexOf(expr_id); //we match the expr_id and fot it's index
    profile.experience.splice(removeId, 1); //.splice(index,no_of_items to remove);
    await profile.save();

    res.status(200).send(profile);
  } catch (err) {
    res.status(500).send({ msg: "server error" });
  }
});

// put request /profile/addeducation
//add education in logged in user
//put request as we are updating/adding experience in profile data which already exists
//private route
router.put(
  "/addeducation",
  [
    auth,
    [
      body("school", "school is required").not().isEmpty(),
      body("from", "from is required").not().isEmpty(),
      body("degree", "degree is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req.body);

    if (!error.isEmpty()) {
      res.status(400).send(error);
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      console.log(profile);
      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      } = req.body;
      const education = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      };
      profile.education.unshift(education);
      await profile.save();
      res.status(200).json(profile);
    } catch (err) {
      res.status(500).send({ msg: "server error", err: err });
    }
  }
);

//delete education by id of education
//delete request profile/educatipn/:edu_id
//private route
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    profile = await Profile.findOne({ user: req.user.id });
    console.log(profile);

    const index = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(index, 1);

    await profile.save();

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).send({ msg: "server error" });
  }
});
//get request to get all repos of the user by github username
//get request /profile/github/:username
//public profile
//get reques profile/github/:username

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubclientid"
      )}&client_secret=${config.get("githubsecretkey")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };
    console.log(options.uri);
    request(options, (error, response, body) => {
      // console.log(body);
      if (error) console.log(error);

      if (response.statusCode !== 200) {
        return res.status(404).send({ msg: "no github profile found" });
      }

      return res.status(200).json(JSON.parse(body));
    });
  } catch (err) {
    res.status(500).send(err);
  }
});
module.exports = router;
