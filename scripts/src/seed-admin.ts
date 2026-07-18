import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const hash = await bcrypt.hash("admin123", 10);

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.cpf, "00000000000"))
    .limit(1);

  if (existing) {
    await db.update(usersTable).set({ senhaHash: hash }).where(eq(usersTable.cpf, "00000000000"));
    console.log("Admin password updated");
  } else {
    await db
      .insert(usersTable)
      .values({
        nome: "Admin Hydra",
        cpf: "00000000000",
        turma: "Admin",
        senhaHash: hash,
        isAdmin: true,
        pontos: 0,
      });
    console.log("Admin created");
  }

  process.exit(0);
}

seedAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
