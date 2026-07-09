import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/index";
import { AuthProvider } from "@/lib/auth-context";
import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { warnMisconfiguredApiUrl } from "@/lib/validate-env";
import App from "./App";
import "./globals.css";

warnMisconfiguredApiUrl();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <BrandThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BrandThemeProvider>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
