"use client";

import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import { CONTRACTS, TREASURY } from "@/lib/constants";
import "./globals.css";

import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AbstraxionProvider
          config={{
            treasury: TREASURY.lottery_treasury,
            contracts: [CONTRACTS.lottery],
          }}
        >
          {children}
        </AbstraxionProvider>
      </body>
    </html>
  );
}
