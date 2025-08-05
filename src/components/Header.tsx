"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, LogOut, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  showDashboardButton?: boolean;
  showHomeButton?: boolean;
  showSettingsButton?: boolean;
  badge?: string;
}

export const Header = ({
  title,
  subtitle,
  showBackButton = true,
  backUrl,
  showDashboardButton = true,
  showHomeButton = true,
  showSettingsButton = true,
  badge
}: HeaderProps) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const handleBackClick = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      // Volta para a página anterior no histórico
      router.back();
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-full">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                {title}
                {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </span>
          {showDashboardButton && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="rounded-full"
            >
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}
          {showHomeButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="rounded-full"
            >
              <Heart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Início</span>
            </Button>
          )}
          {showSettingsButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="rounded-full"
            >
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="rounded-full"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};