import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || 0,
          lte: parseInt(query.maxPrice) || 10000000,
        },
      },
    });
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  const anotherToken = req.cookies?.token;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (anotherToken) {
      jwt.verify(
        anotherToken,
        process.env.JWT_SECRET_KEY,
        async (err, payload) => {
          if (!err) {
            const saved = await prisma.savePost.findUnique({
              where: {
                userId_postId: {
                  postId: id,
                  userId: payload.id,
                },
              },
            });
            return res
              .status(200)
              .json({ ...post, isSaved: saved ? true : false });
          }
        }
      );
      return;
    }

    return res.status(200).json({ ...post, isSaved: false });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        postDetail: { create: body.postDetail },
      },
    });
    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (post.userId !== tokenUserId)
      return res
        .status(403)
        .json({ message: "You can delete only your posts" });
    await prisma.post.delete({ where: { id } });
    return res.status(200).json({ message: "Post has been deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const body = req.body;
  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (post.userId !== tokenUserId)
      return res
        .status(403)
        .json({ message: "You can delete only your posts" });
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { ...body },
    });
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update post" });
  }
};
