import * as React from "react";
import DashboardShell from "./_components/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <span className="text-sm text-muted-foreground">Loading…</span>
          </div>
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </React.Suspense>
  );
}
