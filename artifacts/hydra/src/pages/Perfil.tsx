import { useState } from "react";
import { useGetMe, getGetMeQueryKey, useLogout, useUpdateProfileName, useUpdateProfilePassword, useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/Layout";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency, formatCPF } from "@/lib/formatters";
import { LogOut, Pencil, Key, Medal, DollarSign, CreditCard, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const nameSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

const passwordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export default function Perfil() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  const { data: dashboard } = useGetDashboard({
    query: { 
      enabled: !!user,
      queryKey: getGetDashboardQueryKey() 
    }
  });

  const logoutMutation = useLogout();
  const updateNameMutation = useUpdateProfileName();
  const updatePasswordMutation = useUpdateProfilePassword();

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { nome: user?.nome || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { senhaAtual: "", novaSenha: "" },
  });

  // Reset forms when user data loads or changes
  useState(() => {
    if (user?.nome) {
      nameForm.setValue("nome", user.nome);
    }
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      }
    });
  };

  const onUpdateName = (data: z.infer<typeof nameSchema>) => {
    updateNameMutation.mutate({ data }, {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
        toast({ title: "Nome atualizado com sucesso!" });
        setIsNameModalOpen(false);
      },
      onError: () => {
        toast({ title: "Erro ao atualizar nome", variant: "destructive" });
      }
    });
  };

  const onUpdatePassword = (data: z.infer<typeof passwordSchema>) => {
    updatePasswordMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Senha atualizada com sucesso!" });
        setIsPasswordModalOpen(false);
        passwordForm.reset();
      },
      onError: () => {
        toast({ title: "Erro ao atualizar senha", description: "Verifique sua senha atual e tente novamente.", variant: "destructive" });
      }
    });
  };

  if (isLoadingUser || !user) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mt-6">
          <Avatar className="h-28 w-28 border-4 border-card-border shadow-2xl text-3xl font-black bg-gradient-to-br from-primary/20 to-primary/60 text-primary mb-4">
            {getInitials(user.nome)}
          </Avatar>
          <h1 className="text-2xl font-black text-foreground text-center">{user.nome}</h1>
          <div className="flex items-center gap-2 mt-2 bg-secondary px-4 py-1.5 rounded-full border border-border">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Turma {user.turma}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-card-border bg-card overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <Medal className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pontos</span>
              <span className="text-2xl font-black text-foreground">{user.pontos}</span>
            </CardContent>
          </Card>
          
          <Card className="border-card-border bg-card overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Pago</span>
              <span className="text-2xl font-black text-foreground">
                {dashboard ? formatCurrency(dashboard.totalContribuido) : "R$ 0,00"}
              </span>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border bg-card">
          <CardContent className="p-0 divide-y divide-border/50">
            <div className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CPF</p>
                <p className="text-sm font-medium text-foreground">{formatCPF(user.cpf)}</p>
              </div>
            </div>

            <button 
              onClick={() => {
                nameForm.setValue("nome", user.nome);
                setIsNameModalOpen(true);
              }}
              className="w-full flex items-center gap-4 p-5 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Pencil className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Editar Nome</p>
                <p className="text-xs text-muted-foreground">Como você aparece no ranking</p>
              </div>
            </button>

            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center gap-4 p-5 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Mudar Senha</p>
                <p className="text-xs text-muted-foreground">Atualize sua credencial de acesso</p>
              </div>
            </button>
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          className="w-full h-14 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold text-base mt-4 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" /> Sair da conta
        </Button>

        {/* Modals */}
        <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Nome</DialogTitle>
            </DialogHeader>
            <Form {...nameForm}>
              <form onSubmit={nameForm.handleSubmit(onUpdateName)} className="space-y-4 pt-4">
                <FormField
                  control={nameForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de exibição</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={updateNameMutation.isPending} className="w-full">
                    {updateNameMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mudar Senha</DialogTitle>
            </DialogHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4 pt-4">
                <FormField
                  control={passwordForm.control}
                  name="senhaAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha atual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="novaSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={updatePasswordMutation.isPending} className="w-full">
                    {updatePasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
