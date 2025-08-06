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
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (user) {
      router.push('/');
      return;
    }

    const validateToken = async () => {
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de redefinição não encontrado.",
          variant: "destructive"
        });
        router.push('/auth');
        return;
      }

      try {
        const response = await fetch(
          `https://dsmtvpcdifooagtjqjve.supabase.co/functions/v1/validate-reset-token?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.valid) {
          toast({
            title: "Token inválido",
            description: result?.error || "O link de redefinição é inválido ou expirou.",
            variant: "destructive"
          });
          router.push('/auth');
        } else {
          setTokenValid(true);
        }
      } catch {
        toast({
          title: "Erro",
          description: "Erro ao validar token de redefinição.",
          variant: "destructive"
        });
        router.push('/auth');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [user, router, token, toast]);

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

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-reset-token', {
        body: {
          token: token,
          newPassword: newPassword
        }
      });

      const response = typeof data === 'string' ? JSON.parse(data) : data;

      if (error || !response.success) {
        toast({
          title: "Erro",
          description: response?.error || "Erro ao redefinir senha.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi redefinida com sucesso. Faça login com sua nova senha.",
        });
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

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
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