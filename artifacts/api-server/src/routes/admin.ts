import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, and, desc, isNotNull, ne, sql } from "drizzle-orm";
import { db, usersTable, installmentsTable } from "@workspace/db";
import { CreateMemberBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { addMonths, format, differenceInDays } from "date-fns";

const router = Router();

// Installments are always fixed: March (3) through November (11) = 9 parcelas of R$8.00
const INSTALLMENT_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11];
const INSTALLMENT_VALOR = "8.00";

async function createInstallmentsForUser(userId: number): Promise<void> {
  const year = new Date().getFullYear();
  const installments = INSTALLMENT_MONTHS.map((month, i) => ({
    userId,
    numero: i + 1,
    valor: INSTALLMENT_VALOR,
    vencimento: format(new Date(year, month - 1, 1), "yyyy-MM-dd"),
    status: "pendente" as const,
  }));
  await db.insert(installmentsTable).values(installments);
}

function mapInstallment(i: typeof installmentsTable.$inferSelect) {
  return {
    id: i.id,
    userId: i.userId,
    numero: i.numero,
    valor: parseFloat(i.valor as string),
    vencimento: i.vencimento,
    status: i.status,
    dataPago: i.dataPago?.toISOString() ?? null,
    comprovante: i.comprovante ?? null,
    metodoPagamento: (i as any).metodoPagamento ?? null,
  };
}

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const allInstallments = await db.select().from(installmentsTable);
  const allUsers = await db.select().from(usersTable).where(eq(usersTable.isAdmin, false));

  const paidInstallments = allInstallments.filter((i) => i.status === "pago");
  const caixaTotal = paidInstallments.reduce((acc, i) => acc + parseFloat(i.valor as string), 0);

  const now = new Date();
  const caixaMesAtual = paidInstallments
    .filter((i) => {
      if (!i.dataPago) return false;
      const d = new Date(i.dataPago);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, i) => acc + parseFloat(i.valor as string), 0);

  const inadimplenteIds = new Set(
    allInstallments.filter((i) => i.status === "atrasado").map((i) => i.userId),
  );

  // Comprovantes em análise: has comprovante AND not paid
  const comprovantesAndamento = allInstallments.filter(
    (i) => i.comprovante && i.status !== "pago",
  ).length;

  res.json({
    caixaTotal,
    caixaMesAtual,
    totalMembros: allUsers.length,
    inadimplentes: inadimplenteIds.size,
    comprovantesAndamento,
  });
});

router.get("/admin/members", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(eq(usersTable.isAdmin, false));
  const installments = await db.select().from(installmentsTable);

  const members = users.map((u) => {
    const userInstallments = installments.filter((i) => i.userId === u.id);
    const pagos = userInstallments.filter((i) => i.status === "pago");
    const totalPago = pagos.reduce((acc, i) => acc + parseFloat(i.valor as string), 0);
    // comprovantes sent but not yet approved
    const comprovantesAndamento = userInstallments.filter(
      (i) => i.comprovante && i.status !== "pago",
    ).length;
    return {
      id: u.id,
      nome: u.nome,
      cpf: u.cpf,
      turma: u.turma,
      pontos: u.pontos,
      parcelasPageas: pagos.length,
      totalParcelas: userInstallments.length,
      totalPago,
      comprovantesAndamento,
    };
  });

  res.json(members);
});

router.post("/admin/members", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const { nome, cpf, turma, senha } = parsed.data;

  const cleanCpf = cpf.replace(/\D/g, "");
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.cpf, cleanCpf)).limit(1);
  if (existing) {
    res.status(400).json({ error: "CPF já cadastrado" });
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ nome, cpf: cleanCpf, turma, senhaHash, isAdmin: false, pontos: 0 })
    .returning();

  await createInstallmentsForUser(user.id);

  res.status(201).json({
    id: user.id,
    nome: user.nome,
    cpf: user.cpf,
    turma: user.turma,
    pontos: user.pontos,
    parcelasPageas: 0,
    totalParcelas: 8,
    totalPago: 0,
  });
});

