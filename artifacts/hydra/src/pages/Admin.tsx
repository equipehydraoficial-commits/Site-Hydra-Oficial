import { useState } from "react";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useGetAdminMembers, getGetAdminMembersQueryKey,
  useCreateMember, useDeleteMember,
  useGetMemberInstallments, getGetMemberInstallmentsQueryKey,
  useApproveInstallment, useRevertInstallment, useMarkInstallmentAtrasado,
  useGetMe, getGetMeQueryKey,
  useLogout,
  useGetPixConfig, getGetPixConfigQueryKey, useUpdatePixConfig,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency, formatDate, formatCPF, maskCPF } from "@/lib/formatters";
import { LogOut, UserPlus, Trash2, ChevronDown, ChevronUp, Paperclip, Check, Clock, Settings, TrendingUp, Calendar, ZoomIn, X as XIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";

const memberSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF inválido"),
  turma: z.string().min(1, "Turma obrigatória"),
  senha: z.string().min(6, "Mínimo 6 caracteres"),
});

const pixSchema = z.object({
  chavePix: z.string().min(5, "Chave Pix obrigatória"),
});

// Payment history types
interface PaymentHistoryItem {
  installmentId: number;
  memberName: string;
  memberCpf: string;
  numero: number;
  valor: number;
  dataPago: string;
  metodoPagamento: string | null;
}

