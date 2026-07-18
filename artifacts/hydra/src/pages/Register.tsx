import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AuthLayout } from "@/components/Layout";
import { Link } from "wouter";
import { maskCPF } from "@/lib/formatters";

const registerSchema = z
  .object({
    nome: z.string().min(2, "Nome é obrigatório"),
    cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF inválido"),
    turma: z.string().min(1, "Turma é obrigatória"),
    senha: z.string().min(6, "Mínimo 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/home");
      }
    }
  }, [user, setLocation]);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      turma: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const registerMutation = useRegister();

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(
      {
        data: {
          nome: data.nome,
          cpf: data.cpf.replace(/\D/g, ""),
          turma: data.turma,
          senha: data.senha,
        },
      },
      {
        onSuccess: (res) => {
          queryClient.setQueryData(getGetMeQueryKey(), res.user);
          setLocation("/home");
        },
        onError: () => {
          toast({
            title: "Erro no cadastro",
            description: "Verifique os dados e tente novamente.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isLoadingUser) return null;
  if (user) return null;

  return (
    <AuthLayout>
      <div className="w-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">JUNTE-SE À HYDRA</h1>
          <p className="text-muted-foreground text-sm">Crie sua conta para acompanhar seu apoio.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Nome Completo" className="bg-card border-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      className="bg-card border-none"
                      inputMode="numeric"
                      value={field.value}
                      onChange={(e) => field.onChange(maskCPF(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="turma"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Turma (Ex: 100, 200...)" className="bg-card border-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Senha" className="bg-card border-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirmar Senha"
                      className="bg-card border-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-14 text-base mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Cadastrando..." : "CADASTRAR"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Já é da equipe? Fazer login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
