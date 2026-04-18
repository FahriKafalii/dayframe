import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { I18nProvider } from "@/lib/i18n-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dayframe — A calm execution system",
  description:
    "Plan tasks, journal your days, and see your progress on a single calm surface.",
};

const prePaintScript = `
(function () {
  try {
    var d = document.documentElement;
    var theme = localStorage.getItem("dayframe.theme") || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    d.setAttribute("data-theme", resolved);
    d.style.colorScheme = resolved;
    var locale = localStorage.getItem("dayframe.locale");
    if (locale !== "en" && locale !== "tr") {
      var nav = (navigator.language || "").toLowerCase();
      locale = nav.indexOf("tr") === 0 ? "tr" : "en";
    }
    d.setAttribute("lang", locale);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: prePaintScript }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                theme="system"
                richColors
                closeButton
                toastOptions={{ className: "text-sm" }}
              />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
