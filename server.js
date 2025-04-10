import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";
import dayjs from "dayjs";

import { loadUsers, addUser } from "./users_db.js";
import { loadPosts } from "./posts_db.js";
import { isAuthenticated } from "./middleware/auth.js";
import { canAccessPost } from "./middleware/abac.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// get post by id
app.get("/posts/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.send("Post with given id does not exist");
  }

  const context = {
    user: req.user,
    resource: post,
    environment: {
      time: dayjs(),
      ip: req.ip,
    },
  };

  if (!canAccessPost(context)) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(post);
});

// also called signin
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check username and password value existence
  if (!username || !password) {
    return res.send("Both username and password are required");
  }

  // Check user existence
  const users = loadUsers();
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.send("Invalid username or password");
  }

  // Check password matching
  if (user.password !== password) {
    return res.send("Invalid username or password");
  }

  // create and sign a jwt token
  const payload = { username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "15m",
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true, // Only over HTTPS
    sameSite: "Strict", // or 'Lax'
  });

  res.send("You have successfully logged in");
});

// Logout: Option1: clear cookies
// if token is kept, user can easly authenticate before token expiry
// alternative solution: blacklist token until its expiry
app.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.status(200).send({ message: "Logged out successfully" });
});

const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
