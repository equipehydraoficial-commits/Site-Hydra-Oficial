import { AppLayout } from "@/components/Layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6">
        <div className="text-8xl font-black text-primary/20">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Área Restrita</h1>
          <p className="text-muted-foreground">Esta página não existe ou você não tem acesso.</p>
        </div>
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90">
          Voltar para Base
        </Link>
      </div>
    </AppLayout>
  );
}
