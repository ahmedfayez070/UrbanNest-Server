import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "User has been created" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create User" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) return res.status(401).json({ message: "Invalid Credentials" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid Credentials" });

    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: age,
    });
    const { password: userPassword, ...userInfo } = user;

    return res
      .cookie("token", token, {
        maxAge: age,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .status(200)
      .json(userInfo);
  } catch (error) {
    return res.status(500).json({ message: "Failed to Login" });
  }
};

export const logout = (req, res) => {
  return res
    .clearCookie("token", { sameSite: "none", secure: true })
    .status(200)
    .json({ message: "User has logged out" });
};
