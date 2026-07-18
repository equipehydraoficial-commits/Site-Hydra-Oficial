import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, installmentsTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { addMonths, format } from "date-fns";

const router = Router();

// Helper to create 8 installments for a new user
async function createInstallmentsForUser(userId: number): Promise<void> {
  const now = new Date();
  const installments = Array.from({ length: 8 }, (_, i) => {
    const vencimento = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), i + 1);
    return {
      userId,
      numero: i + 1,
      valor: "7.50",
      vencimento: format(vencimento, "yyyy-MM-dd"),
      status: "pendente" as const,
    };
  });
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
