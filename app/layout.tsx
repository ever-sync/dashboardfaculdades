import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ToastContextWrapper } from "@/components/ui/ToastContextWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatsApp Analytics Dashboard",
  description: "Dashboard de analytics para atendimento WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          <ToastContextWrapper />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
