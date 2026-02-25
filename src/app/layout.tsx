import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { CallawAIChat } from "@/components/callawai-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "Callaway Sales Planning",
  description: "Dynamic Sales Planning & Forecasting Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CallawAIChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
