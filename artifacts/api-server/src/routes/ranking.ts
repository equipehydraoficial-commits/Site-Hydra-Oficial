import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router = Router();

router.get("/ranking", async (req, res): Promise<void> => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.isAdmin, false))
    .orderBy(desc(usersTable.pontos));

  const entries = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    nome: u.nome,
    turma: u.turma,
    pontos: u.pontos,
  }));

  const sessionUserId = (req.session as any)?.userId;
  const currentUserRank = sessionUserId ? (entries.find((e) => e.userId === sessionUserId) ?? null) : null;

  res.json({ entries, currentUserRank });
});

export default router;
