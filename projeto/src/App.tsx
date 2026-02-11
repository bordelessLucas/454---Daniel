import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import RelatoriosPage from "./pages/dashboard/RelatoriosPage";
import RelatorioNovoPage from "./pages/dashboard/RelatorioNovoPage";
import RelatorioDetalhePage from "./pages/dashboard/RelatorioDetalhePage";
import RelatorioEditarPage from "./pages/dashboard/RelatorioEditarPage";
import ClientesPage from "./pages/dashboard/ClientesPage";
import TecnicosPage from "./pages/dashboard/TecnicosPage";
import SetoresPage from "./pages/dashboard/SetoresPage";
import ChecklistsPage from "./pages/dashboard/ChecklistsPage";
import ConfiguracoesPage from "./pages/dashboard/ConfiguracoesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="relatorios" replace />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="relatorios/novo" element={<RelatorioNovoPage />} />
        <Route path="relatorios/:id" element={<RelatorioDetalhePage />} />
        <Route path="relatorios/:id/editar" element={<RelatorioEditarPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="tecnicos" element={<TecnicosPage />} />
        <Route path="checklists" element={<ChecklistsPage />} />
        <Route path="setores" element={<SetoresPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
