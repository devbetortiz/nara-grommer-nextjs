"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Settings, AlertTriangle } from 'lucide-react';
import { checkSupabaseAuthSettings } from '@/utils/fix-supabase-settings';

export function SupabaseConfigHelper() {
    const [isOpen, setIsOpen] = useState(false);
    const [checkResult] = useState<{ status: string; message: string } | null>(null);

    const handleCheck = async () => {
        await checkSupabaseAuthSettings();
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    setIsOpen(true);
                    handleCheck();
                }}
                className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
                <AlertTriangle className="h-4 w-4" />
                Corrigir Erro de Email
            </Button>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto mt-4 border-orange-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Settings className="h-5 w-5" />
                    Corrigir &quot;Error sending confirmation email&quot;
                </CardTitle>
                <CardDescription>
                    Guia para resolver o erro de confirmação por email no Supabase
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <strong>Problema:</strong> O Supabase está tentando enviar emails de confirmação, mas não tem SMTP configurado corretamente.
                    </AlertDescription>
                </Alert>

                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">🔧 Solução 1: Desabilitar Confirmação (Rápido)</h4>
                    <div className="pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('https://supabase.com/dashboard/project/dsmtvpcdifooagtjqjve/auth/settings', '_blank')}
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Abrir Configurações Auth
                            </Button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>• Vá para <strong>Authentication → Settings</strong></p>
                            <p>• Encontre <strong>&quot;Enable email confirmations&quot;</strong></p>
                            <p>• <strong>DESABILITE</strong> esta opção</p>
                            <p>• Clique em <strong>&quot;Save&quot;</strong></p>
                            <p>• Teste o cadastro novamente</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">📧 Solução 2: Configurar SMTP (Recomendado)</h4>
                    <div className="pl-4 space-y-2">
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>• Vá para <strong>Authentication → Settings → SMTP Settings</strong></p>
                            <p>• Configure um provedor (Gmail, SendGrid, Resend)</p>
                            <p>• Ative a opção <strong>&quot;Enable Custom SMTP&quot;</strong></p>
                            <p>• Preencha os dados do servidor SMTP</p>
                            <p>• Teste o envio de email</p>
                        </div>
                    </div>
                </div>

                <Alert>
                    <AlertDescription>
                        <strong>Recomendação:</strong> Use a Solução 1 para desenvolvimento e a Solução 2 para produção.
                    </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                    >
                        Fechar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheck}
                    >
                        Verificar Novamente
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
