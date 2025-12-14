import api from "./api";
import {
  User,
  CreateUserFormData,
  UpdateUserFormData,
  OutputDto,
} from "../types";

export const userService = {
  async getAllUsers(): Promise<OutputDto<User>> {
    const response = await api.get<OutputDto<User>>("/users");
    return response.data;
  },

  async searchUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortField?: "name" | "email" | "createdAt";
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.role) searchParams.append("role", params.role);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.sortField) searchParams.append("sortField", params.sortField);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const response = await api.get(`/users/search?${searchParams.toString()}`);
    
    // Firebase backend returns {items: [], count: ...}
    // Frontend expects {data: [], total: ...}
    const backendData = response.data;
    
    return {
      data: backendData.items || [],
      total: backendData.count || 0,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil((backendData.count || 0) / (params.limit || 10)),
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserFormData): Promise<User> {
    const response = await api.post<User>("/users", userData);
    return response.data;
  },

  async updateUser(id: string, userData: UpdateUserFormData): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(uid: string): Promise<void> {
    await api.delete(`/users/${uid}`);
  },
};
