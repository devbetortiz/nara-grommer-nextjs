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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PawPrint, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Ban, CalendarClock } from 'lucide-react';


interface Pet {
    id: string;
    name: string;
}

interface Client {
    id: string;
    full_name: string | null;
    email: string | null;
}

interface Appointment {
    id: string;
    pet_id: string;
    service_type: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    notes?: string | null;
    price?: number | null;
    pets: {
        name: string;
        profiles?: {
            full_name: string | null;
            phone?: string | null;
        } | null;
    };
}

const serviceTypes = {
    banho: 'Banho',
    tosa_higienica: 'Tosa Higiênica',
    tosa_completa: 'Tosa Completa',
    hidratacao: 'Hidratação',
    banho_tosa: 'Banho + Tosa'
};

const statusColors = {
    agendado: 'text-blue-600 bg-blue-50 border-blue-200',
    confirmado: 'text-green-600 bg-green-50 border-green-200',
    em_andamento: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    concluido: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    cancelado: 'text-red-600 bg-red-50 border-red-200'
};

const statusIcons = {
    agendado: Clock,
    confirmado: CheckCircle,
    em_andamento: Play,
    concluido: CheckCircle,
    cancelado: XCircle
};

const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
];

export function AppointmentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { isAdmin, loading: roleLoading } = useUserRole();
    const { sendAppointmentConfirmation, formatAppointmentDate, formatAppointmentTime } = useEmailNotifications();
    const [pets, setPets] = useState<Pet[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedClientId, setSelectedClientId] = useState('');
    const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<Date>();
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [formData, setFormData] = useState({
        pet_id: '',
        service_type: '',
        appointment_time: '',
        notes: '',
        price: ''
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && !roleLoading) {
            if (isAdmin) {
                fetchClients();
            } else {
                fetchPets();
            }
            fetchAppointments();
        }
    }, [user, isAdmin, roleLoading]);

    useEffect(() => {
        if (isAdmin && selectedClientId) {
            fetchPetsForClient(selectedClientId);
        }
    }, [selectedClientId, isAdmin]);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .not('full_name', 'is', null)
                .order('full_name');

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

    const fetchPets = async () => {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setPets(data || []);
        } catch (error) {
            console.error('Error fetching pets:', error);
            toast({
                title: "Erro",
                description: "Erro ao carregar pets",
                variant: "destructive"
            });
        }
    };

    const fetchPetsForClient = async (clientId: string) => {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('id, name')
                .eq('user_id', clientId)
                .order('name');

            if (error) throw error;
            setPets(data || []);

            // Reset pet selection when client changes
            setFormData(prev => ({ ...prev, pet_id: '' }));
        } catch (error) {
            console.error('Error fetching pets for client:', error);
            toast({
                title: "Erro",
                description: "Erro ao carregar pets do cliente",
                variant: "destructive"
            });
        }
    };

    const fetchAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          pets (
            name,
            profiles (
              full_name,
              phone
            )
          )
        `)
                .order('appointment_date', { ascending: false })
                .order('appointment_time', { ascending: false });

            if (error) throw error;
            setAppointments(data as unknown as Appointment[] || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast({
                title: "Erro",
                description: "Erro ao carregar agendamentos",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteService = async (appointmentId: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'concluido' })
                .eq('id', appointmentId);

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Serviço marcado como concluído",
            });

            fetchAppointments();
        } catch (error) {
            console.error('Error completing service:', error);
            toast({
                title: "Erro",
                description: "Erro ao concluir serviço",
                variant: "destructive"
            });
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelado' })
                .eq('id', appointmentId);

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Agendamento cancelado",
            });

            fetchAppointments();
        } catch (error) {
            console.error('Error canceling appointment:', error);
            toast({
                title: "Erro",
                description: "Erro ao cancelar agendamento",
                variant: "destructive"
            });
        }
    };

    const handleRescheduleAppointment = async () => {
        if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    appointment_date: `${rescheduleDate.getFullYear()}-${String(rescheduleDate.getMonth() + 1).padStart(2, '0')}-${String(rescheduleDate.getDate()).padStart(2, '0')}`,
                    appointment_time: rescheduleTime
                })
                .eq('id', rescheduleAppointment.id);

            if (error) {
                if (error.code === '23505') {
                    toast({
                        title: "Erro",
                        description: "Este horário já está ocupado. Escolha outro horário.",
                        variant: "destructive"
                    });
                } else {
                    throw error;
                }
                return;
            }

            toast({
                title: "Sucesso!",
                description: "Agendamento reagendado com sucesso",
            });

            setRescheduleAppointment(null);
            setRescheduleDate(undefined);
            setRescheduleTime('');
            fetchAppointments();
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            toast({
                title: "Erro",
                description: "Erro ao reagendar agendamento",
                variant: "destructive"
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedDate) return;

        if (pets.length === 0) {
            toast({
                title: "Aviso",
                description: "Você precisa cadastrar pelo menos um pet antes de agendar",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const appointmentData = {
                user_id: isAdmin ? selectedClientId : user.id,
                pet_id: formData.pet_id,
                service_type: formData.service_type,
                appointment_date: selectedDate ?
                    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                    : format(new Date(), 'yyyy-MM-dd'),
                appointment_time: formData.appointment_time,
                notes: formData.notes || null,
                price: formData.price ? parseFloat(formData.price) : null
            };

            const { data: insertedAppointment, error } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select('id')
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast({
                        title: "Erro",
                        description: "Este horário já está ocupado. Escolha outro horário.",
                        variant: "destructive"
                    });
                } else {
                    throw error;
                }
                return;
            }

            if (!insertedAppointment) {
                throw new Error('Falha ao criar o agendamento');
            }

            toast({
                title: "Sucesso!",
                description: "Agendamento criado com sucesso! Você receberá um email de confirmação.",
            });

            // Buscar dados do usuário e pet para o email
            try {
                const userId = appointmentData.user_id; // Usar sempre o user_id do agendamento

                // Buscar dados do usuário
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', userId)
                    .single();

                // Buscar dados do pet
                const { data: petData } = await supabase
                    .from('pets')
                    .select('name')
                    .eq('id', formData.pet_id)
                    .single();

                if (profileData && petData) {
                    await sendAppointmentConfirmation(
                        profileData.email || user.email!,
                        profileData.full_name || 'Cliente',
                        petData.name,
                        formData.service_type,
                        formatAppointmentDate(selectedDate ?
                            `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                            : ''),
                        formatAppointmentTime(formData.appointment_time),
                        insertedAppointment.id,
                        userId,
                        formData.price ? parseFloat(formData.price) : undefined,
                        formData.notes || undefined
                    );

                    console.log('Email de confirmação enviado com sucesso');
                }
            } catch (emailError) {
                console.error('Erro ao enviar email de confirmação:', emailError);
                // Não falha o agendamento se o email falhar
            }

            setFormData({
                pet_id: '',
                service_type: '',
                appointment_time: '',
                notes: '',
                price: ''
            });
            setSelectedDate(undefined);
            setSelectedClientId('');
            setShowForm(false);
            fetchAppointments();
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast({
                title: "Erro",
                description: "Erro ao criar agendamento",
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
            <Header title="Agendamentos" subtitle="Gerencie seus agendamentos" />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Add Appointment Button */}
                    <div className="flex justify-end mb-8">
                        {!showForm && (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="gap-2"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Novo Agendamento
                            </Button>
                        )}
                    </div>

                    {/* Form */}
                    {showForm && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Novo Agendamento</CardTitle>
                                <CardDescription>
                                    Agende um serviço para seu pet
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {isAdmin && (
                                        <div className="space-y-2">
                                            <Label htmlFor="client">Cliente *</Label>
                                            <Select
                                                value={selectedClientId}
                                                onValueChange={setSelectedClientId}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id}>
                                                            {client.full_name} ({client.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pet">Pet *</Label>
                                            <Select
                                                value={formData.pet_id}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, pet_id: value }))}
                                                required
                                                disabled={isAdmin && !selectedClientId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isAdmin && !selectedClientId ? "Selecione um cliente primeiro" : "Selecione um pet"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pets.map((pet) => (
                                                        <SelectItem key={pet.id} value={pet.id}>
                                                            {pet.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {!isAdmin && pets.length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="p-0 h-auto"
                                                        onClick={() => router.push('/pets')}
                                                    >
                                                        Cadastre um pet primeiro
                                                    </Button>
                                                </p>
                                            )}
                                            {isAdmin && selectedClientId && pets.length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Este cliente não possui pets cadastrados
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="service">Serviço *</Label>
                                            <Select
                                                value={formData.service_type}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um serviço" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(serviceTypes).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Data *</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !selectedDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {selectedDate ? (
                                                            format(selectedDate, "PPP", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione uma data</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={setSelectedDate}
                                                        disabled={(date) => date < new Date()}
                                                        initialFocus
                                                        className={cn("p-3 pointer-events-auto")}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="time">Horário *</Label>
                                            <Select
                                                value={formData.appointment_time}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_time: value }))}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um horário" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timeSlots.map((time) => (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="price">Preço (R$)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="Valor do serviço"
                                            min="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Observações</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Observações sobre o agendamento"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || pets.length === 0 || (isAdmin && !selectedClientId)}
                                            className="flex-1"
                                        >
                                            {isSubmitting ? 'Agendando...' : 'Agendar'}
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

                    {/* Appointments List */}
                    <div className="space-y-6">
                        {appointments.length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Nenhum agendamento encontrado
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Crie seu primeiro agendamento
                                </p>
                                <Button onClick={() => setShowForm(true)} className="gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Novo Agendamento
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {appointments.map((appointment) => {
                                    const StatusIcon = statusIcons[appointment.status as keyof typeof statusIcons];
                                    const statusClass = statusColors[appointment.status as keyof typeof statusColors];

                                    return (
                                        <Card key={appointment.id} className="overflow-hidden">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <PawPrint className="h-5 w-5 text-primary" />
                                                        {appointment.pets.name}
                                                    </CardTitle>
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {appointment.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                                <CardDescription>
                                                    {serviceTypes[appointment.service_type as keyof typeof serviceTypes]}
                                                    {isAdmin && appointment.pets.profiles && (
                                                        <div className="mt-2 text-sm">
                                                            <div className="font-medium text-foreground">
                                                                Cliente: {appointment.pets.profiles.full_name || 'Nome não informado'}
                                                            </div>
                                                            {appointment.pets.profiles.phone && (
                                                                <div className="text-muted-foreground">
                                                                    Tel: {appointment.pets.profiles.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {format(new Date(appointment.appointment_date), "PPP", { locale: ptBR })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    {appointment.appointment_time}
                                                </div>
                                                {appointment.price && (
                                                    <div className="text-sm font-medium text-foreground">
                                                        R$ {appointment.price.toFixed(2)}
                                                    </div>
                                                )}
                                                {appointment.notes && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Obs:</span> {appointment.notes}
                                                    </div>
                                                )}

                                                {/* Botões de ação */}
                                                {appointment.status !== 'concluido' && appointment.status !== 'cancelado' && (
                                                    <div className="pt-2 border-t space-y-2">
                                                        {/* Botão Concluir Serviço - apenas para admins */}
                                                        {isAdmin && (appointment.status === 'confirmado' || appointment.status === 'em_andamento') && (
                                                            <Button
                                                                onClick={() => handleCompleteService(appointment.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                                Concluir Serviço
                                                            </Button>
                                                        )}

                                                        {/* Botões para cancelar e reagendar */}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                                Cancelar
                                                            </Button>

                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        onClick={() => setRescheduleAppointment(appointment)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                    >
                                                                        <CalendarClock className="h-4 w-4" />
                                                                        Reagendar
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Reagendar Agendamento</DialogTitle>
                                                                        <DialogDescription>
                                                                            Selecione uma nova data e horário para o agendamento de {appointment.pets.name}
                                                                        </DialogDescription>
                                                                    </DialogHeader>

                                                                    <div className="space-y-4">
                                                                        <div className="space-y-2">
                                                                            <Label>Nova Data</Label>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        className={cn(
                                                                                            "w-full justify-start text-left font-normal",
                                                                                            !rescheduleDate && "text-muted-foreground"
                                                                                        )}
                                                                                    >
                                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                                        {rescheduleDate ? (
                                                                                            format(rescheduleDate, "PPP", { locale: ptBR })
                                                                                        ) : (
                                                                                            <span>Selecione uma data</span>
                                                                                        )}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                                    <Calendar
                                                                                        mode="single"
                                                                                        selected={rescheduleDate}
                                                                                        onSelect={setRescheduleDate}
                                                                                        disabled={(date) => date < new Date()}
                                                                                        initialFocus
                                                                                        className={cn("p-3 pointer-events-auto")}
                                                                                    />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <Label>Novo Horário</Label>
                                                                            <Select
                                                                                value={rescheduleTime}
                                                                                onValueChange={setRescheduleTime}
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Selecione um horário" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {timeSlots.map((time) => (
                                                                                        <SelectItem key={time} value={time}>
                                                                                            {time}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>

                                                                    <DialogFooter>
                                                                        <Button
                                                                            onClick={handleRescheduleAppointment}
                                                                            disabled={!rescheduleDate || !rescheduleTime}
                                                                            className="gap-2"
                                                                        >
                                                                            <CalendarClock className="h-4 w-4" />
                                                                            Reagendar
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}