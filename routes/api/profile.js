const express = require("express");

const router = express.Router();

const auth = require("../../Middleware/auth");

const Users = require("../../models/Users");

const Profile = require("../../models/Profile");

const { body, validationResult } = require("express-validator");

//get /profile/me
//to get current users profile
//private as we need auth
router.get("/me", auth, async (req, res) => {
  try {
    console.log(req.user.id);
    const userid = req.user.id;
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("users", ["name", "avatar"]); //populate method will populate our resultant object with
    //other values as mentioned,here we are populating by name and
    //avatar from the 'users' schema
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

module.exports = router;
