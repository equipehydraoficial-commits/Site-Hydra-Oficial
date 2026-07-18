/**
 * Vercel serverless entry point.
 * All /api/* requests are routed here by vercel.json rewrites.
 * The Express app handles internal routing via its own router.
 */
import app from "../artifacts/api-server/src/app";

export default app;
