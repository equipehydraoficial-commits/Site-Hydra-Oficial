import { AppLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, AlertTriangle, Coins, Target } from "lucide-react";

export default function Pontos() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Como Ganhar Pontos</h1>
          <p className="text-muted-foreground text-sm font-medium">Seu compromisso define sua posição.</p>
        </header>

        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 space-y-2">
          <p className="text-primary text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="h-5 w-5" />
            O Sistema
          </p>
          <p className="text-sm text-primary/80 leading-relaxed font-medium">
            Pontos são a moeda de respeito na Hydra. Eles refletem seu comprometimento com o esquadrão. Pagamentos em dia garantem sua ascensão no ranking.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Regras de Pontuação</h2>
          
          <div className="space-y-3">
            <Card className="border-card-border bg-card/80 overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="w-2 bg-green-500"></div>
                <div className="p-4 flex-1 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-1">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Pago no Prazo</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">Pagamento confirmado até a data de vencimento.</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 font-bold text-sm">
                      +50 pts <span className="text-xs font-medium opacity-80">+ bônus 20 pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border bg-card/80 overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="w-2 bg-yellow-500"></div>
                <div className="p-4 flex-1 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Atraso Curto</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">Pagamento com até 1 semana de atraso.</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-sm">
                      +50 pts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border bg-card/80 overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="w-2 bg-red-500"></div>
                <div className="p-4 flex-1 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Atraso Grave</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">Mais de 1 semana sem pagar a parcela.</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm">
                      -30 pts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border bg-card/80 overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="w-2 bg-blue-500"></div>
                <div className="p-4 flex-1 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Coins className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Recuperação</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">Pago após o desconto de pontos por atraso.</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold text-sm">
                      +50 pts <span className="text-xs font-medium opacity-80">(recupera a base)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Como Funciona o Processo</h2>
          <Card className="border-card-border bg-card">
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-secondary text-foreground font-black flex items-center justify-center shrink-0 border border-border">1</div>
                <div>
                  <h4 className="font-bold text-foreground">Faça o Pix</h4>
                  <p className="text-sm text-muted-foreground mt-1">Copie a chave na aba Contribuir e realize o pagamento.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-secondary text-foreground font-black flex items-center justify-center shrink-0 border border-border">2</div>
                <div>
                  <h4 className="font-bold text-foreground">Envie o comprovante</h4>
                  <p className="text-sm text-muted-foreground mt-1">Anexe a imagem ou PDF do comprovante no app.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-secondary text-foreground font-black flex items-center justify-center shrink-0 border border-border">3</div>
                <div>
                  <h4 className="font-bold text-foreground">Aguarde a confirmação</h4>
                  <p className="text-sm text-muted-foreground mt-1">A administração irá verificar e validar seu pagamento.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">4</div>
                <div>
                  <h4 className="font-bold text-primary">Suba no ranking</h4>
                  <p className="text-sm text-muted-foreground mt-1">Seus pontos são creditados automaticamente após a aprovação.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
