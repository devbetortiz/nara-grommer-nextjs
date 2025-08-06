"use client";

import { useEffect, useState, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  user_id: string;
}

const ConfirmAppointment = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');
  const [message, setMessage] = useState('');
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);

  const appointmentId = searchParams.get('id');
  const token = searchParams.get('token');
  const statusParam = searchParams.get('status');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    const handleConfirmation = async () => {
      // Verificar se há um parâmetro de erro vindo da edge function
      if (errorParam) {
        setStatus('error');
        switch (errorParam) {
          case 'invalid_params':
            setMessage('Link inválido - parâmetros necessários não foram fornecidos.');
            break;
          case 'not_found':
            setMessage('Agendamento não encontrado.');
            break;
          case 'invalid_token':
            setMessage('Token de confirmação inválido ou expirado.');
            break;
          case 'update_failed':
            setMessage('Erro interno - não foi possível confirmar o agendamento. Tente novamente.');
            break;
          default:
            setMessage('Erro desconhecido - tente novamente mais tarde.');
        }
        return;
      }

      // Verificar se há um parâmetro de status vindo da edge function
      if (statusParam) {
        if (statusParam === 'success') {
          setStatus('success');
          setMessage('Seu agendamento foi confirmado com sucesso!');
          // Buscar dados do agendamento para exibir
          if (appointmentId) {
            try {
              const { data: appointmentData } = await supabase
                .from('appointments')
                .select('id, status, user_id, appointment_date, appointment_time')
                .eq('id', appointmentId)
                .single();

              if (appointmentData) {
                setAppointment(appointmentData);
              }
            } catch (error) {
              console.error('Erro ao buscar dados do agendamento:', error);
            }
          }
          return;
        }

        if (statusParam === 'already_confirmed') {
          setStatus('already_confirmed');
          setMessage('Este agendamento já foi confirmado anteriormente.');
          // Buscar dados do agendamento para exibir
          if (appointmentId) {
            try {
              const { data: appointmentData } = await supabase
                .from('appointments')
                .select('id, status, user_id, appointment_date, appointment_time')
                .eq('id', appointmentId)
                .single();

              if (appointmentData) {
                setAppointment(appointmentData);
              }
            } catch (error) {
              console.error('Erro ao buscar dados do agendamento:', error);
            }
          }
          return;
        }
      }

      // Se chegou aqui, deve processar a confirmação normalmente
      if (!appointmentId || !token) {
        setStatus('error');
        setMessage('Link inválido - parâmetros necessários não foram fornecidos.');
        return;
      }

      try {
        // Buscar o agendamento
        const { data: appointmentData, error: fetchError } = await supabase
          .from('appointments')
          .select('id, status, user_id, appointment_date, appointment_time')
          .eq('id', appointmentId)
          .single();

        if (fetchError || !appointmentData) {
          setStatus('error');
          setMessage('Agendamento não encontrado.');
          return;
        }

        // Verificar se já está confirmado
        if (appointmentData.status === 'confirmado') {
          setStatus('already_confirmed');
          setAppointment(appointmentData);
          setMessage('Este agendamento já foi confirmado anteriormente.');
          return;
        }

        // Validar token
        const expectedToken = `${appointmentData.user_id}-${appointmentId}`.replace(/-/g, '').substring(0, 16);

        if (token !== expectedToken) {
          setStatus('error');
          setMessage('Token de confirmação inválido ou expirado.');
          return;
        }

        // Atualizar status para confirmado
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ status: 'confirmado' })
          .eq('id', appointmentId);

        if (updateError) {
          setStatus('error');
          setMessage('Erro interno - não foi possível confirmar o agendamento. Tente novamente.');
          return;
        }

        setStatus('success');
        setAppointment(appointmentData);
        setMessage('Seu agendamento foi confirmado com sucesso!');

      } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        setStatus('error');
        setMessage('Erro inesperado - tente novamente mais tarde.');
      }
    };

    handleConfirmation();
  }, [appointmentId, token, statusParam, errorParam]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return timeString.slice(0, 5);
    } catch {
      return timeString;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processando confirmação...</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto confirmamos seu agendamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {/* Ícone de Status */}
          <div className="mb-6">
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            )}
            {status === 'already_confirmed' && (
              <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold mb-4">
            {status === 'success' && '✅ Agendamento Confirmado!'}
            {status === 'already_confirmed' && '✅ Já Confirmado!'}
            {status === 'error' && '❌ Erro na Confirmação'}
          </h1>

          {/* Mensagem */}
          <p className="text-lg mb-6 text-muted-foreground">
            {message}
          </p>

          {/* Detalhes do Agendamento */}
          {appointment && (status === 'success' || status === 'already_confirmed') && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Data:</span>
                </div>
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Horário:</span>
                </div>
                <span>{formatTime(appointment.appointment_time)}</span>
              </div>
            </div>
          )}

          {/* Mensagem adicional para sucesso */}
          {status === 'success' && (
            <p className="text-sm text-muted-foreground mb-6">
              Estamos ansiosos para cuidar do seu pet! 🐾
            </p>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/appointments">
                Ver Meus Agendamentos
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ConfirmAppointmentPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmAppointment />
    </Suspense>
  );
}