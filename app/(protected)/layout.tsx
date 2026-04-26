import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guard";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  await requireUser();
  return <>{children}</>;
}
