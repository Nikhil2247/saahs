"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { User } from "./data"
import { initializeDemoUsers } from "./init-auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: "student" | "admin") => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    // Initialize demo users if they don't exist
    initializeDemoUsers()

    const storedUser = localStorage.getItem("saahs_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("[v0] Failed to parse stored user:", error)
        localStorage.removeItem("saahs_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Get all users from localStorage
    const usersJson = localStorage.getItem("saahs_users") || "[]"
    const users: User[] = JSON.parse(usersJson)

    const foundUser = users.find((u) => u.email === email && u.password === password)
    if (!foundUser) {
      throw new Error("Invalid email or password")
    }

    setUser(foundUser)
    localStorage.setItem("saahs_user", JSON.stringify(foundUser))
  }

  const signup = async (email: string, password: string, name: string, role: "student" | "admin") => {
    // Get existing users
    const usersJson = localStorage.getItem("saahs_users") || "[]"
    const users: User[] = JSON.parse(usersJson)

    // Check if user already exists
    if (users.some((u) => u.email === email)) {
      throw new Error("Email already registered")
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      password, // In production, this should be hashed
      name,
      role,
      createdAt: new Date().toISOString(),
    }

    // Save user to users list
    users.push(newUser)
    localStorage.setItem("saahs_users", JSON.stringify(users))

    // Set as current user
    setUser(newUser)
    localStorage.setItem("saahs_user", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("saahs_user")
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("Not authenticated")

    const updatedUser = { ...user, ...updates }

    // Update in users list
    const usersJson = localStorage.getItem("saahs_users") || "[]"
    const users: User[] = JSON.parse(usersJson)
    const userIndex = users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = updatedUser
      localStorage.setItem("saahs_users", JSON.stringify(users))
    }

    // Update current user
    setUser(updatedUser)
    localStorage.setItem("saahs_user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
