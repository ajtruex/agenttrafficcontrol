import type { Metadata } from "next";
import { jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calming Control Room",
  description: "AI Agent Traffic Control Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>{children}</body>
    </html>
  );
}
