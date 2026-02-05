import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { TrackingScriptsHead, TrackingScriptsBodyStart, TrackingScriptsBodyEnd } from "@/components/tracking-scripts"
import "./globals.css";

export const dynamic = 'force-dynamic'

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: "Cockpit Comercial - Sales Enablement Platform",
  description: "Plataforma SaaS de avaliação de performance e desenvolvimento de equipes comerciais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <TrackingScriptsHead />
        </head>
        <body
          className={`${urbanist.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <TrackingScriptsBodyStart />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors />
            <TrackingScriptsBodyEnd />
          </ThemeProvider>
        </body>
      </html>
  );
}
