"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, Clock, TrendingUp, ShieldAlert, BarChart3, PieChart, Target, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/Header";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie } from 'recharts';

interface AppointmentStats {
  total: number;
  thisMonth: number;
  completed: number;
  canceled: number;
  revenue: number;
}

interface PetStats {
  total: number;
  byBreed: { breed: string; count: number }[];
}

interface ServiceStats {
  service: string;
  count: number;
  revenue: number;
}

interface DailyStats {
  date: string;
  appointments: number;
  revenue: number;
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const serviceTypeNames = {
  banho: 'Banho',
  tosa_higienica: 'Tosa Higiênica',
  tosa_completa: 'Tosa Completa',
  hidratacao: 'Hidratação',
  banho_tosa: 'Banho + Tosa'
};

const Analytics = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    thisMonth: 0,
    completed: 0,
    canceled: 0,
    revenue: 0
  });
  const [petStats, setPetStats] = useState<PetStats>({ total: 0, byBreed: [] });
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
      return;
    }

    if (user && !roleLoading) {
      loadAnalytics();
    }
  }, [user, loading, router.push, roleLoading, isAdmin]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      console.log('Loading analytics - isAdmin:', isAdmin, 'roleLoading:', roleLoading);

      // Carregar estatísticas de agendamentos para admin (todos) ou usuário (próprios)
      const appointmentsQuery = supabase
        .from("appointments")
        .select("*");

      // Se não for admin, filtrar pelos agendamentos do usuário
      if (!isAdmin && user?.id) {
        console.log('Not admin, filtering by user_id:', user.id);
        appointmentsQuery.eq("user_id", user.id);
      } else {
        console.log('Admin user, loading all appointments');
      }

      const { data: appointments, error: appointmentsError } = await appointmentsQuery;
      if (appointmentsError) throw appointmentsError;

      console.log('Appointments loaded:', appointments?.length || 0, 'appointments');

      // Carregar estatísticas de pets
      const petsQuery = supabase
        .from("pets")
        .select("breed");

      if (!isAdmin && user?.id) {
        petsQuery.eq("user_id", user.id);
      }

      const { data: pets, error: petsError } = await petsQuery;

      if (petsError) throw petsError;

      // Calcular estatísticas de agendamentos
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthAppointments = appointments?.filter(apt =>
        new Date(apt.created_at) >= thisMonthStart
      ) || [];

      const completedAppointments = appointments?.filter(apt => apt.status === "concluido") || [];
      const canceledAppointments = appointments?.filter(apt => apt.status === "cancelado") || [];

      const totalRevenue = completedAppointments.reduce((sum, apt) =>
        sum + (parseFloat(apt.price?.toString() || "0")), 0
      );

      console.log('Calculating stats - Total appointments:', appointments?.length);
      console.log('Completed appointments:', completedAppointments.length);
      console.log('Canceled appointments:', canceledAppointments.length);
      console.log('Total revenue:', totalRevenue);

      setAppointmentStats({
        total: appointments?.length || 0,
        thisMonth: thisMonthAppointments.length,
        completed: completedAppointments.length,
        canceled: canceledAppointments.length,
        revenue: totalRevenue
      });

      // Calcular estatísticas de pets por raça
      const breedCounts = pets?.reduce((acc, pet) => {
        const breed = pet.breed || "Não informado";
        acc[breed] = (acc[breed] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const breedStats = Object.entries(breedCounts)
        .map(([breed, count]) => ({ breed, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log('Total pets:', pets?.length);
      console.log('Breed stats:', breedStats);

      setPetStats({
        total: pets?.length || 0,
        byBreed: breedStats
      });

      // Calcular estatísticas por serviço
      const serviceCounts = appointments?.reduce((acc, apt) => {
        const service = apt.service_type;
        if (!acc[service]) {
          acc[service] = { count: 0, revenue: 0 };
        }
        acc[service].count += 1;
        if (apt.status === "concluido") {
          acc[service].revenue += parseFloat(apt.price?.toString() || "0");
        }
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>) || {};

      const serviceStatsArray = Object.entries(serviceCounts)
        .map(([service, data]) => ({
          service: serviceTypeNames[service as keyof typeof serviceTypeNames] || service,
          count: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.count - a.count);

      setServiceStats(serviceStatsArray);

      // Calcular estatísticas diárias dos últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dateStr = format(date, "yyyy-MM-dd");

        const dayAppointments = appointments?.filter(apt => {
          const aptDate = format(new Date(apt.appointment_date), "yyyy-MM-dd");
          return aptDate === dateStr;
        }) || [];

        const dayRevenue = dayAppointments
          .filter(apt => apt.status === "concluido")
          .reduce((sum, apt) => sum + (parseFloat(apt.price?.toString() || "0")), 0);

        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          appointments: dayAppointments.length,
          revenue: dayRevenue
        };
      });

      setDailyStats(last7Days);

      // Calcular estatísticas mensais dos últimos 6 meses
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const monthAppointments = appointments?.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        }) || [];

        const monthRevenue = monthAppointments
          .filter(apt => apt.status === "concluido")
          .reduce((sum, apt) => sum + (parseFloat(apt.price?.toString() || "0")), 0);

        return {
          month: format(date, "MMM/yy", { locale: ptBR }),
          appointments: monthAppointments.length,
          revenue: monthRevenue,
          completed: monthAppointments.filter(apt => apt.status === "concluido").length,
          canceled: monthAppointments.filter(apt => apt.status === "cancelado").length
        };
      });

      setMonthlyStats(last6Months);

    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados analíticos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-bounce text-4xl">🐾</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Header
          title="Acesso Restrito"
          showDashboardButton={false}
          showHomeButton={true}
        />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Esta página é restrita apenas para administradores.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.back()} className="w-full">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header
        title="Relatórios e Analytics"
        subtitle={isAdmin ? "Análise completa do negócio" : "Análise dos seus dados"}
        backUrl="/dashboard"
        badge={isAdmin ? "Admin" : undefined}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointmentStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {appointmentStats.thisMonth} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {appointmentStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {appointmentStats.completed} agendamentos concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{petStats.total}</div>
              <p className="text-xs text-muted-foreground">
                Pets cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointmentStats.total > 0
                  ? Math.round((appointmentStats.completed / appointmentStats.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {appointmentStats.canceled} cancelados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha - Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Mensal
              </CardTitle>
              <CardDescription>Agendamentos e receita dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue' ? `R$ ${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Receita' : name === 'appointments' ? 'Agendamentos' : name
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="appointments" fill="#8B5CF6" name="Agendamentos" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Receita" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Distribuição de Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição de Serviços
              </CardTitle>
              <CardDescription>Porcentagem de agendamentos por tipo de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={serviceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {serviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Agendamentos"]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas dos Últimos 7 Dias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Últimos 7 Dias
            </CardTitle>
            <CardDescription>Agendamentos e receita diária</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? `R$ ${Number(value).toFixed(2)}` : value,
                    name === 'revenue' ? 'Receita' : 'Agendamentos'
                  ]}
                />
                <Bar yAxisId="left" dataKey="appointments" fill="#8B5CF6" name="Agendamentos" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking de Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Ranking de Serviços
              </CardTitle>
              <CardDescription>Desempenho e receita por tipo de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceStats.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-background to-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{service.service}</h4>
                        <p className="text-sm text-muted-foreground">{service.count} agendamentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        R$ {service.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        R$ {service.count > 0 ? (service.revenue / service.count).toFixed(2) : '0.00'} médio
                      </div>
                    </div>
                  </div>
                ))}
                {serviceStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum serviço encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Raças */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Raças Mais Comuns
              </CardTitle>
              <CardDescription>Distribuição de pets cadastrados por raça</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {petStats.byBreed.map((breed, index) => {
                  const percentage = petStats.total > 0 ? (breed.count / petStats.total) * 100 : 0;
                  return (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-background to-secondary/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{breed.breed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{breed.count} pets</Badge>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {petStats.byBreed.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum pet encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights e Recomendações */}
        {isAdmin && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Insights do Negócio
              </CardTitle>
              <CardDescription>Análises automáticas baseadas nos dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Ticket Médio</h4>
                  <p className="text-2xl font-bold">
                    R$ {appointmentStats.completed > 0 ?
                      (appointmentStats.revenue / appointmentStats.completed).toFixed(2) :
                      '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground">Por agendamento concluído</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Taxa de Conversão</h4>
                  <p className="text-2xl font-bold">
                    {appointmentStats.total > 0 ?
                      ((appointmentStats.completed / appointmentStats.total) * 100).toFixed(1) :
                      '0.0'}%
                  </p>
                  <p className="text-sm text-muted-foreground">Agendamentos concluídos</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Serviço Top</h4>
                  <p className="text-lg font-bold">
                    {serviceStats.length > 0 ? serviceStats[0].service : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {serviceStats.length > 0 ? `${serviceStats[0].count} agendamentos` : 'Nenhum dado'}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Raça Favorita</h4>
                  <p className="text-lg font-bold">
                    {petStats.byBreed.length > 0 ? petStats.byBreed[0].breed : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {petStats.byBreed.length > 0 ? `${petStats.byBreed[0].count} pets` : 'Nenhum dado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;