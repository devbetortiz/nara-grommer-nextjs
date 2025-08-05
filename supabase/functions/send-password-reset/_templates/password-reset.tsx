import React from 'npm:react@18.3.1';

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ userName, resetLink }) => (
  <div>
    <h1>Olá, {userName}!</h1>
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    <p>Clique no link abaixo para criar uma nova senha:</p>
    <a href={resetLink}>Redefinir Senha</a>
    <p>Se você não solicitou a redefinição de senha, por favor, ignore este e-mail.</p>
  </div>
);
