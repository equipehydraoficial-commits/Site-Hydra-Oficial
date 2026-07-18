import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, installmentsTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { addMonths, format } from "date-fns";

const router = Router();

// Installments are always fixed: March (3) through November (11) = 9 parcelas of R$8.00
// Months are fixed regardless of when the account is created.
const INSTALLMENT_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11]; // March–November
const INSTALLMENT_VALOR = "8.00";

async function createInstallmentsForUser(userId: number): Promise<void> {
  const year = new Date().getFullYear();
  const installments = INSTALLMENT_MONTHS.map((month, i) => ({
    userId,
    numero: i + 1,
    valor: INSTALLMENT_VALOR,
    // day 1 of that month, formatted as yyyy-MM-dd
    vencimento: format(new Date(year, month - 1, 1), "yyyy-MM-dd"),
    status: "pendente" as const,
  }));
  await db.insert(installmentsTable).values(installments);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const { cpf, senha } = parsed.data;

  const cleanCpf = cpf.replace(/\D/g, "");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.cpf, cleanCpf)).limit(1);

  if (!user) {
    res.status(401).json({ error: "CPF ou senha inválidos" });
    return;
  }

  const valid = await bcrypt.compare(senha, user.senhaHash);
  if (!valid) {
    res.status(401).json({ error: "CPF ou senha inválidos" });
    return;
  }

  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;

  res.json({
    user: {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      turma: user.turma,
      isAdmin: user.isAdmin,
      pontos: user.pontos,
    },
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
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

  req.session.userId = user.id;
  req.session.isAdmin = false;

  res.status(201).json({
    user: {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      turma: user.turma,
      isAdmin: user.isAdmin,
      pontos: user.pontos,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: user.id,
    nome: user.nome,
    cpf: user.cpf,
    turma: user.turma,
    isAdmin: user.isAdmin,
    pontos: user.pontos,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ success: true, message: "Logged out" });
});

export default router;
