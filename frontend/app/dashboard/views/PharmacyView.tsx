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
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
} from "@/components/dashboard/view-layout";
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
    if (!confirm("Are you sure you want to dispense this prescription?"))
      return;

    try {
      // Mark prescriptions as dispensed
      const { error: rxError } = await supabase
        .from("prescriptions")
        .update({ status: "dispensed" })
        .eq("ticket_id", group.ticketId);

      if (rxError) throw rxError;

      // The invoice and ticket completion are already handled by the backend
      // when the doctor called complete-checkup. We just need to update
      // the existing invoice medicine fee if needed.
      const medicineFee = group.items.reduce((acc, item) => {
        return acc + (item.catalog_medicines?.price ?? 0) * item.quantity;
      }, 0);

      // Update existing invoice with medicine_fee (created by backend)
      const { error: invError } = await supabase
        .from("invoices")
        .update({ medicine_fee: medicineFee })
        .eq("ticket_id", group.ticketId);

      if (invError) console.warn("Could not update invoice:", invError.message);

      alert("Prescription dispensed successfully!");
      fetchPrescriptions();
    } catch (err: any) {
      console.error(err);
      alert("Failed to dispense prescription: " + err.message);
    }
  }

  // ---- INVENTORY TAB ----
  if (activeTab === "inventory") {
    return (
      <ViewLayout>
        <ViewMain>
          <ViewHeader
            title="Medicine Inventory"
            description="Full medicine catalog and stock levels"
          >
            <button
              onClick={fetchInventory}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
          </ViewHeader>

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
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-xl font-bold">
                      {medicines.filter((m) => item.filter(m.stock)).length}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <ViewContentCard>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border h-14 animate-pulse rounded-xl border-border/30 bg-muted/20"
                  />
                ))}
              </div>
            </ViewContentCard>
          ) : (
            <ViewContentCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Medicine", "Price", "Stock", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left uppercase text-muted-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {medicines.map((med) => {
                      const { label, color } = getStockStatus(med.stock);
                      return (
                        <tr
                          key={med.id}
                          className="transition-colors hover:bg-muted/10 group"
                        >
                          <td className="px-4 py-3.5 font-medium group-hover:text-primary transition-colors">
                            {med.name}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground font-medium">
                            {formatCurrency(med.price)}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-medium">
                            {med.stock}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
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
            </ViewContentCard>
          )}
        </ViewMain>
      </ViewLayout>
    );
  }

  // ---- PRESCRIPTION QUEUE (default) ----
  return (
    <ViewLayout>
      <ViewMain className="max-w-4xl">
        <ViewHeader
          title="Prescription Queue"
          description="Pending prescriptions to dispense"
        >
          <button
            onClick={fetchPrescriptions}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </button>
        </ViewHeader>

        <ViewContentCard>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 border animate-pulse rounded-2xl border-border/30 bg-muted/20"
                />
              ))}
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed rounded-2xl border-border/50 bg-muted/5 text-muted-foreground">
              <div className="flex items-center justify-center rounded-full size-16 bg-muted/50">
                <Pill className="size-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">No pending prescriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((group) => (
                <div
                  key={group.ticketId}
                  className="overflow-hidden border rounded-2xl border-border/40 bg-card hover:border-primary/20 transition-colors shadow-sm hover:shadow-md"
                >
                  {/* Patient header */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 shrink-0">
                      <Package className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{group.patientName}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        NIK: {group.nik}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Ticket ID
                      </p>
                      <p className="font-mono text-xs font-medium bg-muted/50 px-2 py-1 rounded-md">
                        {group.ticketId.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Doctor note */}
                    {group.doctorNote && (
                      <div className="p-4 text-sm rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                          Doctor Note
                        </p>
                        <p className="text-foreground/90 leading-relaxed font-medium">
                          {group.doctorNote}
                        </p>
                      </div>
                    )}

                    {/* FO Note Context */}
                    {group.foNote && (
                      <div className="p-4 text-sm rounded-xl bg-muted/30 border border-border/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Patient Complaint (FO Note)
                        </p>
                        <p className="text-muted-foreground leading-relaxed text-xs">
                          {group.foNote}
                        </p>
                      </div>
                    )}

                    {/* Prescription items */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 mt-4">
                        Prescribed Medicines ({group.items.length})
                      </p>
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-xl border border-border/40 bg-background px-4 py-3 shadow-inner"
                        >
                          <div className="flex items-center justify-center rounded-lg size-10 bg-muted/50 shrink-0 border border-border/50">
                            <Pill className="size-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                              {item.catalog_medicines?.name ??
                                "Unknown medicine"}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                              <span className="text-foreground bg-muted px-1.5 py-0.5 rounded mr-1.5">
                                {item.quantity} pcs
                              </span>
                              {item.notes && (
                                <span className="italic">{item.notes}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-primary">
                              {item.catalog_medicines &&
                                formatCurrency(
                                  item.catalog_medicines.price * item.quantity,
                                )}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              Subtotal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/40 mt-4">
                      <button
                        onClick={() => handleComplete(group)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-[0.98]"
                      >
                        <CheckCircle2 className="size-4" />
                        Complete & Print Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ViewContentCard>
      </ViewMain>
    </ViewLayout>
  );
}
