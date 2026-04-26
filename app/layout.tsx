import type { Metadata } from "next";
import { AppShell } from "@/components/common/AppShell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "EKALOX",
  description: "Mobile-first marketplace web app scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
