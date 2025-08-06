import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, User, PawPrint, FileText, DollarSign, Phone, Mail, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  notes?: string | null;
  price?: number;
  user_id: string;
  pet_id: string;
  profiles?: {
    full_name: string;
    email?: string;
    phone?: string;
  };
  pets?: {
    name: string;
    breed?: string;
  };
}

export const AppointmentsCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch all appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            profiles:user_id (full_name, email, phone),
            pets:pet_id (name, breed)
          `)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        console.log('Appointments loaded:', data?.length || 0, 'appointments');
        setAppointments(data as unknown as Appointment[] || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-500 text-white';
      case 'agendado':
        return 'bg-blue-500 text-white';
      case 'cancelado':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDayAppointments = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateString);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setIsDialogOpen(true);
    setIsEditing(false);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'agendado':
        return 'Agendado';
      case 'confirmado':
        return 'Confirmado';
      case 'em_andamento':
        return 'Em Andamento';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Check className="h-4 w-4" />;
      case 'agendado':
        return <Clock className="h-4 w-4" />;
      case 'confirmado':
        return <Check className="h-4 w-4" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4" />;
      case 'cancelado':
        return <X className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getServiceTypeText = (serviceType: string) => {
    const serviceTypes: { [key: string]: string } = {
      banho: 'Banho',
      tosa_higienica: 'Tosa Higiênica',
      tosa_completa: 'Tosa Completa',
      hidratacao: 'Hidratação',
      banho_tosa: 'Banho + Tosa'
    };
    return serviceTypes[serviceType] || serviceType;
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status } : apt
        )
      );

      if (selectedAppointment) {
        setSelectedAppointment({ ...selectedAppointment, status });
      }

      toast({
        title: "Sucesso!",
        description: "Status do agendamento atualizado com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do agendamento.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Exiba todos os dias no calendário (incluindo os dias do mês anterior/seguinte)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendário de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendário de Agendamentos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
          {/* Week days header */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-3 bg-muted text-center font-medium text-sm border-r border-b last:border-r-0">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayAppointments = getDayAppointments(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border-r border-b last:border-r-0 ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'
                  } ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(appointment.status)}`}
                      title={`${format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')} - ${appointment.profiles?.full_name} (${appointment.pets?.name})`}
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')} {appointment.pets?.name}
                    </div>
                  ))}

                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelado</span>
          </div>
        </div>
      </CardContent>

      {/* Enhanced Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-6 w-6 text-primary" />
              Detalhes do Agendamento
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Header with Status and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getStatusColor(selectedAppointment.status)} text-base px-3 py-1`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-2">{getStatusText(selectedAppointment.status)}</span>
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, newStatus)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Status
                  </Button>
                )}
              </div>

              <Separator />

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Appointment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Informações do Agendamento
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Data</p>
                        <p className="text-muted-foreground">
                          {format(new Date(selectedAppointment.appointment_date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Horário</p>
                        <p className="text-muted-foreground">
                          {format(new Date(`2000-01-01T${selectedAppointment.appointment_time}`), 'HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <PawPrint className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Serviço</p>
                        <p className="text-muted-foreground">
                          {getServiceTypeText(selectedAppointment.service_type)}
                        </p>
                      </div>
                    </div>

                    {selectedAppointment.price && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Valor</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {selectedAppointment.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Client and Pet Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Cliente e Pet
                  </h3>

                  <div className="space-y-4">
                    {/* Client Info */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {selectedAppointment.profiles?.full_name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedAppointment.profiles?.full_name || 'Cliente não informado'}
                          </p>
                          <p className="text-sm text-muted-foreground">Cliente</p>
                        </div>
                      </div>

                      {selectedAppointment.profiles?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{selectedAppointment.profiles.email}</span>
                        </div>
                      )}

                      {selectedAppointment.profiles?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{selectedAppointment.profiles.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Pet Info */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <PawPrint className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedAppointment.pets?.name || 'Pet não informado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAppointment.pets?.breed || 'Raça não informada'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedAppointment.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Observações
                    </h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};