import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dayframe — A calm execution system",
  description:
    "Plan tasks, journal your days, and see your progress on a single calm surface.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            theme="light"
            richColors
            closeButton
            toastOptions={{ className: "text-sm" }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
