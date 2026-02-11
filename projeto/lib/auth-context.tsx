"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { User } from "./types"
import { mockUsers } from "./mock-data"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback((email: string, _password: string) => {
    const found = mockUsers.find((u) => u.email === email)
    if (found) {
      setUser(found)
    } else {
      setUser({
        id: "guest",
        name: email.split("@")[0],
        email,
        role: "admin",
      })
    }
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
