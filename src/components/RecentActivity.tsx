import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, PawPrint, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'appointment' | 'pet' | 'user';
  action: string;
  description: string;
  timestamp: string;
  status?: string;
  userName?: string;
  petName?: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);

        // Fetch recent appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            service_type,
            pets(name),
            profiles(full_name)
          `)
          .order('updated_at', { ascending: false })
          .limit(5);

        // Fetch recent pets
        const { data: pets } = await supabase
          .from('pets')
          .select(`
            id,
            name,
            created_at,
            profiles(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch recent users (profiles)
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(2);

        // Combine and format activities
        const activityList: ActivityItem[] = [];

        // Process appointments
        appointments?.forEach(appointment => {
          const petName = appointment.pets?.name || 'Pet';
          const userName = appointment.profiles?.full_name || 'Cliente';

          if (appointment.status === 'concluido') {
            activityList.push({
              id: `appointment-${appointment.id}`,
              type: 'appointment',
              action: 'concluído',
              description: `${petName} - ${appointment.service_type}`,
              timestamp: appointment.updated_at,
              status: 'completed',
              userName,
              petName
            });
          } else if (appointment.status === 'agendado') {
            activityList.push({
              id: `appointment-${appointment.id}`,
              type: 'appointment',
              action: 'agendado',
              description: `${petName} - ${appointment.service_type}`,
              timestamp: appointment.created_at,
              status: 'scheduled',
              userName,
              petName
            });
          } else if (appointment.status === 'cancelado') {
            activityList.push({
              id: `appointment-${appointment.id}`,
              type: 'appointment',
              action: 'cancelado',
              description: `${petName} - ${appointment.service_type}`,
              timestamp: appointment.updated_at,
              status: 'cancelled',
              userName,
              petName
            });
          }
        });

        // Process pets
        pets?.forEach(pet => {
          const userName = pet.profiles?.full_name || 'Cliente';
          activityList.push({
            id: `pet-${pet.id}`,
            type: 'pet',
            action: 'cadastrado',
            description: `Novo pet: ${pet.name}`,
            timestamp: pet.created_at,
            userName,
            petName: pet.name
          });
        });

        // Process users
        users?.forEach(user => {
          activityList.push({
            id: `user-${user.id}`,
            type: 'user',
            action: 'cadastrado',
            description: `Novo cliente: ${user.full_name || 'Sem nome'}`,
            timestamp: user.created_at,
            userName: user.full_name ?? undefined
          });
        });

        // Sort by timestamp and take the most recent 8 items
        const sortedActivities = activityList
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 8);

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'pet':
        return <PawPrint className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  const getStatusBadge = (action: string) => {
    if (action === 'concluído') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Concluído</Badge>;
    }
    if (action === 'agendado') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Agendado</Badge>;
    }
    if (action === 'cancelado') {
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Cancelado</Badge>;
    }
    if (action === 'cadastrado') {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">Novo</Badge>;
    }
    return null;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimas movimentações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded w-48"></div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
        <CardDescription>
          Últimas movimentações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade recente encontrada</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`}></div>
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <span className="text-sm font-medium">{activity.description}</span>
                  </div>
                  {getStatusBadge(activity.action)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};