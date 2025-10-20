// src/server.ts
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import sequelize from "./config/db";
import initModels from "./models/init-models";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const models = initModels();

sequelize
  .authenticate()
  .then(() => console.log("DB connected"))
  .catch((e) => console.error("DB error:", e));

// ⚠️ En prod, préfère des migrations. En dev tu peux synchroniser :
/* await sequelize.sync({ alter: false }); */

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API up on ${PORT}`));
