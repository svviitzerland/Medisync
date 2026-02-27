"use client";

import * as React from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Role = {
  label: string;
  email: string;
  password: string;
  color: string;
};

const DEV_ACCOUNTS: Role[] = [
  {
    label: "Admin",
    email: "admin@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
  {
    label: "Front Office",
    email: "fo@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
  {
    label: "Doctor",
    email: "dr.andi@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
  {
    label: "Pharmacist",
    email: "pharma@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
  {
    label: "Nurse",
    email: "nurse.ratna@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
  {
    label: "Patient",
    email: "pasien_xxx0001@medisync.local",
    password: "Password123!",
    color: "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border border-border/50",
  },
];

type DevAccountSwitcherProps = {
  onFill: (email: string, password: string) => void;
};

export function DevAccountSwitcher({ onFill }: DevAccountSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [activeRole, setActiveRole] = React.useState<string | null>(null);

  function handleSelect(role: Role) {
    onFill(role.email, role.password);
    setActiveRole(role.label);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-200",
        "border-amber-500/20 bg-amber-500/5",
        isOpen ? "shadow-md shadow-amber-500/5" : "",
      )}
    >
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <FlaskConical className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            Dev Account Switcher
          </span>
          <Badge
            variant="secondary"
            className="rounded-sm px-1.5 py-0 text-[10px] font-semibold uppercase tracking-widest ring-0"
          >
            DEV
          </Badge>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Role list */}
      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-amber-500/15 px-3 pb-3 pt-2.5">
            <p className="mb-2.5 text-[11px] text-muted-foreground">
              Click a role to auto-fill credentials
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEV_ACCOUNTS.map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleSelect(role)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition-all shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    role.color,
                    activeRole === role.label && "ring-2 ring-primary border-primary bg-primary/5",
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
