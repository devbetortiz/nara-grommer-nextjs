import React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName, userEmail }) => (
  <div>
    <h1>Bem-vindo ao Nara Grommer, {userName}!</h1>
    <p>Seu cadastro foi realizado com sucesso com o e-mail: {userEmail}.</p>
  </div>
);
