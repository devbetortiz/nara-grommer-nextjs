"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Mail, Send, Settings, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
    success: boolean;
    message: string;
    emailId?: string;
    error?: string;
    timestamp: string;
}

export default function TestResendPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);

    // Estados para teste personalizado
    const [customEmail, setCustomEmail] = useState({
        to: '',
        subject: '',
        content: '',
        type: 'simple'
    });

    // Estados para teste de template
    const [templateTest, setTemplateTest] = useState({
        to: '',
        type: 'welcome',
        userName: '',
        userEmail: '',
        petName: '',
        serviceType: 'banho',
        appointmentDate: '',
        appointmentTime: ''
    });

    const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
        const newResult: TestResult = {
            ...result,
            timestamp: new Date().toLocaleString('pt-BR')
        };
        setTestResults(prev => [newResult, ...prev]);
    };

    // Teste simples usando a função test-email
    const testSimpleConnection = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('test-email', {
                method: 'POST'
            });

            if (error) throw error;

            addTestResult({
                success: data.success,
                message: data.message,
                emailId: data.emailId
            });

            toast({
                title: data.success ? "Sucesso!" : "Erro",
                description: data.message,
                variant: data.success ? "default" : "destructive"
            });

        } catch (error: any) {
            addTestResult({
                success: false,
                message: "Erro ao conectar com a função edge",
                error: error.message
            });

            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Teste de template específico
    const testEmailTemplate = async () => {
        if (!templateTest.to || !templateTest.userName || !templateTest.userEmail) {
            toast({
                title: "Erro",
                description: "Preencha todos os campos obrigatórios",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-notification-email', {
                body: {
                    type: templateTest.type,
                    to: templateTest.to,
                    data: {
                        userName: templateTest.userName,
                        userEmail: templateTest.userEmail,
                        petName: templateTest.petName,
                        serviceType: templateTest.serviceType,
                        appointmentDate: templateTest.appointmentDate,
                        appointmentTime: templateTest.appointmentTime,
                        price: 50.00
                    }
                }
            });

            if (error) throw error;

            addTestResult({
                success: data.success,
                message: `Template '${templateTest.type}' enviado com sucesso`,
                emailId: data.messageId
            });

            toast({
                title: "Sucesso!",
                description: `Email do tipo '${templateTest.type}' enviado!`,
            });

        } catch (error: any) {
            addTestResult({
                success: false,
                message: `Erro ao enviar template '${templateTest.type}'`,
                error: error.message
            });

            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-primary/20">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                            <TestTube className="h-6 w-6 text-primary" />
                            Teste da API Resend
                        </CardTitle>
                        <CardDescription>
                            Teste suas configurações de email e templates
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Teste Simples */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Teste de Conexão Simples
                            </CardTitle>
                            <CardDescription>
                                Testa a configuração básica da API Resend
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-medium mb-2">O que será testado:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>✓ Conexão com API Resend</li>
                                    <li>✓ Configuração da API Key</li>
                                    <li>✓ Verificação do domínio</li>
                                    <li>✓ Funcionamento da Edge Function</li>
                                </ul>
                            </div>

                            <Button
                                onClick={testSimpleConnection}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Testando...' : 'Testar Conexão'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Teste de Templates */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Teste de Templates
                            </CardTitle>
                            <CardDescription>
                                Teste os templates específicos de email
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="template-email">Email de destino *</Label>
                                    <Input
                                        id="template-email"
                                        type="email"
                                        value={templateTest.to}
                                        onChange={(e) => setTemplateTest(prev => ({ ...prev, to: e.target.value }))}
                                        placeholder="seu@email.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="template-type">Tipo de Template *</Label>
                                    <Select
                                        value={templateTest.type}
                                        onValueChange={(value) => setTemplateTest(prev => ({ ...prev, type: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="welcome">Boas-vindas</SelectItem>
                                            <SelectItem value="appointment_confirmation">Confirmação de Agendamento</SelectItem>
                                            <SelectItem value="appointment_reminder">Lembrete de Agendamento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user-name">Nome do usuário *</Label>
                                    <Input
                                        id="user-name"
                                        value={templateTest.userName}
                                        onChange={(e) => setTemplateTest(prev => ({ ...prev, userName: e.target.value }))}
                                        placeholder="João Silva"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user-email">Email do usuário *</Label>
                                    <Input
                                        id="user-email"
                                        type="email"
                                        value={templateTest.userEmail}
                                        onChange={(e) => setTemplateTest(prev => ({ ...prev, userEmail: e.target.value }))}
                                        placeholder="joao@email.com"
                                    />
                                </div>

                                {(templateTest.type === 'appointment_confirmation' || templateTest.type === 'appointment_reminder') && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="pet-name">Nome do Pet</Label>
                                            <Input
                                                id="pet-name"
                                                value={templateTest.petName}
                                                onChange={(e) => setTemplateTest(prev => ({ ...prev, petName: e.target.value }))}
                                                placeholder="Rex"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="service-type">Serviço</Label>
                                            <Select
                                                value={templateTest.serviceType}
                                                onValueChange={(value) => setTemplateTest(prev => ({ ...prev, serviceType: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="banho">Banho</SelectItem>
                                                    <SelectItem value="tosa_higienica">Tosa Higiênica</SelectItem>
                                                    <SelectItem value="tosa_completa">Tosa Completa</SelectItem>
                                                    <SelectItem value="hidratacao">Hidratação</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="appointment-date">Data do Agendamento</Label>
                                            <Input
                                                id="appointment-date"
                                                type="date"
                                                value={templateTest.appointmentDate}
                                                onChange={(e) => setTemplateTest(prev => ({ ...prev, appointmentDate: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="appointment-time">Horário</Label>
                                            <Input
                                                id="appointment-time"
                                                type="time"
                                                value={templateTest.appointmentTime}
                                                onChange={(e) => setTemplateTest(prev => ({ ...prev, appointmentTime: e.target.value }))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={testEmailTemplate}
                                disabled={loading}
                                className="w-full"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {loading ? 'Enviando...' : 'Enviar Template'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Resultados dos Testes */}
                {testResults.length > 0 && (
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle>Histórico de Testes</CardTitle>
                            <CardDescription>
                                Resultados dos últimos testes executados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {testResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {result.success ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                                )}
                                                <div>
                                                    <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                                        {result.message}
                                                    </p>
                                                    {result.emailId && (
                                                        <p className="text-sm text-muted-foreground">
                                                            ID: {result.emailId}
                                                        </p>
                                                    )}
                                                    {result.error && (
                                                        <p className="text-sm text-red-600">
                                                            Erro: {result.error}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={result.success ? "default" : "destructive"}>
                                                {result.timestamp}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Informações de Configuração */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle>Informações de Configuração</CardTitle>
                        <CardDescription>
                            Verifique se sua configuração está correta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-medium mb-2">Variáveis de Ambiente</h4>
                                <ul className="text-sm space-y-1">
                                    <li>• RESEND_API_KEY (no Supabase)</li>
                                    <li>• Domínio verificado no Resend</li>
                                    <li>• Registros SPF configurados</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-medium mb-2">Edge Functions Disponíveis</h4>
                                <ul className="text-sm space-y-1">
                                    <li>• test-email (teste simples)</li>
                                    <li>• send-notification-email (templates)</li>
                                    <li>• send-appointment-reminders</li>
                                    <li>• send-password-reset</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}