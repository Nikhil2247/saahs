import type { User } from "./data"

/**
 * Initialize demo users in localStorage if they don't exist
 */
export function initializeDemoUsers() {
  const existingUsers = localStorage.getItem("saahs_users")

  if (!existingUsers) {
    const demoUsers: User[] = [
      {
        id: "user_student_001",
        email: "student@example.com",
        password: "password123",
        name: "Ananya Bose",
        role: "student",
        rollNo: "MLT-2026-041",
        department: "Medical Laboratory Technology",
        phone: "+91 98765 43210",
        bio: "Passionate about healthcare and technology.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "user_admin_001",
        email: "admin@example.com",
        password: "password123",
        name: "Dr. Rajesh Kumar",
        role: "admin",
        phone: "+91 97654 32109",
        bio: "Administrator at SAAHS, PGIMER Chandigarh",
        createdAt: new Date().toISOString(),
      },
    ]

    localStorage.setItem("saahs_users", JSON.stringify(demoUsers))
  }
}
