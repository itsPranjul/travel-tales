require("dotenv").config();
const mongoose = require("mongoose");
const config = require("./config.json");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const User = require("./models/user_model");
const TravelStory = require("./models/travelStory_model");

const jwt = require("jsonwebtoken");
const { authenticationToken } = require("./utilities");
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

//create-account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    fullName,
    email,
    password: hashedPassword,
  });

  await user.save();

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "12h",
    }
  );

  return res.status(201).json({
    error: false,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
    message: "Registration Successful",
  });
});

//login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid Password",
    });
  }

  const isPassword = await bcrypt.compare(password, user.password);
  if (!isPassword) {
    return res.status(400).json({
      message: "Invalid Password",
    });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.json({
    error: false,
    message: "Login Successful",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

//Serve static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

//delete image
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({
      error: true,
      message: "imageUrl parameter is required",
    });
  }

  try {
    //Extract the filename from the imageUrl
    const filename = path.basename(imageUrl);

    // delete the file path
    const filePath = path.join(__dirname, "uploads", filename);

    //check if file exists
    if (fs.existsSync(filePath)) {
      //delete the file from uploads folder
      fs.unlinkSync(filePath);
      res
        .status(200)
        .json({ error: true, message: "Image deleted successfully" });
    } else {
      res.status(200).json({ error: true, message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//get all travel stories
app.get("/get-all-stories", authenticationToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavourite: -1,
    });
    res.status(200).json({ stories: travelStories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//route to handle image upload
app.post("/image-upload", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: true, message: "No image uploaded" });
    }

    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//Get User
app.get("/get-user", authenticationToken, async (req, res) => {
  const { userId } = req.user;

  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: isUser,
    message: "",
  });
});

////add travel story
app.post("/add-travel-story", authenticationToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  //validate required fields
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res.status(400).json({
      error: true,
      message: "All fields are required",
    });
  }

  //convert visitedDate from miliseconds to date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    });

    await travelStory.save();
    res.status(201).json({ story: travelStory, message: "Added Successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

//edit travel story
app.put("/edit-story/:id", authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  //validate required fields
  if (!title || !story || !visitedLocation || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required " });
  }

  // Convert visitedDate from milliseconds to date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    // find the travel story by id and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    const placeholderInput = `http://localhost:8000/assets/placeholder.png`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    travelStory.imageUrl = imageUrl || placeholderInput;
    travelStory.visitedDate = parsedVisitedDate;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//delete a travel story
app.delete("/delete-story/:id", authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    // delete the travel story from the database
    await travelStory.deleteOne({ _id: id, userId: userId });

    //extract the filename from the imageurl
    const imageUrl = travelStory.imageUrl;
    const filename = path.basename(imageUrl);

    //delete the file path
    const filePath = path.join(__dirname, "uploads", filename);

    //delete the image file from the upload folder
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete image file:", err);
        //optionally, you can could still respond with a success status here
        // if you don't want to treat this as a critical error.
      }
    });

    res.status(200).json({ message: "Travel story deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: error.message });
  }
});

//update isFavourite
app.put("/update-is-favourite/:id", authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    travelStory.isFavourite = isFavourite;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//search travel stories
app.get("/search", authenticationToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;

  if (!query) {
    return res.status(404).json({ error: true, mesage: "query is required" });
  }
  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });

    res.status(200).json({ stories: searchResults });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//filter travel stories by date range
app.get("/travel-stories/filter", authenticationToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId } = req.user;

  try {
    //convert startdate and enddate from milliseconds to date objects
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));

    //find travel stories that belong to the authenticated user and fails within the date range
    const filterStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavourite: -1 });

    res.status(200).json({ stories: filterStories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.listen(8000);
module.exports = app;
