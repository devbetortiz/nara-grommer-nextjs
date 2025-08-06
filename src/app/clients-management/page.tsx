"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Edit, Trash2, Search, UserCheck, PawPrint, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/Header';

interface ClientData {
  id: string;
  email: string | null;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  pets_count?: number;
}

interface EditClientForm {
  full_name: string;
  cpf: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

interface PetData {
  id: string;
  name: string;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  color?: string | null;
  gender?: string | null;
  photo_url?: string | null;
  notes?: string | null;
}

const ClientManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [editForm, setEditForm] = useState<EditClientForm>({
    full_name: '',
    cpf: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingClientPets, setViewingClientPets] = useState<ClientData | null>(null);
  const [clientPets, setClientPets] = useState<PetData[]>([]);
  const [isPetsDialogOpen, setIsPetsDialogOpen] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    } else if (!roleLoading && !isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, roleLoading, router.push]);

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const parseAddress = (address: string) => {
    if (!address) return {
      street: '', number: '', complement: '', neighborhood: '', city: '', zipCode: ''
    };

    try {
      const parsed = JSON.parse(address);
      return {
        street: parsed.street || '',
        number: parsed.number || '',
        complement: parsed.complement || '',
        neighborhood: parsed.neighborhood || '',
        city: parsed.city || '',
        zipCode: parsed.postal_code || ''
      };
    } catch {
      return {
        street: '', number: '', complement: '', neighborhood: '', city: '', zipCode: ''
      };
    }
  };

  const parseEmergencyContact = (contact: string) => {
    if (!contact) return {
      emergencyName: '', emergencyPhone: '', emergencyRelation: ''
    };

    try {
      const parsed = JSON.parse(contact);
      return {
        emergencyName: parsed.name || '',
        emergencyPhone: parsed.phone || '',
        emergencyRelation: parsed.relationship || ''
      };
    } catch {
      return {
        emergencyName: '', emergencyPhone: '', emergencyRelation: ''
      };
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);

      // Fetch profiles with pets count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('cpf', 'is', null)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch pets count for each client
      const clientsWithPetsCount = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('pets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          return {
            ...profile,
            pets_count: count || 0
          };
        })
      );

      setClients(clientsWithPetsCount);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client: ClientData) => {
    const addressParts = parseAddress(client.address || '');
    const emergencyParts = parseEmergencyContact(client.emergency_contact || '');

    setEditForm({
      full_name: client.full_name || '',
      cpf: client.cpf || '',
      phone: client.phone || '',
      ...addressParts,
      ...emergencyParts
    });

    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;

    try {
      const addressData = JSON.stringify({
        street: editForm.street,
        number: editForm.number,
        complement: editForm.complement,
        neighborhood: editForm.neighborhood,
        city: editForm.city,
        postal_code: editForm.zipCode
      });

      const emergencyData = JSON.stringify({
        name: editForm.emergencyName,
        phone: editForm.emergencyPhone,
        relationship: editForm.emergencyRelation
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          cpf: editForm.cpf,
          phone: editForm.phone,
          address: addressData,
          emergency_contact: emergencyData
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados do cliente atualizados com sucesso.",
      });

      setIsEditDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados do cliente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      // Delete pets first (cascade)
      const { error: petsError } = await supabase
        .from('pets')
        .delete()
        .eq('user_id', clientId);

      if (petsError) throw petsError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clientId);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso.",
      });

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleViewPets = async (client: ClientData) => {
    setViewingClientPets(client);
    setLoadingPets(true);
    setIsPetsDialogOpen(true);

    try {
      const { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClientPets(pets || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pets do cliente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPets(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
      <Header
        title="Gerenciar Clientes"
        subtitle="Administração de clientes cadastrados"
        backUrl="/dashboard"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Cadastrados ({filteredClients.length})
                </span>
              </CardTitle>
              <CardDescription>
                Gerencie os dados dos clientes cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-muted-foreground">Carregando clientes...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {client.full_name || 'Nome não informado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <p className="text-sm text-muted-foreground">CPF: {client.cpf}</p>
                          <p className="text-xs text-muted-foreground">
                            Cadastrado em: {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">
                          {client.pets_count} pet{client.pets_count !== 1 ? 's' : ''}
                        </Badge>

                        {/* Botão para ver pets */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPets(client)}
                          className="gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <PawPrint className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver Pets</span>
                        </Button>

                        <Dialog open={isEditDialogOpen && editingClient?.id === client.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClient(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Cliente</DialogTitle>
                              <DialogDescription>
                                Edite as informações do cliente
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Nome Completo</Label>
                                  <Input
                                    id="edit-name"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-cpf">CPF</Label>
                                  <Input
                                    id="edit-cpf"
                                    value={editForm.cpf}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, cpf: e.target.value }))}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-phone">Telefone</Label>
                                <Input
                                  id="edit-phone"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                />
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-medium">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-street">Rua</Label>
                                    <Input
                                      id="edit-street"
                                      value={editForm.street}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, street: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-number">Número</Label>
                                    <Input
                                      id="edit-number"
                                      value={editForm.number}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-neighborhood">Bairro</Label>
                                    <Input
                                      id="edit-neighborhood"
                                      value={editForm.neighborhood}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-city">Cidade</Label>
                                    <Input
                                      id="edit-city"
                                      value={editForm.city}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-medium">Contato de Emergência</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-emergency-name">Nome</Label>
                                    <Input
                                      id="edit-emergency-name"
                                      value={editForm.emergencyName}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-emergency-phone">Telefone</Label>
                                    <Input
                                      id="edit-emergency-phone"
                                      value={editForm.emergencyPhone}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleSaveEdit}>
                                Salvar Alterações
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                                Todos os pets e agendamentos deste cliente também serão removidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Pets - Harmonioso e Minimalista */}
          <Dialog open={isPetsDialogOpen} onOpenChange={setIsPetsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader className="space-y-3">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <PawPrint className="h-5 w-5 text-primary" />
                  </div>
                  Pets de {viewingClientPets?.full_name}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {clientPets.length === 0 && !loadingPets
                    ? 'Este cliente não possui pets cadastrados.'
                    : `${clientPets.length} pet${clientPets.length !== 1 ? 's' : ''} cadastrado${clientPets.length !== 1 ? 's' : ''}`
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto max-h-[70vh] pr-2">
                {loadingPets ? (
                  <div className="text-center py-12">
                    <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando pets...</p>
                  </div>
                ) : clientPets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <PawPrint className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">Nenhum pet cadastrado</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Este cliente ainda não cadastrou nenhum pet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientPets.map((pet) => (
                      <Card key={pet.id} className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-colors">
                        {pet.photo_url && (
                          <div className="h-48 overflow-hidden">
                            <Image
                              src={pet.photo_url}
                              alt={pet.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <PawPrint className="h-4 w-4 text-primary" />
                            {pet.name}
                          </CardTitle>
                          {pet.breed && (
                            <CardDescription className="text-base">
                              {pet.breed}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            {pet.age && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Idade</p>
                                <p className="text-sm font-medium">{pet.age} anos</p>
                              </div>
                            )}
                            {pet.weight && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peso</p>
                                <p className="text-sm font-medium">{pet.weight} kg</p>
                              </div>
                            )}
                            {pet.color && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cor</p>
                                <p className="text-sm font-medium">{pet.color}</p>
                              </div>
                            )}
                            {pet.gender && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sexo</p>
                                <Badge variant="outline" className="text-xs font-medium">
                                  {pet.gender}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {pet.notes && (
                            <div className="space-y-2 pt-2 border-t border-border/50">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {pet.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button variant="outline" onClick={() => setIsPetsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default ClientManagement;