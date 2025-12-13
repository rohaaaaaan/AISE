import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { UIProvider } from "@/context/UIContext";
import { ModelProvider } from "@/context/ModelContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AISE - AI Powered MBSE",
  description: "Next-gen Model Based Systems Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UIProvider>
          <ModelProvider>
            <div className={styles.layout}>
              <Sidebar />
              <div className={styles.mainContent}>
                <main className={styles.contentArea}>
                  {children}
                </main>
              </div>
            </div>
          </ModelProvider>
        </UIProvider>
      </body>
    </html>
  );
}
