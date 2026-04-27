import type { Metadata } from "next";
import { AppShell } from "@/components/common/AppShell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "EKALOX",
  description: "Mobile-first marketplace web app scaffold",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
