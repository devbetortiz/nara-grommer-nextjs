"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, PawPrint, Calendar, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const ClientWelcome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [clientName, setClientName] = useState("");

  // Redirecionar administradores para o dashboard
  useEffect(() => {
    if (!roleLoading && isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, roleLoading, router.push]);

  useEffect(() => {
    const fetchClientName = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching client name:", error);
        } else if (data && data.full_name) {
          setClientName(data.full_name);
        } else if (data) {
          setClientName("Cliente");
        }
      } catch (error) {
        console.error("Error fetching client name:", error);
      }
    };

    fetchClientName();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Welcome Animation */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 p-8 rounded-full animate-pulse">
              <Heart className="h-16 w-16 text-primary" />
            </div>
          </div>
          <div className="relative z-10 pt-24">
            <div className="flex justify-center space-x-2 text-4xl mb-4">
              <span className="animate-bounce">🎉</span>
              <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>🐕</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>💖</span>
              <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>🐱</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>✨</span>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-foreground">
              Bem-vindo ao Nara Groomer, {clientName}! 🎊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg text-muted-foreground">
              <p className="mb-4">
                É um prazer tê-lo conosco! Seu cadastro foi realizado com sucesso e agora você pode aproveitar todos os nossos serviços.
              </p>
              <p>
                Estamos prontos para cuidar do seu pet com todo o carinho e profissionalismo que ele merece. 🐾
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-primary/5 p-6 rounded-lg space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Próximos Passos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <PawPrint className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">1. Cadastre seus Pets</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione as informações dos seus amiguinhos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">2. Agende um Serviço</h4>
                    <p className="text-sm text-muted-foreground">
                      Reserve banho e tosa para seus pets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => router.push("/pets")}
                className="flex-1 gap-2"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Cadastrar Meus Pets
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Ir para Início
              </Button>
            </div>

            {/* Service Highlights */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                O que oferecemos para seu pet:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-1">🛁</div>
                  <p className="text-sm font-medium">Banho Relaxante</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-1">✂️</div>
                  <p className="text-sm font-medium">Tosa Higiênica</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-1">💇</div>
                  <p className="text-sm font-medium">Tosa Completa</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-1">💆</div>
                  <p className="text-sm font-medium">Hidratação</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Dúvidas? Entre em contato conosco! Estamos aqui para ajudar você e seu pet. 💝
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientWelcome;