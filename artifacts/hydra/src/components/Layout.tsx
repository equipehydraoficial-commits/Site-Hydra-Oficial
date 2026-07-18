import { Link, useLocation } from "wouter";
import { Home, Menu, Trophy, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/home", icon: Home, label: "Início" },
    { href: "/contribuir", icon: Menu, label: "Contribuir" },
    { href: "/ranking", icon: Trophy, label: "Ranking" },
    { href: "/pontos", icon: Star, label: "Pontos" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[430px] flex-col bg-background relative shadow-2xl pb-20">
      <main className="flex-1">{children}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-[430px] items-center justify-around border-t border-card-border bg-card/95 backdrop-blur-xl px-2 py-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] rounded-xl p-1",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            )}>
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[430px] flex-col bg-background relative shadow-2xl">
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[430px] flex-col bg-background relative shadow-2xl items-center justify-center p-6">
      {children}
    </div>
  );
}
