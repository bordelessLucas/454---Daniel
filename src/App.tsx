import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import RelatoriosPage from "./pages/dashboard/RelatoriosPage";
import RelatorioNovoPage from "./pages/dashboard/RelatorioNovoPage";
import RelatorioDetalhePage from "./pages/dashboard/RelatorioDetalhePage";
import RelatorioEditarPage from "./pages/dashboard/RelatorioEditarPage";
import ClientesPage from "./pages/dashboard/ClientesPage";
import UsuariosPage from "./pages/dashboard/UsuariosPage";
import SetoresPage from "./pages/dashboard/SetoresPage";
import RamosAtividadePage from "./pages/dashboard/RamosAtividadePage";
import ChecklistsPage from "./pages/dashboard/ChecklistsPage";
import ConfiguracoesPage from "./pages/dashboard/ConfiguracoesPage";
import ActivityLogsPage from "./pages/dashboard/ActivityLogsPage";
import RelatoriosGerenciaisPage from "./pages/relatorios/RelatoriosGerenciaisPage";
import AgendaPage from "./pages/agenda/AgendaPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="relatorios" replace />} />
        <Route
          path="relatorios"
          element={
            <ProtectedRoute>
              <RelatoriosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="relatorios/novo"
          element={
            <ProtectedRoute>
              <RelatorioNovoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="relatorios/gerenciais"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <RelatoriosGerenciaisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="relatorios/:id"
          element={
            <ProtectedRoute>
              <RelatorioDetalhePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="relatorios/:id/editar"
          element={
            <ProtectedRoute>
              <RelatorioEditarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="agenda"
          element={
            <ProtectedRoute>
              <AgendaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clientes"
          element={
            <ProtectedRoute>
              <ClientesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checklists"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ChecklistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="setores"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SetoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ramos-atividade"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <RamosAtividadePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuracoes"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ConfiguracoesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
