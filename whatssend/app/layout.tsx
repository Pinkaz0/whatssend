import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsSend — CRM para WhatsApp",
  description:
    "Plataforma de marketing y CRM para WhatsApp. Envía mensajes masivos, gestiona contactos y automatiza respuestas.",
  keywords: ["WhatsApp", "CRM", "marketing", "mensajes masivos", "automatización"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F1117] text-white`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1A1D27',
              border: '1px solid #2A2F45',
              color: '#F1F5F9',
            },
          }}
        />
      </body>
    </html>
  );
}
