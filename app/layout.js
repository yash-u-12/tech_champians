import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalClerkProvider from "@/components/conditional-clerk-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MedSync AI",
  description: "Connect with Doctors Anytime, Anywhere",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-single.png" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <ConditionalClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main>{children}</main>
            <Toaster richColors />
          </ThemeProvider>
        </ConditionalClerkProvider>
      </body>
    </html>
  );
}
