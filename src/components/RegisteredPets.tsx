import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PawPrint, Heart, Calendar, User, Phone, Mail } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  color: string | null;
  gender: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export const RegisteredPets = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPets = async () => {
      if (!user) {
        setPets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('pets')
          .select(`
            *,
            profiles!inner(
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        setPets(data || []);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Erro ao carregar dados dos pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pets-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets'
        },
        () => {
          fetchPets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Pets Recentes
          </CardTitle>
          <CardDescription>
            Últimos pets cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-lg border border-border">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Pets Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Pets Recentes
          </CardTitle>
          <CardDescription>
            Últimos {pets.length} pets cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pets.length === 0 ? (
            <div className="text-center py-8">
              <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pet cadastrado ainda</p>
            </div>
          ) : (
            pets.map((pet) => (
              <div
                key={pet.id}
                className="flex items-center space-x-4 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handlePetClick(pet)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                  <AvatarFallback>
                    <PawPrint className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{pet.name}</h3>
                    {pet.gender && (
                      <Badge variant="outline" className="text-xs">
                        {pet.gender === 'male' ? '♂' : '♀'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{pet.breed || 'Raça não informada'}</span>
                    <span>{pet.profiles?.full_name || 'Tutor não informado'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(pet.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Detalhes do Pet
            </DialogTitle>
          </DialogHeader>
          {selectedPet && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPet.photo_url || undefined} alt={selectedPet.name} />
                  <AvatarFallback>
                    <PawPrint className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedPet.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPet.breed || 'Raça não informada'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedPet.age && (
                  <div>
                    <span className="font-medium">Idade:</span>
                    <p className="text-muted-foreground">{selectedPet.age} anos</p>
                  </div>
                )}
                {selectedPet.weight && (
                  <div>
                    <span className="font-medium">Peso:</span>
                    <p className="text-muted-foreground">{selectedPet.weight} kg</p>
                  </div>
                )}
                {selectedPet.color && (
                  <div>
                    <span className="font-medium">Cor:</span>
                    <p className="text-muted-foreground">{selectedPet.color}</p>
                  </div>
                )}
                {selectedPet.gender && (
                  <div>
                    <span className="font-medium">Sexo:</span>
                    <p className="text-muted-foreground">
                      {selectedPet.gender === 'male' ? 'Macho' : 'Fêmea'}
                    </p>
                  </div>
                )}
              </div>

              {selectedPet.notes && (
                <div>
                  <span className="font-medium text-sm">Observações:</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPet.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Tutor
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedPet.profiles?.full_name && (
                    <p className="text-muted-foreground">{selectedPet.profiles.full_name}</p>
                  )}
                  {selectedPet.profiles?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="text-muted-foreground">{selectedPet.profiles.email}</span>
                    </div>
                  )}
                  {selectedPet.profiles?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-muted-foreground">{selectedPet.profiles.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Cadastrado em {new Date(selectedPet.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};