import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import installmentsRouter from "./installments";
import rankingRouter from "./ranking";
import profileRouter from "./profile";
import pixRouter from "./pix";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(installmentsRouter);
router.use(rankingRouter);
router.use(profileRouter);
router.use(pixRouter);
router.use(adminRouter);

export default router;
