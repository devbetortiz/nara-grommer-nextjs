"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, PawPrint } from 'lucide-react';
import { Header } from '@/components/Header';
import { useUserRole } from '@/hooks/useUserRole';

interface Pet {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  weight?: number;
  color?: string;
  gender?: string;
  photo_url?: string;
  notes?: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone?: string;
  } | null;
}

const Pets = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    gender: '',
    notes: '',
    selectedClientId: '', // For admin use
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router.push]);

  useEffect(() => {
    if (user) {
      fetchPets();
      if (isAdmin) {
        fetchClients();
      }
    }
  }, [user, isAdmin]);


  const fetchPets = async () => {
    try {
      let query = supabase
        .from('pets')
        .select(`
          *,
          profiles (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's pets
      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPets(data as unknown as Pet[] || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      });
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('pet-photos')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading photo:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pet-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const petData = {
        user_id: isAdmin && formData.selectedClientId ? formData.selectedClientId : user.id,
        name: formData.name,
        breed: formData.breed || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        color: formData.color || null,
        gender: formData.gender || null,
        photo_url: photoUrl,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('pets')
        .insert([petData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Pet cadastrado com sucesso",
      });

      setFormData({
        name: '',
        breed: '',
        age: '',
        weight: '',
        color: '',
        gender: '',
        notes: '',
        selectedClientId: ''
      });
      setPhotoFile(null);
      setShowForm(false);
      fetchPets();
    } catch (error) {
      console.error('Error creating pet:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="animate-bounce">
          <PawPrint className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header title={isAdmin ? "Gerenciar Pets" : "Meus Pets"} subtitle={isAdmin ? "Gerencie pets de todos os clientes" : "Gerencie seus pets cadastrados"} backUrl="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Add Pet Button */}
          <div className="flex justify-end mb-8">
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Pet
              </Button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cadastrar Novo Pet</CardTitle>
                <CardDescription>
                  Preencha as informações do seu pet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="client">Cliente *</Label>
                      <Select
                        value={formData.selectedClientId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, selectedClientId: value }))}
                        required={isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.full_name || client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Pet *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do pet"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="breed">Raça</Label>
                      <Input
                        id="breed"
                        value={formData.breed}
                        onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                        placeholder="Raça do pet"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Idade (anos)</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="Idade"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="Peso"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Sexo</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="macho">Macho</SelectItem>
                          <SelectItem value="fêmea">Fêmea</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Cor do pet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Foto</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações sobre o pet"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Cadastrando...' : 'Cadastrar Pet'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Pets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum pet cadastrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Cadastre o primeiro pet para começar
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Pet
                </Button>
              </div>
            ) : (
              pets.map((pet) => (
                <Card key={pet.id} className="overflow-hidden">
                  {pet.photo_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-primary" />
                      {pet.name}
                    </CardTitle>
                    <CardDescription>
                      {pet.breed && <span>{pet.breed}</span>}
                    </CardDescription>
                    {isAdmin && pet.profiles && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium text-foreground">
                          Cliente: {pet.profiles.full_name || 'Nome não informado'}
                        </div>
                        {pet.profiles.phone && (
                          <div className="text-muted-foreground">
                            Tel: {pet.profiles.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pet.age && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Idade:</span> {pet.age} anos
                      </p>
                    )}
                    {pet.weight && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Peso:</span> {pet.weight} kg
                      </p>
                    )}
                    {pet.color && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Cor:</span> {pet.color}
                      </p>
                    )}
                    {pet.gender && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Sexo:</span> {pet.gender}
                      </p>
                    )}
                    {pet.notes && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Observações:</span> {pet.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pets;