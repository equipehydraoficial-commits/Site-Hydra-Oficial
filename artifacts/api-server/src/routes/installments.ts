import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, installmentsTable } from "@workspace/db";
import { SubmitComprovanteBody, SubmitComprovanteParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/installments/mine", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const installments = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.userId, userId))
    .orderBy(installmentsTable.numero);

  res.json(
    installments.map((i) => ({
      id: i.id,
      userId: i.userId,
      numero: i.numero,
      valor: parseFloat(i.valor as string),
      vencimento: i.vencimento,
      status: i.status,
      dataPago: i.dataPago?.toISOString() ?? null,
      comprovante: i.comprovante ?? null,
    })),
  );
});

router.post("/installments/:installmentId/submit", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.installmentId) ? req.params.installmentId[0] : req.params.installmentId;
  const installmentId = parseInt(rawId, 10);
  if (isNaN(installmentId)) {
    res.status(400).json({ error: "Invalid installment ID" });
    return;
  }

  const parsedBody = SubmitComprovanteBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const userId = req.session.userId!;
  const [installment] = await db
    .select()
    .from(installmentsTable)
    .where(and(eq(installmentsTable.id, installmentId), eq(installmentsTable.userId, userId)))
    .limit(1);

  if (!installment) {
    res.status(404).json({ error: "Parcela não encontrada" });
    return;
  }

  const [updated] = await db
    .update(installmentsTable)
    .set({ comprovante: parsedBody.data.comprovante })
    .where(eq(installmentsTable.id, installmentId))
    .returning();

  res.json({
    id: updated.id,
    userId: updated.userId,
    numero: updated.numero,
    valor: parseFloat(updated.valor as string),
    vencimento: updated.vencimento,
    status: updated.status,
    dataPago: updated.dataPago?.toISOString() ?? null,
    comprovante: updated.comprovante ?? null,
  });
});

export default router;
