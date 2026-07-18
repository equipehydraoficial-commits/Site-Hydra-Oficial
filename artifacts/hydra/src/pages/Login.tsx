import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AuthLayout } from "@/components/Layout";
import { HydraLogo } from "@/components/HydraLogo";
import { Link } from "wouter";
import { maskCPF } from "@/lib/formatters";

const loginSchema = z.object({
  cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
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

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      cpf: "",
      senha: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(
      { data: { cpf: data.cpf.replace(/\D/g, ""), senha: data.senha } },
      {
        onSuccess: (res) => {
          queryClient.setQueryData(getGetMeQueryKey(), res.user);
          if (res.user.isAdmin) {
            setLocation("/admin");
          } else {
            setLocation("/home");
          }
        },
        onError: () => {
          toast({
            title: "Erro ao entrar",
            description: "CPF ou senha incorretos.",
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
      <div className="w-full flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-full flex justify-center">
          <HydraLogo className="w-full max-w-xs" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      className="h-14 text-base bg-card border-none"
                      value={field.value}
                      onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      inputMode="numeric"
                    />
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
                    <Input
                      type="password"
                      placeholder="Senha"
                      className="h-14 text-base bg-card border-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-14 text-lg mt-4"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Não tem conta? Criar conta
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
