"use client";

import * as React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminView from "./views/AdminView";
import FOView from "./views/FOView";
import DoctorView from "./views/DoctorView";
import NurseView from "./views/NurseView";
import PharmacyView from "./views/PharmacyView";
import PatientView from "./views/PatientView";

export default function DashboardPage() {
  const state = useCurrentUser();

  if (state.status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">Not authenticated</p>
        <p className="text-sm text-muted-foreground">
          Please log in to access the dashboard.
        </p>
      </div>
    );
  }

  const { userId, role } = state.user;

  switch (role) {
    case "admin":
      return <AdminView userId={userId} />;
    case "fo":
      return <FOView userId={userId} />;
    case "doctor_specialist":
      return <DoctorView userId={userId} />;
    case "nurse":
      return <NurseView userId={userId} />;
    case "pharmacist":
      return <PharmacyView userId={userId} />;
    case "patient":
      return <PatientView userId={userId} />;
    default:
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">Unknown role</p>
          <p className="text-sm text-muted-foreground">
            Your account role is not recognized. Please contact your
            administrator.
          </p>
        </div>
      );
  }
}
