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
    email: "admin@medisync.id",
    password: "admin123",
    color:
      "bg-rose-500/10 text-rose-400 ring-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300",
  },
  {
    label: "Front Office",
    email: "fo@medisync.id",
    password: "fo123",
    color:
      "bg-violet-500/10 text-violet-400 ring-violet-500/20 hover:bg-violet-500/20 hover:text-violet-300",
  },
  {
    label: "Doctor",
    email: "doctor@medisync.id",
    password: "doctor123",
    color:
      "bg-sky-500/10 text-sky-400 ring-sky-500/20 hover:bg-sky-500/20 hover:text-sky-300",
  },
  {
    label: "Pharmacist",
    email: "pharmacist@medisync.id",
    password: "pharmacist123",
    color:
      "bg-amber-500/10 text-amber-400 ring-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300",
  },
  {
    label: "Nurse",
    email: "nurse@medisync.id",
    password: "nurse123",
    color:
      "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300",
  },
  {
    label: "Patient",
    email: "patient@medisync.id",
    password: "patient123",
    color:
      "bg-teal-500/10 text-teal-400 ring-teal-500/20 hover:bg-teal-500/20 hover:text-teal-300",
  },
];

type DevAccountSwitcherProps = {
  onFill: (email: string, password: string) => void;
};

export function DevAccountSwitcher({ onFill }: DevAccountSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
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
          <FlaskConical className="size-3.5 text-amber-400" />
          <span className="text-xs font-medium text-amber-300/90">
            Dev Account Switcher
          </span>
          <Badge
            variant="secondary"
            className="rounded-sm bg-amber-500/15 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-widest text-amber-400 ring-0"
          >
            DEV
          </Badge>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-amber-400/70 transition-transform duration-200",
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
            <p className="mb-2.5 text-[11px] text-amber-400/60">
              Click a role to auto-fill credentials
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEV_ACCOUNTS.map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleSelect(role)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-xs font-medium ring-1 transition-all",
                    "focus:outline-none",
                    role.color,
                    activeRole === role.label && "ring-2",
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {activeRole && (
              <div className="mt-2.5 rounded-lg bg-amber-500/8 px-2.5 py-1.5 text-[11px] text-amber-300/70">
                <span className="font-medium text-amber-300/90">
                  {activeRole}
                </span>{" "}
                credentials filled in
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
