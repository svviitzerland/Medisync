"use client";

import * as React from "react";
import { supabase, type UserRole } from "@/lib/supabase";

interface CurrentUser {
  userId: string;
  role: UserRole;
}

type State =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" };

/**
 * Resolves the current Supabase session and returns the user's id and role.
 * Reads role from `user_metadata.role` set at account creation time.
 */
export function useCurrentUser(): State {
  const [state, setState] = React.useState<State>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        setState({ status: "unauthenticated" });
        return;
      }

      const role = (session.user.user_metadata?.role ?? "patient") as UserRole;
      setState({
        status: "authenticated",
        user: { userId: session.user.id, role },
      });
    }

    resolve();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setState({ status: "unauthenticated" });
        return;
      }
      const role = (session.user.user_metadata?.role ?? "patient") as UserRole;
      setState({
        status: "authenticated",
        user: { userId: session.user.id, role },
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
