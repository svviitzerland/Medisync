"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Pill,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Medicine, Prescription, GroupedPrescription } from "@/types";

function getStockStatus(stock: number): {
  label: string;
  color: string;
} {
  if (stock > 20)
    return { label: "Available", color: "bg-emerald-500/15 text-emerald-400" };
  if (stock > 5)
    return { label: "Low Stock", color: "bg-amber-500/15 text-amber-400" };
  return { label: "Almost Empty", color: "bg-rose-500/15 text-rose-400" };
}

export default function PharmacyView({ userId: _userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [prescriptions, setPrescriptions] = React.useState<
    GroupedPrescription[]
  >([]);
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeTab || activeTab === "prescriptions") fetchPrescriptions();
    else if (activeTab === "inventory") fetchInventory();
  }, [activeTab]);

  async function fetchPrescriptions() {
    setLoading(true);
    const { data } = await supabase
      .from("prescriptions")
      .select(
        "id, quantity, notes, status, catalog_medicines(name, price), tickets(id, fo_note, doctor_note, profiles!patient_id(name, nik))",
      )
      .eq("status", "pending")
      .order("id", { ascending: true });

    const raw = (data as unknown as Prescription[]) ?? [];

    // Group by ticket id
    const map = new Map<string, GroupedPrescription>();
    for (const item of raw) {
      const tid = item.tickets?.id ?? "unknown";
      if (!map.has(tid)) {
        map.set(tid, {
          ticketId: tid,
          patientName: item.tickets?.profiles?.name ?? "Unknown",
          nik: item.tickets?.profiles?.nik ?? "—",
          foNote: item.tickets?.fo_note ?? "",
          doctorNote: item.tickets?.doctor_note ?? null,
          items: [],
        });
      }
      map.get(tid)!.items.push(item);
    }
    setPrescriptions(Array.from(map.values()));
    setLoading(false);
  }

  async function fetchInventory() {
    setLoading(true);
    const { data } = await supabase
      .from("catalog_medicines")
      .select("*")
      .order("name");
    setMedicines((data as Medicine[]) ?? []);
    setLoading(false);
  }

  async function handleComplete(group: GroupedPrescription) {
    if (!confirm("Are you sure you want to complete this prescription?")) return;

    try {
      // 1. Mark prescriptions as dispensed
      const { error: rxError } = await supabase
        .from("prescriptions")
        .update({ status: "dispensed" })
        .eq("ticket_id", group.ticketId);

      if (rxError) throw rxError;

      // 2. Mark ticket as completed
      const { error: tError } = await supabase
        .from("tickets")
        .update({ status: "completed" })
        .eq("id", group.ticketId);

      if (tError) throw tError;

      // 3. Create invoice with medicine_fee
      const medicineFee = group.items.reduce((acc, item) => {
        return acc + (item.catalog_medicines?.price ?? 0) * item.quantity;
      }, 0);

      const { error: invError } = await supabase
        .from("invoices")
        .insert({
          ticket_id: group.ticketId,
          medicine_fee: medicineFee,
          status: "unpaid"
        });

      if (invError) throw invError;

      alert("Prescription completed & invoice generated!");
      fetchPrescriptions();
    } catch (err: any) {
      console.error(err);
      alert("Failed to complete prescription: " + err.message);
    }
  }

  // ---- INVENTORY TAB ----
  if (activeTab === "inventory") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Medicine Inventory</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Full medicine catalog and stock levels
            </p>
          </div>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        {/* Stock summary */}
        {!loading && medicines.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Available",
                filter: (s: number) => s > 20,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                icon: CheckCircle2,
              },
              {
                label: "Low Stock",
                filter: (s: number) => s > 5 && s <= 20,
                color: "text-amber-400",
                bg: "bg-amber-400/10",
                icon: AlertTriangle,
              },
              {
                label: "Almost Empty",
                filter: (s: number) => s <= 5,
                color: "text-rose-400",
                bg: "bg-rose-400/10",
                icon: AlertTriangle,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-4 border rounded-xl border-border/50 bg-card"
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    item.bg,
                  )}
                >
                  <item.icon className={cn("size-4", item.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">
                    {medicines.filter((m) => item.filter(m.stock)).length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border h-14 animate-pulse rounded-xl border-border/30 bg-card"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Medicine", "Price", "Stock", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const { label, color } = getStockStatus(med.stock);
                  return (
                    <tr
                      key={med.id}
                      className="transition-colors border-b border-border/30 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium">{med.name}</td>
                      <td className="px-4 py-3">{formatCurrency(med.price)}</td>
                      <td className="px-4 py-3 font-mono">{med.stock}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            color,
                          )}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ---- PRESCRIPTION QUEUE (default) ----
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prescription Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pending prescriptions to dispense
          </p>
        </div>
        <button
          onClick={fetchPrescriptions}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 border animate-pulse rounded-xl border-border/30 bg-card"
            />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 border rounded-xl border-border/50 text-muted-foreground">
          <Pill className="size-10 opacity-30" />
          <p className="text-sm">No pending prescriptions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((group) => (
            <div
              key={group.ticketId}
              className="overflow-hidden border rounded-xl border-border/40 bg-card"
            >
              {/* Patient header */}
              <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
                <div>
                  <p className="font-semibold">{group.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    NIK: {group.nik}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Ticket</p>
                  <p className="font-mono text-xs">
                    #{group.ticketId.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Doctor note */}
                {group.doctorNote && (
                  <div className="px-3 py-2 text-sm rounded-lg bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      Doctor note:{" "}
                    </span>
                    {group.doctorNote}
                  </div>
                )}

                {/* Prescription items */}
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border border-border/30 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-center rounded-lg size-8 bg-primary/10">
                        <Pill className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {item.catalog_medicines?.name ?? "Unknown medicine"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} pcs
                          {item.notes && ` · ${item.notes}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {item.catalog_medicines &&
                          formatCurrency(
                            item.catalog_medicines.price * item.quantity,
                          )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleComplete(group)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors border rounded-lg border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Package className="size-3.5" />
                    Complete & Print Invoice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