// Fetch payment history from the backend
async function fetchPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const res = await fetch("/api/admin/payments", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);

  // History modals
  const [isTotalHistoryOpen, setIsTotalHistoryOpen] = useState(false);
  const [isMonthHistoryOpen, setIsMonthHistoryOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: user, isLoading: isLoadingUser } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const { data: pixConfig } = useGetPixConfig({
    query: { enabled: !!user?.isAdmin, queryKey: getGetPixConfigQueryKey() },
  });

  const { data: stats } = useGetAdminStats({
    query: { enabled: !!user?.isAdmin, queryKey: getGetAdminStatsQueryKey() },
  });

  const { data: members } = useGetAdminMembers({
    query: { enabled: !!user?.isAdmin, queryKey: getGetAdminMembersQueryKey() },
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: fetchPaymentHistory,
    enabled: !!user?.isAdmin,
  });

  const logoutMutation = useLogout();
  const createMemberMutation = useCreateMember();
  const deleteMemberMutation = useDeleteMember();
  const updatePixMutation = useUpdatePixConfig();

  const newMemberForm = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { nome: "", cpf: "", turma: "", senha: "" },
  });

  const pixForm = useForm<z.infer<typeof pixSchema>>({
    resolver: zodResolver(pixSchema),
    defaultValues: { chavePix: "" },
  });

  // Keep pix form synced with data
  useState(() => {
    if (pixConfig?.chavePix) {
      pixForm.setValue("chavePix", pixConfig.chavePix);
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const onCreateMember = (data: z.infer<typeof memberSchema>) => {
    createMemberMutation.mutate(
      { data: { ...data, cpf: data.cpf.replace(/\D/g, "") } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminMembersQueryKey() });
          toast({ title: "Membro criado com sucesso!" });
          setIsNewMemberModalOpen(false);
          newMemberForm.reset();
        },
        onError: () => {
          toast({ title: "Erro ao criar membro", variant: "destructive" });
        },
      },
    );
  };

  const handleDeleteMember = (memberId: number) => {
    if (confirm("Tem certeza que deseja remover este membro?")) {
      deleteMemberMutation.mutate(
        { memberId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminMembersQueryKey() });
            toast({ title: "Membro removido" });
          },
        },
      );
    }
  };

  const onUpdatePix = (data: z.infer<typeof pixSchema>) => {
    updatePixMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPixConfigQueryKey() });
          toast({ title: "Chave Pix atualizada" });
          setIsPixModalOpen(false);
        },
        onError: () => {
          toast({ title: "Erro ao atualizar chave", variant: "destructive" });
        },
      },
    );
  };

  const toggleMemberExpand = (memberId: number) => {
    setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
  };

  if (isLoadingUser) return null;
  if (!user || !user.isAdmin) {
    setLocation("/");
    return null;
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  // Filter history by selected month
  const filteredHistory = paymentHistory?.filter((p) => {
    if (!p.dataPago) return false;
    const d = new Date(p.dataPago);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return month === selectedMonth;
  }) ?? [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-4 pb-12">
        <header className="flex items-center justify-between mt-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <h1 className="text-xl font-black text-foreground uppercase tracking-wide">Painel Hydra</h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Admin Hydra</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            Sair <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Stats grid — 2x3 (with new Comprovantes card) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Caixa Total — clickable */}
          <Card
            className="border-card-border bg-card cursor-pointer hover:border-primary/40 transition-colors active:scale-[0.98]"
            onClick={() => setIsTotalHistoryOpen(true)}
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Caixa total</span>
                <TrendingUp className="h-3 w-3 text-primary opacity-60" />
              </div>
              <p className="text-lg font-black text-primary">{stats ? formatCurrency(stats.caixaTotal) : "R$ 0,00"}</p>
            </CardContent>
          </Card>

          {/* Mês Atual — clickable */}
          <Card
            className="border-card-border bg-card cursor-pointer hover:border-green-500/40 transition-colors active:scale-[0.98]"
            onClick={() => setIsMonthHistoryOpen(true)}
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mês atual</span>
                <Calendar className="h-3 w-3 text-green-500 opacity-60" />
              </div>
              <p className="text-lg font-black text-green-500">{stats ? formatCurrency(stats.caixaMesAtual) : "R$ 0,00"}</p>
            </CardContent>
          </Card>

          {/* Membros */}
          <Card className="border-card-border bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Membros</span>
              <p className="text-lg font-black text-foreground">{stats?.totalMembros || 0}</p>
            </CardContent>
          </Card>

          {/* Atrasados (formerly Inadimp.) */}
          <Card className="border-card-border bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atrasados</span>
              <p className="text-lg font-black text-destructive">{(stats as any)?.inadimplentes || 0}</p>
            </CardContent>
          </Card>

          {/* Comprovantes Pendentes — full width */}
          <Card className="border-card-border bg-card col-span-2">
            <CardContent className="p-4 space-y-1 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Comprovantes em análise
                </span>
                <p className="text-lg font-black text-yellow-400">
                  {(stats as any)?.comprovantesAndamento ?? 0}
                </p>
              </div>
              <Clock className="h-5 w-5 text-yellow-400/60" />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            onClick={() => {
              pixForm.setValue("chavePix", pixConfig?.chavePix || "");
              setIsPixModalOpen(true);
            }}
            className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
          >
            <Settings className="h-4 w-4" /> Chave Pix
          </Button>
          <Button onClick={() => setIsNewMemberModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" /> Novo Membro
          </Button>
        </div>

        <div className="space-y-3">
          {members?.map((member) => (
            <div key={member.id} className="rounded-2xl border border-card-border bg-card overflow-hidden">
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-border/50 bg-secondary font-bold text-xs">
                        {getInitials(member.nome)}
                      </Avatar>
                      {(member as any).comprovantesAndamento > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 border-2 border-background flex items-center justify-center">
                          <span className="text-[8px] font-black text-background leading-none">
                            {(member as any).comprovantesAndamento}
                          </span>
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm">{member.nome}</h3>
                        {(member as any).comprovantesAndamento > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400 uppercase tracking-wide">
                            <Clock className="h-2.5 w-2.5" />
                            Em análise
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{formatCPF(member.cpf)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleMemberExpand(member.id)}
                    >
                      {expandedMemberId === member.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                  <span>{member.parcelasPageas}/{member.totalParcelas} pagas</span>
                  <span className="text-primary font-bold">{member.pontos} pts</span>
                  <span className="uppercase tracking-wider">T.{member.turma}</span>
                </div>
              </div>

              {expandedMemberId === member.id && (
                <div className="border-t border-card-border bg-secondary/20 p-4">
                  <MemberInstallments
                    memberId={member.id}
                    onApproved={() => queryClient.invalidateQueries({ queryKey: ["admin", "payments"] })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* === New Member Modal === */}
        <Dialog open={isNewMemberModalOpen} onOpenChange={setIsNewMemberModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Membro</DialogTitle>
            </DialogHeader>
            <Form {...newMemberForm}>
              <form onSubmit={newMemberForm.handleSubmit(onCreateMember)} className="space-y-4 pt-4">
                <FormField
                  control={newMemberForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newMemberForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          value={field.value}
                          onChange={(e) => field.onChange(maskCPF(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newMemberForm.control}
                    name="turma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <FormControl>
                          <Input placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newMemberForm.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createMemberMutation.isPending} className="w-full">
                    {createMemberMutation.isPending ? "Criando..." : "Criar Membro"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* === Pix Modal === */}
        <Dialog open={isPixModalOpen} onOpenChange={setIsPixModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar Chave Pix</DialogTitle>
            </DialogHeader>
            <Form {...pixForm}>
              <form onSubmit={pixForm.handleSubmit(onUpdatePix)} className="space-y-4 pt-4">
                <FormField
                  control={pixForm.control}
                  name="chavePix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Pix (E-mail, CPF, Celular, etc)</FormLabel>
                      <FormControl>
                        <Input placeholder="chave@pix.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={updatePixMutation.isPending} className="w-full">
                    {updatePixMutation.isPending ? "Atualizando..." : "Salvar Chave Pix"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* === Total History Modal === */}
        <Dialog open={isTotalHistoryOpen} onOpenChange={setIsTotalHistoryOpen}>
          <DialogContent className="sm:max-w-md w-[90%] bg-card border-card-border rounded-2xl p-0 gap-0">
            <div className="p-5 pb-3 border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 text-base font-black uppercase">
                <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                Histórico Geral de Pagamentos
              </DialogTitle>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-5 space-y-2">
              {!paymentHistory?.length ? (
                <p className="text-center text-muted-foreground text-sm py-8">Nenhum pagamento registrado.</p>
              ) : (
                paymentHistory.map((p) => (
                  <div key={p.installmentId} className="flex items-center justify-between p-3 rounded-xl bg-background border border-card-border">
                    <div>
                      <p className="font-bold text-sm text-foreground">{p.memberName}</p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {p.numero} • {p.dataPago ? formatDate(p.dataPago) : "—"}
                        {p.metodoPagamento && ` • ${p.metodoPagamento}`}
                      </p>
                    </div>
                    <span className="font-black text-primary text-sm">{formatCurrency(p.valor)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Total: <span className="font-black text-primary">{formatCurrency(paymentHistory?.reduce((s, p) => s + p.valor, 0) ?? 0)}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* === Month History Modal === */}
        <Dialog open={isMonthHistoryOpen} onOpenChange={setIsMonthHistoryOpen}>
          <DialogContent className="sm:max-w-md w-[90%] bg-card border-card-border rounded-2xl p-0 gap-0">
            <div className="p-5 pb-3 border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 text-base font-black uppercase">
                <Calendar className="h-5 w-5 text-green-500 shrink-0" />
                Pagamentos por Mês
              </DialogTitle>
            </div>
            <div className="p-5 space-y-4">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-background border-card-border w-full min-w-0 max-w-full"
              />
              <div className="overflow-y-auto max-h-[40vh] space-y-2">
                {!filteredHistory.length ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhum pagamento neste mês.</p>
                ) : (
                  filteredHistory.map((p) => (
                    <div key={p.installmentId} className="flex items-center justify-between p-3 rounded-xl bg-background border border-card-border">
                      <div>
                        <p className="font-bold text-sm text-foreground">{p.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          Parcela {p.numero} • {p.dataPago ? formatDate(p.dataPago) : "—"}
                          {p.metodoPagamento && ` • ${p.metodoPagamento}`}
                        </p>
                      </div>
                      <span className="font-black text-green-500 text-sm">{formatCurrency(p.valor)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Total do mês: <span className="font-black text-green-500">{formatCurrency(filteredHistory.reduce((s, p) => s + p.valor, 0))}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Separate component for member installments
function MemberInstallments({ memberId, onApproved }: { memberId: number; onApproved?: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: installments, isLoading } = useGetMemberInstallments(memberId, {
    query: { queryKey: getGetMemberInstallmentsQueryKey(memberId) },
  });

  const approveMutation = useApproveInstallment();
  const revertMutation = useRevertInstallment();
  const markAtrasadoMutation = useMarkInstallmentAtrasado();

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<{ id: number; isLate: boolean } | null>(null);
  const [approveDate, setApproveDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [approveMethod, setApproveMethod] = useState<string>("Pix");

  const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Outros"];

  const openApproveModal = (installmentId: number, isLate: boolean) => {
    setApproveTarget({ id: installmentId, isLate });
    setApproveDate(new Date().toISOString().split("T")[0]);
    setApproveMethod("Pix");
  };

  const confirmApprove = () => {
    if (!approveTarget) return;
    approveMutation.mutate(
      {
        installmentId: approveTarget.id,
        data: { isLate: approveTarget.isLate, dataPago: approveDate, metodoPagamento: approveMethod } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMemberInstallmentsQueryKey(memberId) });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminMembersQueryKey() });
          onApproved?.();
          toast({ title: "Pagamento aprovado" });
          setApproveTarget(null);
        },
      },
    );
  };

  const handleRevert = (installmentId: number) => {
    revertMutation.mutate(
      { installmentId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMemberInstallmentsQueryKey(memberId) });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminMembersQueryKey() });
          toast({ title: "Status revertido para pendente" });
        },
      },
    );
  };

  const handleMarkAtrasado = (installmentId: number) => {
    markAtrasadoMutation.mutate(
      { installmentId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMemberInstallmentsQueryKey(memberId) });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminMembersQueryKey() });
          toast({ title: "Marcado como atrasado" });
        },
      },
    );
  };

  const isEmAnalise = (inst: any) => !!inst.comprovante && inst.status !== "pago";

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Carregando parcelas...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Parcelas do Membro
        </h4>
        <div className="space-y-2">
          {installments?.map((inst) => (
            <div key={inst.id} className="flex flex-col gap-3 p-3 rounded-xl bg-card border border-card-border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                    {inst.numero}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{formatCurrency(inst.valor)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      Vence: {formatDate(inst.vencimento)}
                      {inst.dataPago && ` • Pago: ${formatDate(inst.dataPago)}`}
                    </p>
                  </div>
                </div>
                <div>
                  {inst.status === "pago" ? (
                    <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                      PAGO
                    </Badge>
                  ) : isEmAnalise(inst) ? (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> EM ANÁLISE
                    </Badge>
                  ) : inst.status === "atrasado" ? (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                      ATRASADO
                    </Badge>
                  ) : (
                    <Badge variant="muted" className="bg-muted text-muted-foreground border-muted-foreground/20 text-[10px]">
                      PENDENTE
                    </Badge>
                  )}
                </div>
              </div>

              {inst.comprovante && (
                <ComprovantePreview src={inst.comprovante} />
              )}

              <div className="flex gap-2 border-t border-border/50 pt-3">
                {inst.status === "pago" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 text-muted-foreground"
                    onClick={() => handleRevert(inst.id)}
                    disabled={revertMutation.isPending}
                  >
                    Reverter para Pendente
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs h-8 gap-1"
                      onClick={() => openApproveModal(inst.id, inst.status === "atrasado")}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-3 w-3" /> Pago
                    </Button>
                    {inst.status === "pendente" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs h-8 gap-1"
                        onClick={() => handleMarkAtrasado(inst.id)}
                        disabled={markAtrasadoMutation.isPending}
                      >
                        <Clock className="h-3 w-3" /> Atrasado
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === Approve Confirmation Modal === */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-sm w-[90%] bg-card border-card-border rounded-2xl p-0 gap-0">
          <div className="p-5 pb-3 border-b border-border/50">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-center">
              Confirmar Pagamento
            </DialogTitle>
          </div>

          <div className="p-5 space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data do Pagamento
              </label>
              <Input
                type="date"
                value={approveDate}
                onChange={(e) => setApproveDate(e.target.value)}
                className="bg-background border-card-border text-foreground w-full min-w-0 max-w-full"
              />
            </div>

            {/* Payment method */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setApproveMethod(m)}
                    className={`rounded-xl px-3 py-3 text-sm font-bold border transition-all ${
                      approveMethod === m
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                        : "bg-[#080d1a] text-muted-foreground border-[#1e2d4a] hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 pt-0 space-y-2">
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12"
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Confirmando..." : "Confirmar"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground h-10"
              onClick={() => setApproveTarget(null)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline comprovante preview with lightbox
function ComprovantePreview({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 mb-1 w-full rounded-xl overflow-hidden border border-primary/20 hover:border-primary/60 transition-colors relative group"
      >
        <img
          src={src}
          alt="Comprovante"
          className="w-full max-h-40 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/80 backdrop-blur-sm border-t border-primary/20">
          <Paperclip className="h-3 w-3 text-primary" />
          <span className="text-xs text-primary font-medium">Ver Comprovante</span>
        </div>
      </button>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt="Comprovante"
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
