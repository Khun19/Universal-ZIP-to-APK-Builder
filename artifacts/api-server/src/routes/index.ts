import { Router, type IRouter } from "express";
import healthRouter from "./health";
import builderRouter from "./builder";

const router: IRouter = Router();

router.use(healthRouter);
router.use(builderRouter);

export default router;
