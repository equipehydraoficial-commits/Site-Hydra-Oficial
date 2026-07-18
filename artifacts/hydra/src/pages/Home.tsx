import { useGetDashboard, getGetDashboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ArrowRight, Wallet, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetMe({ 
    query: { 
      retry: false,
      queryKey: getGetMeQueryKey()
    } 
  });

  useEffect(() => {
    if (!isLoadingUser && !user) {
      setLocation("/");
    }
  }, [user, isLoadingUser, setLocation]);

  const { data: dashboard, isLoading: isLoadingDashboard } = useGetDashboard({
    query: {
      enabled: !!user,
      queryKey: getGetDashboardQueryKey()
    }
  });

  if (isLoadingUser || isLoadingDashboard) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppLayout>
    );
  }

  if (!dashboard || !user) return null;

  const progressPercent = dashboard.totalParcelas > 0 
    ? Math.round((dashboard.parcelasPageas / dashboard.totalParcelas) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Salve, <span className="text-primary">{user.nome.split(" ")[0]}</span>!
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Sua contribuição fortalece a Hydra.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Meu Plano</h2>
          <Card className="border-card-border shadow-xl shadow-black/40 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wallet className="w-32 h-32" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="space-y-1 mb-6">
                <p className="text-sm font-medium text-muted-foreground">Saldo Contribuído</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{formatCurrency(dashboard.totalContribuido)}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  de {formatCurrency(dashboard.totalPlano)} no total
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Progresso ({dashboard.parcelasPageas}/{dashboard.totalParcelas})</span>
                  <span className="text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </section>

        {dashboard.nextInstallment && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Próximo Vencimento</h2>
            <Card className="border-card-border bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Parcela {dashboard.nextInstallment.numero}</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Vence em {formatDate(dashboard.nextInstallment.vencimento)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-black text-lg text-foreground mb-1">
                    {formatCurrency(dashboard.nextInstallment.valor)}
                  </span>
                  <Link href="/contribuir" className="text-primary text-xs font-bold flex items-center gap-1 hover:text-primary/80 transition-colors uppercase tracking-wider">
                    Pagar <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
