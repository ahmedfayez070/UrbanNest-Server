import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    for (const chat of chats) {
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, username: true, avatar: true },
      });
      chat.receiver = receiver;
    }

    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id,
        userIDs: { hasSome: [tokenUserId] },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: { hasSome: [tokenUserId] },
      },
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });

    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, req.body.receiverId],
      },
    });

    return res.status(201).json(newChat);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const updatedChat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });

    return res.status(200).json(updatedChat);
  } catch (error) {
    return res.status(500).json({ message: "Failed to read chat!" });
  }
};
