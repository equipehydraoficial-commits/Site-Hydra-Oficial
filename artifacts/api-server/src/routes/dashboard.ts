import { Router } from "express";
import { eq, and, sum } from "drizzle-orm";
import { db, usersTable, installmentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const installments = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.userId, userId))
    .orderBy(installmentsTable.numero);

  const pagos = installments.filter((i) => i.status === "pago");
  const totalContribuido = pagos.reduce((acc, i) => acc + parseFloat(i.valor as string), 0);
  const totalPlano = installments.reduce((acc, i) => acc + parseFloat(i.valor as string), 0);

  const nextInstallment = installments.find((i) => i.status !== "pago") ?? null;

  res.json({
    user: {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      turma: user.turma,
      isAdmin: user.isAdmin,
      pontos: user.pontos,
    },
    totalContribuido,
    totalPlano,
    parcelasPageas: pagos.length,
    totalParcelas: installments.length,
    nextInstallment: nextInstallment
      ? {
          id: nextInstallment.id,
          userId: nextInstallment.userId,
          numero: nextInstallment.numero,
          valor: parseFloat(nextInstallment.valor as string),
          vencimento: nextInstallment.vencimento,
          status: nextInstallment.status,
          dataPago: nextInstallment.dataPago?.toISOString() ?? null,
          comprovante: nextInstallment.comprovante ?? null,
        }
      : null,
  });
});

export default router;
