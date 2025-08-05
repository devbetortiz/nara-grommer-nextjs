import React from 'npm:react@18.3.1';

interface AppointmentConfirmationSimpleProps {
  userName: string;
  petName: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
}

export const AppointmentConfirmationSimple: React.FC<AppointmentConfirmationSimpleProps> = ({ 
  userName, 
  petName, 
  serviceType, 
  appointmentDate, 
  appointmentTime 
}) => (
  <div>
    <h1>Olá, {userName}!</h1>
    <p>Seu agendamento para {petName} foi confirmado.</p>
    <p>Serviço: {serviceType}</p>
    <p>Data: {appointmentDate}</p>
    <p>Hora: {appointmentTime}</p>
  </div>
);
