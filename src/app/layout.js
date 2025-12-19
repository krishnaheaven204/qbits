import { Nunito } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["700"],
  display: "swap",
});

export const metadata = {
  title: "Qbits Energy Dashboard",
  description: "Qbits Energy Management Dashboard - Modern analytics dashboard for solar energy monitoring and management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable}`} data-pc-sidebar-theme="dark" data-pc-header-theme="light">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
