"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { Report } from "./types"
import { mockReports } from "./mock-data"

interface ReportsContextType {
  reports: Report[]
  addReport: (report: Report) => void
  updateReport: (report: Report) => void
  deleteReport: (id: string) => void
  getReport: (id: string) => Report | undefined
}

const ReportsContext = createContext<ReportsContextType | null>(null)

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>(mockReports)

  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev])
  }, [])

  const updateReport = useCallback((report: Report) => {
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? report : r))
    )
  }, [])

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const getReport = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  )

  return (
    <ReportsContext.Provider
      value={{ reports, addReport, updateReport, deleteReport, getReport }}
    >
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportsContext)
  if (!context) {
    throw new Error("useReports must be used within a ReportsProvider")
  }
  return context
}
