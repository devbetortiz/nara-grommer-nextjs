"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, PawPrint } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function ResetPasswordContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check for session from URL hash fragments (Supabase Auth)
  const [session, setSession] = useState<{ user: { email: string } } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
      return;
    }

    const checkSession = async () => {
      try {
        // Check if we have session data in the URL hash
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: "Erro",
            description: "Erro ao verificar sessão de redefinição.",
            variant: "destructive"
          });
          router.push('/auth');
          return;
        }

        if (!currentSession) {
          // Check URL parameters for access_token (Supabase magic link)
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const type = searchParams.get('type');

          if (accessToken && refreshToken && type === 'recovery') {
            // Set the session with the tokens from URL
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              toast({
                title: "Link inválido",
                description: "O link de redefinição é inválido ou expirou.",
                variant: "destructive"
              });
              router.push('/auth');
              return;
            }

            setSession(sessionData.session);
          } else {
            toast({
              title: "Link inválido",
              description: "Link de redefinição não encontrado ou inválido.",
              variant: "destructive"
            });
            router.push('/auth');
            return;
          }
        } else {
          setSession(currentSession);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar link de redefinição.",
          variant: "destructive"
        });
        router.push('/auth');
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [user, router, searchParams, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (!session) {
      toast({
        title: "Erro",
        description: "Sessão de redefinição não encontrada.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao redefinir senha.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi redefinida com sucesso. Faça login com sua nova senha.",
        });

        // Sign out the user so they can login with the new password
        await supabase.auth.signOut();
        router.push('/auth');
      }
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao redefinir a senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verificando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-primary p-3 rounded-full">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Nara Groomer</h1>
          </div>
          <p className="text-muted-foreground">
            Cuidado com amor para seu melhor amigo
          </p>
          <div className="flex justify-center space-x-4 text-2xl">
            🐕 🐱 ✨
          </div>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <PawPrint className="h-4 w-4 animate-pulse" />
                    <span>Atualizando...</span>
                  </div>
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </form>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                Voltar ao login
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Feito com ❤️ para o bem-estar dos pets</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}