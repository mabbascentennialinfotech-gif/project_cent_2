const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");


const router = express.Router();



// SIGNUP
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;


  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }


  const hashedPassword = await bcrypt.hash(password, 10);


  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });


  await newUser.save();


  res.status(201).json({ message: "User registered successfully" });
});


// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;


  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }


  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });


  res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
});



// GET USER PROFILE
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("username email createdAt");
  res.json(user);
});



module.exports = router;