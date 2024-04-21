import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  if (id !== tokenUserId)
    return res.status(403).json({ message: "Not authorized" });
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(hashedPassword && { password: hashedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: userPassword, ...userInfo } = updatedUser;

    return res.status(200).json(userInfo);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get user" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get users" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId)
    return res.status(403).json({ message: "Not authorized" });

  try {
    await prisma.user.delete({
      where: { id },
    });
    return res.status(200).json({ message: "User has been deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const savedPost = await prisma.savePost.findUnique({
      where: { userId_postId: { userId: tokenUserId, postId } },
    });

    if (savedPost) {
      await prisma.savePost.delete({
        where: { id: savedPost.id },
      });
      return res
        .status(200)
        .json({ message: "Post has been removed from saved List" });
    }

    await prisma.savePost.create({
      data: {
        userId: tokenUserId,
        postId,
      },
    });
    return res.status(200).json({ message: "Post has been saved" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save post" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: {
        userId: tokenUserId,
      },
    });

    const userSavedPosts = await prisma.savePost.findMany({
      where: {
        userId: tokenUserId,
      },
      include: {
        post: true,
      },
    });
    const savedPosts = userSavedPosts.map((item) => item.post);

    return res.status(200).json({ userPosts, savedPosts });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get profile posts" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: { hasSome: [tokenUserId] },
        NOT: { seenBy: { hasSome: [tokenUserId] } },
      },
    });

    return res.status(200).json(number);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get notification number" });
  }
};
