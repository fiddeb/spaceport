import { Outlet, Link } from "react-router-dom";

export function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 z-40 w-full border-b border-border/50 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span>🛸</span>
            <span>Spaceport</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Spaceport © 2384 — Take what is offered and that must sometimes be enough
      </footer>
    </div>
  );
}
