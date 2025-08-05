"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { useUserRole } from '@/hooks/useUserRole';
import { Moon, Sun, Monitor, Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header
        title="Configurações"
        subtitle="Personalize sua experiência"
        backUrl="/"
        showSettingsButton={false}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <SettingsIcon className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">
              Configurações
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ajuste suas preferências e configurações do sistema
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">

            {/* Appearance Settings */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Aparência
                </CardTitle>
                <CardDescription>
                  Personalize a aparência da interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="theme" className="text-base font-medium">
                    Tema da Interface
                  </Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Escolha entre tema claro, escuro ou seguir a configuração do sistema
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Conta
                </CardTitle>
                <CardDescription>
                  Informações e configurações da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.user_metadata?.full_name || 'Nome não informado'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Conta</Label>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? 'Administrador' : 'Cliente'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Membro desde</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/clients')}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Settings */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure quando e como você recebe notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        Notificações por Email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba emails sobre agendamentos e atualizações
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="reminder-notifications" className="text-base font-medium">
                        Lembretes de Agendamento
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes antes dos seus agendamentos
                      </p>
                    </div>
                    <Switch id="reminder-notifications" defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="marketing-notifications" className="text-base font-medium">
                        Ofertas e Promoções
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba informações sobre ofertas especiais
                      </p>
                    </div>
                    <Switch id="marketing-notifications" />
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;