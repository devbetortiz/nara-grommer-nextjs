"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useUserRole } from "@/hooks/useUserRole";
import { Header } from "@/components/Header";


const clientSchema = z.object({
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  postal_code: z.string().min(1, "CEP é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  emergency_name: z.string().min(1, "Nome do contato de emergência é obrigatório"),
  emergency_phone: z.string().min(1, "Telefone do contato de emergência é obrigatório"),
  emergency_relationship: z.string().min(1, "Parentesco é obrigatório"),
});

type ClientFormData = z.infer<typeof clientSchema>;

const ClientRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuth();
  const { hasClientData, loading: clientDataLoading } = useClientData();
  const { isAdmin } = useUserRole();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: "",
      cpf: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      postal_code: "",
      phone: "",
      emergency_name: "",
      emergency_phone: "",
      emergency_relationship: "",
    },
  });

  useEffect(() => {
    if (!clientDataLoading && hasClientData) {
      toast({
        title: "Aviso",
        description: "Você já possui um cadastro de cliente.",
        variant: "default",
      });
      router.push("/");
    }
  }, [hasClientData, clientDataLoading, router, toast]);

  if (clientDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verificando dados...</p>
        </div>
      </div>
    );
  }

  const buildAddress = (data: ClientFormData) => {
    return JSON.stringify({
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code
    });
  };

  const buildEmergencyContact = (data: ClientFormData) => {
    return JSON.stringify({
      name: data.emergency_name,
      phone: data.emergency_phone,
      relationship: data.emergency_relationship
    });
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para cadastrar suas informações.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const addressString = buildAddress(data);
      const emergencyContactString = buildEmergencyContact(data);

      let result;
      if (existingProfile) {
        result = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            cpf: data.cpf,
            address: addressString,
            phone: data.phone,
            emergency_contact: emergencyContactString,
          })
          .eq('id', user.id);
      } else {
        result = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: data.full_name,
            cpf: data.cpf,
            address: addressString,
            phone: data.phone,
            emergency_contact: emergencyContactString,
          });
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Sucesso",
        description: "Suas informações foram salvas com sucesso!",
      });

      form.reset();

      if (isAdmin) {
        router.push("/dashboard");
      } else {
        router.push("/clients/welcome");
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: (error as { message?: string })?.message || "Erro ao salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
      <Header
        title="Meu Cadastro de Cliente"
        subtitle="Cadastre-se como cliente"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Meus Dados de Cliente
              </CardTitle>
              <CardDescription>
                Cadastre-se como cliente para gerenciar seus pets e agendamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo" {...field} />
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
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da rua" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Número" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="Estado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input placeholder="00000-000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contato de Emergência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergency_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do contato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergency_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(00) 00000-0000"
                                {...field}
                                onChange={(e) => {
                                  const formatted = formatPhone(e.target.value);
                                  field.onChange(formatted);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergency_relationship"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Parentesco</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Pai, Mãe, Cônjuge, Irmão(ã)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? "Salvando..." : "Salvar Meus Dados"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientRegistration;