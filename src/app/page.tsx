"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Calendar, BarChart3, User, Settings } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useClientData } from '@/hooks/useClientData';
import { Header } from '@/components/Header';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { hasClientData, loading: clientDataLoading } = useClientData();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Redirect to client registration if user doesn't have client data (but not admins)
  useEffect(() => {
    if (!loading && !roleLoading && !clientDataLoading && user && !isAdmin && hasClientData === false) {
      router.push('/clients/new');
    }
  }, [user, loading, roleLoading, clientDataLoading, isAdmin, hasClientData, router]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
      <Header
        title="Nara Groomer"
        showBackButton={false}
        showDashboardButton={true}
        showHomeButton={false}
        showSettingsButton={true}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Bem-vindo ao Nara Groomer!
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              O melhor cuidado para seu pet está aqui. Agende banho e tosa com todo o carinho que seu amiguinho merece.
            </p>
            <div className="flex justify-center space-x-4 text-3xl">
              🐕 💖 🐱 ✨ 🛁
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`grid gap-4 md:gap-6 place-items-center mx-auto w-full ${isAdmin
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl'
            }`}>
            <Card
              className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col h-full w-full max-w-sm"
              onClick={() => router.push('/appointments')}
            >
              <CardHeader className="text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-8 w-8 text-primary mx-auto" />
                </div>
                <CardTitle className="text-xl">Novo Agendamento</CardTitle>
                <CardDescription>
                  Agende banho e tosa para seu pet
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end">
                <Button className="w-full rounded-lg" size="lg">
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col h-full w-full max-w-sm"
              onClick={() => router.push('/pets')}
            >
              <CardHeader className="text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <PawPrint className="h-8 w-8 text-primary mx-auto" />
                </div>
                <CardTitle className="text-xl">Gerenciar Pets</CardTitle>
                <CardDescription>
                  Gerencie o cadastro dos seus pets
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end">
                <Button variant="outline" className="w-full rounded-lg" size="lg">
                  Ver Pets
                </Button>
              </CardContent>
            </Card>

            {!isAdmin && (
              <Card
                className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col h-full w-full max-w-sm"
                onClick={() => router.push('/clients')}
              >
                <CardHeader className="text-center">
                  <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <User className="h-8 w-8 text-primary mx-auto" />
                  </div>
                  <CardTitle className="text-xl">Meu Perfil</CardTitle>
                  <CardDescription>
                    {user?.user_metadata?.full_name || user?.email || 'Suas informações pessoais'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                  <Button variant="outline" className="w-full rounded-lg" size="lg">
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card
                className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col h-full w-full max-w-sm"
                onClick={() => router.push('/dashboard')}
              >
                <CardHeader className="text-center">
                  <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                  </div>
                  <CardTitle className="text-xl">Dashboard Admin</CardTitle>
                  <CardDescription>
                    Painel completo de administração
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                  <Button className="w-full rounded-lg" size="lg">
                    Acessar Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Settings Card - For all users */}
            <Card
              className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col h-full w-full max-w-sm"
              onClick={() => router.push('/settings')}
            >
              <CardHeader className="text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-8 w-8 text-primary mx-auto" />
                </div>
                <CardTitle className="text-xl">Configurações</CardTitle>
                <CardDescription>
                  Ajuste suas preferências e tema
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end">
                <Button variant="outline" className="w-full rounded-lg" size="lg">
                  Configurar
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Services Preview */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Nossos Serviços</CardTitle>
              <CardDescription>
                Tudo que seu pet precisa para ficar lindo e cheiroso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-2xl mb-2">🛁</div>
                  <h3 className="font-semibold text-foreground">Banho</h3>
                  <p className="text-sm text-muted-foreground">Banho completo com produtos especiais</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-2xl mb-2">✂️</div>
                  <h3 className="font-semibold text-foreground">Tosa Higiênica</h3>
                  <p className="text-sm text-muted-foreground">Tosa das áreas sensíveis</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-2xl mb-2">💇</div>
                  <h3 className="font-semibold text-foreground">Tosa Completa</h3>
                  <p className="text-sm text-muted-foreground">Corte estilizado e completo</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-2xl mb-2">💆</div>
                  <h3 className="font-semibold text-foreground">Hidratação</h3>
                  <p className="text-sm text-muted-foreground">Tratamento para pelos macios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
