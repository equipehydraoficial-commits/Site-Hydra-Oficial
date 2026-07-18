import { useGetRanking, getGetRankingQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/Layout";
import { Avatar } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

export default function Ranking() {
  const { data: rankingData, isLoading } = useGetRanking({
    query: { queryKey: getGetRankingQueryKey() }
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppLayout>
    );
  }

  const entries = rankingData?.entries || [];
  const top1 = entries[0];
  const others = entries.slice(1);

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col items-center text-center space-y-2 mt-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Ranking</h1>
          <p className="text-muted-foreground text-sm font-medium">Os maiores guerreiros da Hydra.</p>
        </header>

        {top1 && (
          <div className="flex flex-col items-center pt-8 pb-4 relative">
            <div className="absolute top-0 text-yellow-500 z-10 flex flex-col items-center animate-bounce">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 2.45-5.906a.89.89 0 0 1 1.65.233L12 12l1.9-8.673a.89.89 0 0 1 1.65-.233L18 9" />
                <path d="M4 22h16" />
                <path d="M10 14h4" />
                <path d="M12 22v-8" />
                <path d="M5 18 3 9l3-2" />
                <path d="M19 18l2-9-3-2" />
              </svg>
            </div>
            <Avatar className="h-28 w-28 border-4 border-yellow-500 shadow-2xl shadow-yellow-500/30 text-3xl font-black bg-card mb-4 relative z-0">
              {getInitials(top1.nome)}
            </Avatar>
            <h2 className="text-xl font-black text-foreground text-center">{top1.nome}</h2>
            <p className="text-muted-foreground font-bold text-sm tracking-wider uppercase mb-2">Turma {top1.turma}</p>
            <div className="bg-primary/10 text-primary px-6 py-2 rounded-full font-black text-lg border border-primary/20">
              {top1.pontos} pts
            </div>
          </div>
        )}

        <div className="space-y-3">
          {others.map((user) => (
            <div 
              key={user.userId} 
              className="flex items-center p-4 rounded-2xl bg-card border border-card-border shadow-sm"
            >
              <div className="w-8 text-center font-black text-muted-foreground text-lg mr-3">
                {user.rank}
              </div>
              <Avatar className="h-12 w-12 border border-border/50 bg-secondary font-bold mr-4">
                {getInitials(user.nome)}
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{user.nome}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Turma {user.turma}
                </p>
              </div>
              <div className="font-black text-primary text-lg ml-2">
                {user.pontos}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