router.delete("/admin/members/:memberId", requireAdmin, async (req, res): Promise<void> => {
  const memberId = parseInt(req.params.memberId, 10);
  if (isNaN(memberId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, memberId)).limit(1);
  if (!user) { res.status(404).json({ error: "Membro não encontrado" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, memberId));
  res.json({ success: true, message: "Membro removido" });
});

router.get("/admin/members/:memberId/installments", requireAdmin, async (req, res): Promise<void> => {
  const memberId = parseInt(req.params.memberId, 10);
  if (isNaN(memberId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const installments = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.userId, memberId))
    .orderBy(installmentsTable.numero);

  res.json(installments.map(mapInstallment));
});

// GET all paid installments with member info (payment history)
router.get("/admin/payments", requireAdmin, async (req, res): Promise<void> => {
  const paid = await db
    .select({
      installmentId: installmentsTable.id,
      numero: installmentsTable.numero,
      valor: installmentsTable.valor,
      dataPago: installmentsTable.dataPago,
      metodoPagamento: (installmentsTable as any).metodoPagamento,
      userId: installmentsTable.userId,
      memberName: usersTable.nome,
      memberCpf: usersTable.cpf,
    })
    .from(installmentsTable)
    .innerJoin(usersTable, eq(installmentsTable.userId, usersTable.id))
    .where(eq(installmentsTable.status, "pago"))
    .orderBy(desc(installmentsTable.dataPago));

  res.json(
    paid.map((p) => ({
      installmentId: p.installmentId,
      memberName: p.memberName,
      memberCpf: p.memberCpf,
      numero: p.numero,
      valor: parseFloat(p.valor as string),
      dataPago: p.dataPago?.toISOString() ?? null,
      metodoPagamento: p.metodoPagamento ?? null,
    })),
  );
});

router.post("/admin/installments/:installmentId/approve", requireAdmin, async (req, res): Promise<void> => {
  const installmentId = parseInt(req.params.installmentId, 10);
  if (isNaN(installmentId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { isLate, dataPago: dataPagoStr, metodoPagamento } = req.body as {
    isLate: boolean;
    dataPago?: string;
    metodoPagamento?: string;
  };

  const [installment] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  if (!installment) { res.status(404).json({ error: "Parcela não encontrada" }); return; }
  // Parse as local noon to avoid UTC-offset shifting the date to the previous day
  const dataPago = dataPagoStr ? new Date(dataPagoStr + "T12:00:00") : new Date();
  const vencimento = new Date(installment.vencimento);
  const daysLate = differenceInDays(dataPago, vencimento);

  let pontosGanhos = 0;
  if (!isLate && daysLate <= 0) {
    pontosGanhos = 70; // on time: 50 + 20 bonus
  } else if (daysLate <= 7) {
    pontosGanhos = 50; // within 1 week late
  } else {
    pontosGanhos = 50; // paying off late debt
  }

  await db
    .update(installmentsTable)
    .set({
      status: "pago",
      dataPago,
      ...(metodoPagamento ? { metodoPagamento } : {}),
    } as any)
    .where(eq(installmentsTable.id, installmentId));

  await db
    .update(usersTable)
    .set({ pontos: sql`${usersTable.pontos} + ${pontosGanhos}` })
    .where(eq(usersTable.id, installment.userId));

  const [updated] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  res.json(mapInstallment(updated));
});

router.post("/admin/installments/:installmentId/revert", requireAdmin, async (req, res): Promise<void> => {
  const installmentId = parseInt(req.params.installmentId, 10);
  if (isNaN(installmentId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [installment] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  if (!installment) { res.status(404).json({ error: "Parcela não encontrada" }); return; }

  if (installment.status === "pago") {
    await db
      .update(usersTable)
      .set({ pontos: sql`GREATEST(0, ${usersTable.pontos} - 70)` })
      .where(eq(usersTable.id, installment.userId));
  }

  await db
    .update(installmentsTable)
    .set({ status: "pendente", dataPago: null, comprovante: null, metodoPagamento: null } as any)
    .where(eq(installmentsTable.id, installmentId));

  const [updated] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  res.json(mapInstallment(updated));
});

router.post("/admin/installments/:installmentId/atrasado", requireAdmin, async (req, res): Promise<void> => {
  const installmentId = parseInt(req.params.installmentId, 10);
  if (isNaN(installmentId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [installment] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  if (!installment) { res.status(404).json({ error: "Parcela não encontrada" }); return; }

  await db
    .update(installmentsTable)
    .set({ status: "atrasado" })
    .where(eq(installmentsTable.id, installmentId));

  await db
    .update(usersTable)
    .set({ pontos: sql`GREATEST(0, ${usersTable.pontos} - 30)` })
    .where(eq(usersTable.id, installment.userId));

  const [updated] = await db
    .select()
    .from(installmentsTable)
    .where(eq(installmentsTable.id, installmentId))
    .limit(1);

  res.json(mapInstallment(updated));
});

export default router;
