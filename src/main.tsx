import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/index";
import { AuthProvider } from "@/lib/auth-context";
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
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
