-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para enviar lembretes de agendamento diariamente às 8h
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 8 * * *', -- Todos os dias às 8h da manhã
  $$
  SELECT
    net.http_post(
        url:='https://dsmtvpcdifooagtjqjve.supabase.co/functions/v1/send-appointment-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbXR2cGNkaWZvb2FndGpxanZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDcwMTUsImV4cCI6MjA2OTQ4MzAxNX0.iOKyHrmbFOHGMTBPAFl385Csex40LKR8BKaRUp7WtC0"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);