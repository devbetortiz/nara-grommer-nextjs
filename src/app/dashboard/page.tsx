"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useClientData } from '@/hooks/useClientData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, PawPrint, Calendar, LogOut, BarChart3, Users, ArrowLeft, TrendingUp, DollarSign, Clock, Star, CheckCircle, AlertCircle, Activity, CalendarDays, UserPlus } from 'lucide-react';
import { TomorrowAppointments } from '@/components/TomorrowAppointments';
import { RecentAppointments } from '@/components/RecentAppointments';
import { useTomorrowAppointments } from '@/hooks/useTomorrowAppointments';
import { RegisteredPets } from '@/components/RegisteredPets';
import { usePetsCount } from '@/hooks/usePetsCount';
import { RecentActivity } from '@/components/RecentActivity';
import { AppointmentsCalendar } from '@/components/AppointmentsCalendar';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';

export default function DashboardPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { isAdmin, loading: roleLoading } = useUserRole();

    const { count: tomorrowAppointmentsCount } = useTomorrowAppointments();
    const { count: petsCount, thisMonthCount: newPetsThisMonth } = usePetsCount();

    // State for dashboard metrics
    const [dashboardData, setDashboardData] = useState({
        totalUsers: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        monthlyRevenue: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const today = new Date().toISOString().split('T')[0];
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

                // Fetch all dashboard data in parallel
                const [
                    usersResponse,
                    appointmentsResponse,
                    todayAppointmentsResponse,
                    completedAppointmentsResponse,
                    pendingAppointmentsResponse,
                    cancelledAppointmentsResponse
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact' }),
                    supabase.from('appointments').select('*', { count: 'exact' }),
                    supabase.from('appointments').select('*', { count: 'exact' }).eq('date', today),
                    supabase.from('appointments').select('*', { count: 'exact' }).eq('status', 'completed'),
                    supabase.from('appointments').select('*', { count: 'exact' }).eq('status', 'scheduled'),
                    supabase.from('appointments').select('*', { count: 'exact' }).eq('status', 'cancelled')
                ]);

                setDashboardData({
                    totalUsers: usersResponse.count || 0,
                    totalAppointments: appointmentsResponse.count || 0,
                    todayAppointments: todayAppointmentsResponse.count || 0,
                    monthlyRevenue: 0, // This would need price calculation
                    completedAppointments: completedAppointmentsResponse.count || 0,
                    pendingAppointments: pendingAppointmentsResponse.count || 0,
                    cancelledAppointments: cancelledAppointmentsResponse.count || 0,
                    recentActivity: []
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin) {
            fetchDashboardData();
        }
    }, [isAdmin]);

    // Redirect if not admin
    useEffect(() => {
        if (!roleLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, roleLoading, router]);

    if (roleLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
                <div className="text-center">
                    <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
            <Header
                title="Dashboard Administrativo"
                showBackButton={true}
                showDashboardButton={false}
                showHomeButton={true}
                showSettingsButton={true}
                backUrl="/"
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Usuários Total</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
                                <p className="text-xs text-muted-foreground">
                                    +{newPetsThisMonth} novos pets este mês
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agendamentos Total</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.totalAppointments}</div>
                                <p className="text-xs text-muted-foreground">
                                    {dashboardData.todayAppointments} hoje
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pets Cadastrados</CardTitle>
                                <PawPrint className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{petsCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    +{newPetsThisMonth} este mês
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Amanhã</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tomorrowAppointmentsCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    agendamentos
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-green-200 bg-green-50/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-800">Concluídos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-800">{dashboardData.completedAppointments}</div>
                                <p className="text-xs text-green-600">agendamentos finalizados</p>
                            </CardContent>
                        </Card>

                        <Card className="border-orange-200 bg-orange-50/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-orange-800">Pendentes</CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-800">{dashboardData.pendingAppointments}</div>
                                <p className="text-xs text-orange-600">aguardando atendimento</p>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-800">Cancelados</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-800">{dashboardData.cancelledAppointments}</div>
                                <p className="text-xs text-red-600">agendamentos cancelados</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                            className="h-auto p-4 flex flex-col items-center space-y-2"
                            onClick={() => router.push('/users')}
                        >
                            <Users className="h-6 w-6" />
                            <span>Gerenciar Usuários</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-center space-y-2"
                            onClick={() => router.push('/clients-management')}
                        >
                            <UserPlus className="h-6 w-6" />
                            <span>Gestão de Clientes</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-center space-y-2"
                            onClick={() => router.push('/analytics')}
                        >
                            <BarChart3 className="h-6 w-6" />
                            <span>Relatórios</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-center space-y-2"
                            onClick={() => router.push('/appointments')}
                        >
                            <Calendar className="h-6 w-6" />
                            <span>Todos Agendamentos</span>
                        </Button>
                    </div>

                    {/* Dashboard Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                            <TabsTrigger value="pets">Pets</TabsTrigger>
                            <TabsTrigger value="calendar">Calendário</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <Activity className="h-5 w-5 mr-2" />
                                            Atividade Recente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <RecentActivity />
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <CalendarDays className="h-5 w-5 mr-2" />
                                            Agendamentos de Amanhã
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <TomorrowAppointments />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="appointments" className="space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Agendamentos Recentes</CardTitle>
                                    <CardDescription>
                                        Últimos agendamentos realizados no sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RecentAppointments />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="pets" className="space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Pets Cadastrados</CardTitle>
                                    <CardDescription>
                                        Pets registrados no sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RegisteredPets />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="calendar" className="space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Calendário de Agendamentos</CardTitle>
                                    <CardDescription>
                                        Visualização completa dos agendamentos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsCalendar />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}