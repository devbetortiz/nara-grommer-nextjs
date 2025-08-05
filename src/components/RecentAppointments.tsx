import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, User, PawPrint, DollarSign, FileText, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  price: number | null;
  notes: string | null;
  pet: {
    name: string;
    breed: string | null;
  };
  user: {
    full_name: string | null;
    email: string | null;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'default';
    case 'confirmado':
      return 'secondary';
    case 'em_andamento':
      return 'destructive';
    case 'concluido':
      return 'outline';
    case 'cancelado':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'Agendado';
    case 'confirmado':
      return 'Confirmado';
    case 'em_andamento':
      return 'Em Andamento';
    case 'concluido':
      return 'Concluído';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
};

export const RecentAppointments = () => {
  const [appointments, setAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        // Buscar agendamentos dos próximos 7 dias
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        // Garantir que estamos usando o fuso horário local
        const todayStr = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        const nextWeekStr = nextWeek.getFullYear() + '-' + 
          String(nextWeek.getMonth() + 1).padStart(2, '0') + '-' + 
          String(nextWeek.getDate()).padStart(2, '0');

        const { data, error: queryError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            service_type,
            status,
            price,
            notes,
            profiles:user_id (full_name, email),
            pets:pet_id (name, breed)
          `)
          .gte('appointment_date', todayStr)
          .lte('appointment_date', nextWeekStr)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(10);

        if (queryError) {
          throw queryError;
        }

        if (!data || data.length === 0) {
          setAppointments([]);
          return;
        }

        const formattedAppointments = data.map((appointment: any) => ({
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          service_type: appointment.service_type,
          status: appointment.status,
          price: appointment.price,
          notes: appointment.notes,
          pet: {
            name: appointment.pets?.name || 'Pet não encontrado',
            breed: appointment.pets?.breed
          },
          user: {
            full_name: appointment.profiles?.full_name,
            email: appointment.profiles?.email || 'Usuário não encontrado'
          }
        }));

        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Erro ao buscar agendamentos recentes:', err);
        setError('Erro ao carregar agendamentos');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAppointments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('recent-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchRecentAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-pulse">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextAppointment = appointments.find(apt => 
    apt.status === 'agendado' || apt.status === 'confirmado'
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Próximos Agendamentos
          <Badge variant="outline" className="ml-auto">
            {appointments.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          {nextAppointment 
            ? `Próximo: ${format(new Date(nextAppointment.appointment_date + 'T00:00:00'), 'dd/MM', { locale: ptBR })} às ${nextAppointment.appointment_time.slice(0, 5)} - ${nextAppointment.pet.name}`
            : appointments.length > 0 
              ? 'Próximos 7 dias'
              : 'Nenhum agendamento nos próximos 7 dias'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento próximo</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center text-xs">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(appointment.appointment_date + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {appointment.appointment_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{appointment.pet.name}</span>
                        <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-xs">
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.user.full_name || appointment.user.email}
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Agendamento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Data e Hora</span>
                            </div>
                            <p className="text-sm">
                              {format(new Date(appointment.appointment_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.appointment_time.slice(0, 5)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <PawPrint className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Pet</span>
                            </div>
                            <p className="text-sm">{appointment.pet.name}</p>
                            {appointment.pet.breed && (
                              <p className="text-xs text-muted-foreground">{appointment.pet.breed}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Cliente</span>
                          </div>
                          <p className="text-sm">
                            {appointment.user.full_name || appointment.user.email}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-sm font-medium">Serviço</span>
                          <p className="text-sm">{appointment.service_type}</p>
                        </div>

                        {appointment.price && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Preço</span>
                            </div>
                            <p className="text-sm">R$ {Number(appointment.price).toFixed(2)}</p>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Observações</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                          </div>
                        )}

                        <div className="pt-2">
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
            
            {appointments.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  E mais {appointments.length - 5} agendamento(s)...
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};