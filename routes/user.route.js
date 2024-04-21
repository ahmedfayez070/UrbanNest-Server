import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  updateUser,
  deleteUser,
  getUser,
  getUsers,
  savePost,
  profilePosts,
  getNotificationNumber,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/profilePosts", verifyToken, profilePosts);
router.get("/find/:id", verifyToken, getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
router.post("/save", verifyToken, savePost);
router.get("/notification", verifyToken, getNotificationNumber);

export default router;
