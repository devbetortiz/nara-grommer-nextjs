"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { Plus, Eye, Edit, Trash2, PawPrint, ArrowLeft, Heart, LogOut, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useClientData } from "@/hooks/useClientData";
import { Header } from "@/components/Header";

interface Profile {
  id: string;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  pets_count?: number;
}

const Clients = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    zipCode: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: ""
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { hasClientData, loading: clientDataLoading } = useClientData();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          cpf,
          phone,
          address,
          emergency_contact,
          created_at
        `)
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Buscar contagem de pets
      const { count } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setProfile({ ...profileData, pets_count: count || 0 });
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      if (error.code !== 'PGRST116') {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do perfil",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para parsear endereço do formato string para campos separados
  const parseAddress = (address: string) => {
    if (!address) return {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      zipCode: ""
    };

    try {
      // Tenta fazer parse como JSON primeiro
      const parsed = JSON.parse(address);
      return {
        street: parsed.street || "",
        number: parsed.number || "",
        complement: parsed.complement || "",
        neighborhood: parsed.neighborhood || "",
        city: parsed.city || "",
        zipCode: parsed.postal_code || ""
      };
    } catch {
      // Se não for JSON, tenta parse como string separada por vírgulas
      const parts = address.split('\n').join(', ').split(', ');
      return {
        street: parts[0] || "",
        number: parts[1] || "",
        complement: parts[2] || "",
        neighborhood: parts[3] || "",
        city: parts[4] || "",
        zipCode: parts[5] || ""
      };
    }
  };

  // Função para parsear contato de emergência do formato string para campos separados
  const parseEmergencyContact = (contact: string) => {
    if (!contact) return {
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: ""
    };

    try {
      // Tenta fazer parse como JSON primeiro
      const parsed = JSON.parse(contact);
      return {
        emergencyName: parsed.name || "",
        emergencyRelation: parsed.relationship || "",
        emergencyPhone: parsed.phone || ""
      };
    } catch {
      // Se não for JSON, assume formato: "Nome - Relação - Telefone" ou "Nome - Telefone"
      const parts = contact.split(' - ');
      return {
        emergencyName: parts[0] || "",
        emergencyRelation: parts[1] || "",
        emergencyPhone: parts[2] || parts[1] || ""
      };
    }
  };

  // Função para juntar campos de contato de emergência em JSON
  const buildEmergencyContact = (contactData: unknown) => {
    return JSON.stringify({
      name: contactData.emergencyName,
      relationship: contactData.emergencyRelation,
      phone: contactData.emergencyPhone
    });
  };

  // Função para juntar campos separados em JSON de endereço  
  const buildAddress = (addressData: unknown) => {
    return JSON.stringify({
      street: addressData.street,
      number: addressData.number,
      complement: addressData.complement,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      postal_code: addressData.zipCode
    });
  };

  const startEditing = () => {
    if (profile) {
      const addressParts = parseAddress(profile.address || "");
      const emergencyParts = parseEmergencyContact(profile.emergency_contact || "");
      setEditData({
        phone: profile.phone || "",
        street: addressParts.street,
        number: addressParts.number,
        complement: addressParts.complement,
        neighborhood: addressParts.neighborhood,
        city: addressParts.city,
        zipCode: addressParts.zipCode,
        emergencyName: emergencyParts.emergencyName,
        emergencyPhone: emergencyParts.emergencyPhone,
        emergencyRelation: emergencyParts.emergencyRelation
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      phone: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      zipCode: "",
      emergencyName: "",
      emergencyPhone: "",
      emergencyRelation: ""
    });
  };

  const saveChanges = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const fullAddress = buildAddress(editData);
      const fullEmergencyContact = buildEmergencyContact(editData);

      const { error } = await supabase
        .from("profiles")
        .update({
          phone: editData.phone,
          address: fullAddress,
          emergency_contact: fullEmergencyContact,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar o profile local
      setProfile({
        ...profile,
        phone: editData.phone,
        address: fullAddress,
        emergency_contact: fullEmergencyContact,
      });

      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar os dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Redirect to registration if no client data and not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin && !clientDataLoading && hasClientData === false) {
      router.push("/clients/new");
    }
  }, [roleLoading, isAdmin, clientDataLoading, hasClientData, router.push]);

  useEffect(() => {
    if (!roleLoading) {
      fetchProfile();
    }
  }, [user, roleLoading]);

  if (loading || roleLoading || clientDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
      <Header
        title="Meu Perfil"
        subtitle="Meus dados como cliente"
        backUrl="/"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                Meu Perfil de Cliente
              </h1>
              <p className="text-muted-foreground">
                Seus dados cadastrais e informações dos pets
              </p>
            </div>
            {!hasClientData && (
              <Button onClick={() => router.push("/clients/new")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Completar Cadastro
              </Button>
            )}
          </div>

          {!profile?.cpf ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  Você ainda não completou seu cadastro como cliente.
                </div>
                <Button onClick={() => router.push("/clients/new")}>
                  Completar Meus Dados
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Meus Dados de Cliente
                </CardTitle>
                <CardDescription>
                  Suas informações cadastrais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Nome Completo:</Label>
                        <p className="font-medium p-2 bg-muted/30 rounded-md">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Nome não pode ser alterado</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">CPF:</Label>
                        <p className="font-medium p-2 bg-muted/30 rounded-md">{profile.cpf}</p>
                        <p className="text-xs text-muted-foreground mt-1">CPF não pode ser alterado</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Telefone:</Label>
                        {isEditing ? (
                          <Input
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                          />
                        ) : (
                          <p className="font-medium">{profile.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Data de Cadastro:</Label>
                        <p className="font-medium">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-4">Endereço e Contatos</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Endereço:</Label>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <Label className="text-xs">Rua/Logradouro</Label>
                                <Input
                                  value={editData.street}
                                  onChange={(e) => setEditData({ ...editData, street: e.target.value })}
                                  placeholder="Nome da rua"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Número</Label>
                                <Input
                                  value={editData.number}
                                  onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                                  placeholder="123"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Complemento</Label>
                              <Input
                                value={editData.complement}
                                onChange={(e) => setEditData({ ...editData, complement: e.target.value })}
                                placeholder="Apto, sala, etc. (opcional)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Bairro</Label>
                                <Input
                                  value={editData.neighborhood}
                                  onChange={(e) => setEditData({ ...editData, neighborhood: e.target.value })}
                                  placeholder="Nome do bairro"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Cidade</Label>
                                <Input
                                  value={editData.city}
                                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                  placeholder="Nome da cidade"
                                />
                              </div>
                            </div>
                            <div className="w-32">
                              <Label className="text-xs">CEP</Label>
                              <Input
                                value={editData.zipCode}
                                onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })}
                                placeholder="00000-000"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">
                            {(() => {
                              const addressParts = parseAddress(profile.address || "");
                              return (
                                <div className="space-y-1">
                                  <div>{addressParts.street} {addressParts.number}</div>
                                  {addressParts.complement && <div>{addressParts.complement}</div>}
                                  <div>{addressParts.neighborhood}</div>
                                  <div>{addressParts.city} - {addressParts.zipCode}</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Contato de Emergência:</Label>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Nome Completo</Label>
                              <Input
                                value={editData.emergencyName}
                                onChange={(e) => setEditData({ ...editData, emergencyName: e.target.value })}
                                placeholder="Nome do contato"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Parentesco/Relação</Label>
                              <Input
                                value={editData.emergencyRelation}
                                onChange={(e) => setEditData({ ...editData, emergencyRelation: e.target.value })}
                                placeholder="Ex: Cônjuge, Filho(a), Amigo(a)"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Telefone</Label>
                              <Input
                                value={editData.emergencyPhone}
                                onChange={(e) => setEditData({ ...editData, emergencyPhone: e.target.value })}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">
                            {(() => {
                              const emergencyParts = parseEmergencyContact(profile.emergency_contact || "");
                              return (
                                <div className="space-y-1">
                                  <div><strong>Nome:</strong> {emergencyParts.emergencyName}</div>
                                  <div><strong>Parentesco:</strong> {emergencyParts.emergencyRelation}</div>
                                  <div><strong>Telefone:</strong> {emergencyParts.emergencyPhone}</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Pets Cadastrados:</Label>
                        <div className="flex items-center gap-2">
                          <PawPrint className="h-4 w-4 text-primary" />
                          <span className="font-medium">{profile.pets_count} pet{profile.pets_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-6 border-t">
                  <Button
                    onClick={() => router.push("/pets")}
                    className="flex items-center gap-2"
                  >
                    <PawPrint className="h-4 w-4" />
                    Gerenciar Pets
                  </Button>

                  {isEditing ? (
                    <>
                      <Button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startEditing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Dados
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Clients;