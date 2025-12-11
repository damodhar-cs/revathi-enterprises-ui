import api from "./api";
import { LoginRequest, RegisterRequest, AuthResponse } from "../types";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Use real backend authentication
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log("Registering user with data:", userData);
    const response = await api.post<AuthResponse>("/auth/register", userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  logout() {
    localStorage.removeItem("auth_token");
  },
};
