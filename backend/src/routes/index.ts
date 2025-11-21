import { Router } from "express";

import authRoutes from "./auth.routes";
import gamemodesRoutes from "./gamemodes";
import gamesRoutes from "./games";
import ranksRoutes from "./ranks";
import reportsRoutes from "./reports";
import ticketsRoutes from "./tickets";
import userRanksRoutes from "./userranks";
import usersRoutes from "./users";
import votesRoutes from "./votes";

const router = Router();


router.use("/auth", authRoutes);

router.use("/games", gamesRoutes);
router.use("/gamemodes", gamemodesRoutes);

router.use("/tickets", ticketsRoutes);
router.use("/", votesRoutes);

router.use("/users", usersRoutes);
router.use("/user-ranks", userRanksRoutes);

router.use("/reports", reportsRoutes);
router.use("/ranks", ranksRoutes);

export default router;