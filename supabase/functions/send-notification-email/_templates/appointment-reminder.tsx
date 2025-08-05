import React from 'npm:react@18.3.1';

interface AppointmentReminderProps {
  userName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({ 
  userName, 
  petName, 
  appointmentDate, 
  appointmentTime 
}) => (
  <div>
    <h1>Lembrete de Agendamento</h1>
    <p>Olá, {userName}.</p>
    <p>Este é um lembrete de que você tem um agendamento para {petName} amanhã, dia {appointmentDate} às {appointmentTime}.</p>
  </div>
);
