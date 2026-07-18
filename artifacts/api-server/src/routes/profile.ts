import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateProfileNameBody, UpdateProfilePasswordBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.patch("/profile/name", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileNameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const userId = req.session.userId!;
  const [updated] = await db
    .update(usersTable)
    .set({ nome: parsed.data.nome })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    id: updated.id,
    nome: updated.nome,
    cpf: updated.cpf,
    turma: updated.turma,
    isAdmin: updated.isAdmin,
    pontos: updated.pontos,
  });
});

router.patch("/profile/password", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfilePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.senhaAtual, user.senhaHash);
  if (!valid) {
    res.status(400).json({ error: "Senha atual incorreta" });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.novaSenha, 10);
  await db.update(usersTable).set({ senhaHash: newHash }).where(eq(usersTable.id, userId));

  res.json({ success: true, message: "Senha atualizada com sucesso" });
});

export default router;
