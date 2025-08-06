"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/Header';

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role?: 'admin' | 'user';
}

const UserManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    } else if (!roleLoading && !isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, roleLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
      } else {
        // Remove admin role (user becomes regular user)
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Usuário ${newRole === 'admin' ? 'promovido a' : 'rebaixado para'} ${newRole}.`,
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o papel do usuário.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary/30">
      <Header
        title="Gerenciar Usuários"
        subtitle="Administração de usuários do sistema"
        backUrl="/dashboard"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span>Informações Importantes</span>
              </CardTitle>
              <CardDescription>
                Aqui você pode promover usuários a administradores ou rebaixá-los para usuários normais.
                Administradores têm acesso a relatórios e podem gerenciar outros usuários.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Users List */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Lista de Usuários ({users.length})</CardTitle>
              <CardDescription>
                Gerencie as permissões dos usuários cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-muted-foreground">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((userData) => (
                    <div
                      key={userData.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {userData.role === 'admin' ? (
                            <Shield className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {userData.full_name || 'Nome não informado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Cadastrado em: {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={userData.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {userData.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>

                        {userData.id !== user.id && (
                          <Button
                            variant={userData.role === 'admin' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => toggleUserRole(userData.id, userData.role || 'user')}
                          >
                            {userData.role === 'admin' ? 'Rebaixar' : 'Promover'}
                          </Button>
                        )}

                        {userData.id === user.id && (
                          <Badge variant="outline" className="text-xs">
                            Você
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;