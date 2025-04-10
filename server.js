import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";
import dayjs from "dayjs";

import { loadUsers, addUser } from "./users_db.js";
import {
  loadPosts,
  addPost,
  deletePostById,
  updatePostTitleById,
} from "./posts_db.js";
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

// get all posts
app.get("/posts", isAuthenticated, async (req, res) => {
  const username = req.username;
  const posts = loadPosts();
  res.json(posts.filter((post) => post.author === username));
});

//
app.post("/posts", isAuthenticated, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.send("Post title are required");
  }

  addPost(title);
  res.send("Post created successfully");
});

//
app.put("/posts/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const posts = loadPosts();
  const exist = posts.find((p) => p.id === id);
  if (!exist) {
    return res.send("Post with given id does not exist");
  }

  updatePostTitleById(id, title);
  res.send("Post updated successfully");
});

//
app.delete("/posts/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();
  const exist = posts.find((p) => p.id === id);
  if (!exist) {
    return res.send("Post with given id does not exist");
  }

  deletePostById(id);
  res.send("Post deleted successfully");
});

// also called signup
app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.json("All fields are required");
  }
  const user = addUser(username, password, role);
  res.json({
    message: "User created",
    user: { id: user.id, username: user.username, role: user.role },
  });
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
