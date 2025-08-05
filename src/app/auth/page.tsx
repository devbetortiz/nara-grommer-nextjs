"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Heart, PawPrint } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router.push]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupData.fullName || !signupData.email || !signupData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    if (error) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        toast({
          title: "E-mail já cadastrado",
          description: "Este e-mail já possui uma conta. Tente fazer login ou use outro e-mail.",
          variant: "destructive"
        });
        // Trocar para aba de login automaticamente
        setCurrentTab('login');
        setLoginData(prev => ({ ...prev, email: signupData.email }));
      } else {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu e-mail para confirmar sua conta.",
      });
      // Limpar dados do formulário
      setSignupData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      // Trocar para aba de login
      setCurrentTab('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu e-mail.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await resetPassword(resetEmail);
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Header */}
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

        {/* Auth Forms */}
        <Card className="border-primary/20 shadow-lg">
          {!showForgotPassword ? (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">Bem-vindo de volta!</CardTitle>
                  <CardDescription>
                    Entre para agendar o próximo banho do seu pet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-lg"
                      size="lg"
                    >
                      Entrar
                    </Button>
                  </form>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary underline"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="signup">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">Crie sua conta</CardTitle>
                  <CardDescription>
                    Junte-se à família Nara Groomer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          fullName: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar senha</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        className="rounded-lg"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-lg"
                      size="lg"
                    >
                      Criar conta
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Recuperar Senha</CardTitle>
                <CardDescription>
                  Digite seu e-mail para receber as instruções de recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">E-mail</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-lg"
                    size="lg"
                  >
                    Enviar instruções
                  </Button>
                </form>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              </CardContent>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Feito com ❤️ para o bem-estar dos pets</p>
        </div>
      </div>
    </div>
  );
}