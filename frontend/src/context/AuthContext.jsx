import { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const userId = localStorage.getItem("user_id");
    return token ? { token, role, name, userId } : null;
  });

  async function login(email, password, role) {
    const res = await api.post("/api/auth/login", { email, password, role });
    const { access_token, role: returnedRole, name, user_id } = res.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("role", returnedRole);
    localStorage.setItem("name", name);
    localStorage.setItem("user_id", user_id);

    setUser({ token: access_token, role: returnedRole, name, userId: user_id });
    return returnedRole;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
