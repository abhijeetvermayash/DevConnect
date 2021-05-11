const mongoose = require("mongoose");

const config = require("config"); //we installed this so that we can use congif file for constant and sensetive data

const database = config.get("mongoURI"); //To get anything from config default file we can use .get()

const connectDB = async () => {
  try {
    await mongoose.connect(database, {
      useNewUrlParser: true,
      useUnifiedTopology: true, //added as it was giving some warnings
      useCreateIndex: true,
      useFindAndModify: false,
    }); //mongoose.connect("url to connect here")--->will return a promise so we are doing asynv await.
    console.log("hurrayyy!Database connected!");
  } catch (err) {
    console.log(err);

    process.exit(1); //Exit with failure
  }
};

module.exports = connectDB; //module.exports=connectDB will export connectDB function so that it can be called from anywhere
