import { Request, Response } from "express";
import User from "../models/Users";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email"], // pas de password
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
