import { useGetMyInstallments, getGetMyInstallmentsQueryKey, useGetPixConfig, getGetPixConfigQueryKey, useSubmitComprovante } from "@workspace/api-client-react";
import { AppLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { QrCode, Copy, UploadCloud, X, CheckCircle2, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { Installment } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Contribuir() {
  const { data: installments, isLoading: isLoadingInstallments } = useGetMyInstallments({
    query: { queryKey: getGetMyInstallmentsQueryKey() },
  });

  const { data: pixConfig } = useGetPixConfig({
    query: { queryKey: getGetPixConfigQueryKey() },
  });

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovanteBase64, setComprovanteBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const submitComprovanteMutation = useSubmitComprovante();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprovanteFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprovanteBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setComprovanteFile(null);
    setComprovanteBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyPixKey = () => {
    if (pixConfig?.chavePix) {
      navigator.clipboard.writeText(pixConfig.chavePix);
      toast({
        title: "Chave Pix copiada!",
        description: "Cole no seu aplicativo de banco para realizar o pagamento.",
      });
    }
  };

  const handleSubmitComprovante = () => {
    if (!selectedInstallment || !comprovanteBase64) return;

    submitComprovanteMutation.mutate(
      {
        installmentId: selectedInstallment.id,
        data: { comprovante: comprovanteBase64 },
      },
      {
        onSuccess: () => {
          toast({
            title: "Comprovante enviado!",
            description: "Seu pagamento será analisado e confirmado em breve.",
          });
          queryClient.invalidateQueries({ queryKey: getGetMyInstallmentsQueryKey() });
          setSelectedInstallment(null);
          removeFile();
        },
        onError: () => {
          toast({
            title: "Erro ao enviar",
            description: "Ocorreu um erro ao enviar o comprovante. Tente novamente.",
            variant: "destructive",
          });
        },
      },
    );
  };

  // An installment is "em análise" when it has a comprovante but isn't yet paid
  const isEmAnalise = (inst: Installment) =>
    !!inst.comprovante && inst.status !== "pago";

  const getStatusBadge = (inst: Installment) => {
    if (inst.status === "pago") {
      return (
        <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
          Pago
        </Badge>
      );
    }
    if (isEmAnalise(inst)) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Em Análise
        </Badge>
      );
    }
    if (inst.status === "atrasado") {
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
          Atrasado
        </Badge>
      );
    }
    return (
      <Badge variant="muted" className="bg-muted text-muted-foreground border-muted-foreground/20">
        Pendente
      </Badge>
    );
  };

  if (isLoadingInstallments) {
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
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Contribuições</h1>
          <p className="text-muted-foreground text-sm font-medium">Acompanhe seu histórico de apoio.</p>
        </header>

        <div className="space-y-4">
          {installments?.map((installment) => (
            <Card key={installment.id} className="border-card-border bg-card/80 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-foreground">Parcela {installment.numero}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vence em {formatDate(installment.vencimento)}
                      </p>
                    </div>
                    {getStatusBadge(installment)}
                  </div>

                  {/* Em análise notice */}
                  {isEmAnalise(installment) && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                      <Clock className="h-4 w-4 text-yellow-400 shrink-0" />
                      <p className="text-xs font-medium text-yellow-400">
                        Comprovante enviado — aguardando confirmação do admin.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-end mt-2 pt-4 border-t border-border/50">
                    <span className="font-black text-xl text-foreground">
                      {formatCurrency(installment.valor)}
                    </span>

                    {/* Only show Pay button when there's no comprovante yet */}
                    {(installment.status === "pendente" || installment.status === "atrasado") &&
                      !installment.comprovante && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedInstallment(installment)}
                          className="gap-2 font-bold shadow-lg shadow-primary/20"
                        >
                          <QrCode className="h-4 w-4" />
                          Pagar via Pix
                        </Button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedInstallment} onOpenChange={(open) => !open && setSelectedInstallment(null)}>
          <DialogContent className="sm:max-w-md bg-card border-card-border p-0 overflow-hidden gap-0">
            <div className="p-6 pb-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase">
                  Pagar Parcela {selectedInstallment?.numero}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  Vencimento: {selectedInstallment && formatDate(selectedInstallment.vencimento)}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* How to pay — centered */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 space-y-2 text-center">
                <p className="text-primary text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                    i
                  </span>
                  Como pagar
                </p>
                <p className="text-sm text-primary/80 leading-relaxed">
                  Copie a chave Pix abaixo, realize o pagamento no seu banco e anexe o comprovante para análise.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-muted-foreground">Valor</span>
                  <span className="text-xl font-black text-foreground">
                    {selectedInstallment && formatCurrency(selectedInstallment.valor)}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground px-2">Chave Pix (E-mail)</span>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={pixConfig?.chavePix || "Carregando..."}
                      className="bg-input font-mono text-foreground border-transparent"
                    />
                    <Button variant="secondary" size="icon" onClick={copyPixKey} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Comprovante
                </span>

                {!comprovanteFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-card-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">Clique para anexar</p>
                      <p className="text-xs text-muted-foreground mt-1">Imagens ou PDF</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium text-green-500 truncate">
                        {comprovanteFile.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/20 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="p-6 pt-4 bg-secondary/30">
              <Button
                className="w-full h-12 font-bold text-base"
                disabled={!comprovanteFile || submitComprovanteMutation.isPending}
                onClick={handleSubmitComprovante}
              >
                {submitComprovanteMutation.isPending ? "Enviando..." : "Enviar Comprovante"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
