export type Role = "admin" | "staff";

export function login(role: Role) {
  localStorage.setItem("role", role);
}

export function logout() {
  localStorage.removeItem("role");
}

export function getRole(): Role | null {
  return localStorage.getItem("role") as Role | null;
}

export function isAdmin() {
  return getRole() === "admin";
}

export function isStaff() {
  return getRole() === "staff";
}
