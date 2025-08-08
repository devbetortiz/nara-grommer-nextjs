"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, Send, Settings, Heart } from 'lucide-react';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useToast } from '@/hooks/use-toast';

export function EmailDashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testName, setTestName] = useState('');
    const [healthStatus, setHealthStatus] = useState<{ healthy: boolean; error?: string } | null>(null);
    const [testResults, setTestResults] = useState<Array<{
        type: string;
        email: string;
        name: string;
        success: boolean;
        timestamp: string;
        details?: unknown;
        error?: string;
    }>>([]);

    const {
        sendWelcomeEmail,
        sendAppointmentConfirmation,
        checkEmailServiceHealth,
        isLoading
    } = useEmailNotifications();

    const { toast } = useToast();

    const handleHealthCheck = async () => {
        try {
            const result = await checkEmailServiceHealth();
            setHealthStatus(result);

            toast({
                title: result.healthy ? "✅ Serviço Saudável" : "❌ Serviço com Problemas",
                description: result.healthy ? "Todos os sistemas funcionando!" : result.error,
                variant: result.healthy ? "default" : "destructive"
            });
        } catch (error) {
            console.error('Erro no health check:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setHealthStatus({ healthy: false, error: errorMessage });
        }
    };

    const handleTestWelcomeEmail = async () => {
        if (!testEmail || !testName) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha email e nome para testar",
                variant: "destructive"
            });
            return;
        }

        try {
            const result = await sendWelcomeEmail(testName, testEmail);

            const testResult = {
                type: 'welcome',
                email: testEmail,
                name: testName,
                success: result.success,
                timestamp: new Date().toISOString(),
                details: result
            };

            setTestResults(prev => [testResult, ...prev.slice(0, 9)]);

            toast({
                title: "✅ Email de Boas-vindas",
                description: `Enviado com sucesso para ${testEmail}`,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const testResult = {
                type: 'welcome',
                email: testEmail,
                name: testName,
                success: false,
                timestamp: new Date().toISOString(),
                error: errorMessage
            };

            setTestResults(prev => [testResult, ...prev.slice(0, 9)]);

            toast({
                title: "❌ Erro no Email",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleTestAppointmentEmail = async () => {
        if (!testEmail || !testName) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha email e nome para testar",
                variant: "destructive"
            });
            return;
        }

        try {
            const mockAppointmentData = {
                petName: 'Rex',
                appointmentDate: new Date().toLocaleDateString('pt-BR'),
                appointmentTime: '14:30',
                veterinarianName: 'Dr. Maria Silva',
                clinicName: 'Clínica Nara Grommer',
                clinicAddress: 'Rua das Flores, 123 - Centro'
            };

            const result = await sendAppointmentConfirmation(testName, testEmail, mockAppointmentData);

            const testResult = {
                type: 'appointment',
                email: testEmail,
                name: testName,
                success: result.success,
                timestamp: new Date().toISOString(),
                details: result
            };

            setTestResults(prev => [testResult, ...prev.slice(0, 9)]);

            toast({
                title: "✅ Email de Agendamento",
                description: `Enviado com sucesso para ${testEmail}`,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const testResult = {
                type: 'appointment',
                email: testEmail,
                name: testName,
                success: false,
                timestamp: new Date().toISOString(),
                error: errorMessage
            };

            setTestResults(prev => [testResult, ...prev.slice(0, 9)]);

            toast({
                title: "❌ Erro no Email",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    setIsOpen(true);
                    handleHealthCheck();
                }}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
                <Mail className="h-4 w-4" />
                Dashboard de Emails
            </Button>
        );
    }

    return (
        <Card className="w-full max-w-4xl mx-auto mt-4 border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Settings className="h-5 w-5" />
                    Dashboard de Gerenciamento de Emails
                </CardTitle>
                <CardDescription>
                    Teste e monitore o sistema de notificações por email
                </CardDescription>
            </CardHeader>
            <CardContent>

                {/* Health Status */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Status do Serviço</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleHealthCheck}
                            disabled={isLoading}
                        >
                            🏥 Verificar Saúde
                        </Button>
                    </div>

                    {healthStatus && (
                        <Alert className={healthStatus.healthy ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                            {healthStatus.healthy ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                            <AlertDescription className={healthStatus.healthy ? "text-green-800" : "text-red-800"}>
                                {healthStatus.healthy ? (
                                    <div>
                                        <strong>✅ Serviço funcionando perfeitamente!</strong>
                                        <br />
                                        <small>Última verificação: {new Date().toLocaleString('pt-BR')}</small>
                                    </div>
                                ) : (
                                    <div>
                                        <strong>❌ Problema detectado:</strong> {healthStatus.error}
                                        <br />
                                        <small>Verifique a configuração do Resend API Key</small>
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <Tabs defaultValue="test" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="test">🧪 Teste de Emails</TabsTrigger>
                        <TabsTrigger value="history">📊 Histórico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="test" className="space-y-4">
                        {/* Test Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="testEmail">Email de Teste</Label>
                                <Input
                                    id="testEmail"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="testName">Nome de Teste</Label>
                                <Input
                                    id="testName"
                                    placeholder="Nome do Usuário"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Test Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={handleTestWelcomeEmail}
                                disabled={isLoading || !testEmail || !testName}
                                className="w-full"
                                variant="outline"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Testar Email de Boas-vindas
                            </Button>

                            <Button
                                onClick={handleTestAppointmentEmail}
                                disabled={isLoading || !testEmail || !testName}
                                className="w-full"
                                variant="outline"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Testar Email de Agendamento
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Últimos Testes</h3>
                            <Badge variant="secondary">
                                {testResults.length} registros
                            </Badge>
                        </div>

                        {testResults.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    Nenhum teste realizado ainda. Use a aba &quot;Teste de Emails&quot; para começar.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {testResults.map((result, index) => (
                                    <div key={index} className={`p-3 rounded-lg border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                                                <Badge variant={result.type === 'welcome' ? 'default' : 'secondary'}>
                                                    {result.type === 'welcome' ? '👋 Boas-vindas' : '📅 Agendamento'}
                                                </Badge>
                                                <span className="text-sm font-medium">{result.email}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(result.timestamp).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        {!result.success && result.error && (
                                            <p className="text-sm text-red-600 mt-1">{result.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                    >
                        Fechar Dashboard
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>Sistema de emails Nara Grommer</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
