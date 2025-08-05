import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, User, PawPrint, DollarSign, FileText, CalendarDays } from 'lucide-react';
import { useTomorrowAppointments } from '@/hooks/useTomorrowAppointments';

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

export const TomorrowAppointments = () => {
  const { appointments, loading, error, count } = useTomorrowAppointments();

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Agendados Amanhã
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
            Agendados Amanhã
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
          Agendados Amanhã
          <Badge variant="outline" className="ml-auto">
            {count}
          </Badge>
        </CardTitle>
        <CardDescription>
          {nextAppointment 
            ? `Primeiro: ${nextAppointment.appointment_time} - ${nextAppointment.pet.name}`
            : count > 0 
              ? 'Todos os agendamentos confirmados'
              : 'Nenhum agendamento para amanhã'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento para amanhã</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center text-xs">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
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
                        <DialogTitle>Agendamento de Amanhã</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Horário</span>
                            </div>
                            <p className="text-sm">{appointment.appointment_time.slice(0, 5)}</p>
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
            
            {count > 3 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  E mais {count - 3} agendamento(s)...
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};