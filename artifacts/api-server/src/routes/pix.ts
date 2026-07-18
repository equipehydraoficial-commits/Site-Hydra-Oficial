import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, pixConfigTable } from "@workspace/db";
import { UpdatePixConfigBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

async function ensurePixConfig() {
  const rows = await db.select().from(pixConfigTable).limit(1);
  if (rows.length === 0) {
    const [inserted] = await db
      .insert(pixConfigTable)
      .values({ chavePix: "equipehydra.ipnb@gmail.com" })
      .returning();
    return inserted;
  }
  return rows[0];
}

router.get("/pix-config", async (req, res): Promise<void> => {
  const config = await ensurePixConfig();
  res.json({ chavePix: config.chavePix });
});

router.put("/pix-config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdatePixConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const config = await ensurePixConfig();
  const [updated] = await db
    .update(pixConfigTable)
    .set({ chavePix: parsed.data.chavePix, updatedAt: new Date() })
    .where(eq(pixConfigTable.id, config.id))
    .returning();

  res.json({ chavePix: updated.chavePix });
});

export default router;
