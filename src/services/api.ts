import axios from "axios";
import {
  Variant,
  Product,
  ProductsQueryParams,
  VariantsQueryParams,
} from "../types";

// Use backend URL from environment variable (production) or proxy path (development)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Variants API functions
export const variantsApi = {
  // Search all variants with filters in body
  getAllVariants: async (filters?: VariantsQueryParams): Promise<Variant[]> => {
    const response = await api.post("/variants/search", {
      ...filters,
      limit: filters?.limit || 10000, // Default large limit if not specified
    });
    // Backend returns OutputDto with { count, items }
    return response.data.items || response.data.data || response.data;
  },

  // Create a new variant
  createVariant: async (
    variantData: Omit<
      Variant,
      "_id" | "createdAt" | "updatedAt" | "__v" | "count"
    >
  ): Promise<Variant> => {
    const response = await api.post("/variants", variantData);
    return response.data;
  },

  // Update an existing variant (using uid)
  updateVariant: async (
    uid: string,
    variantData: Partial<
      Omit<Variant, "_id" | "uid" | "createdAt" | "updatedAt" | "__v" | "count">
    >
  ): Promise<Variant> => {
    const response = await api.put(`/variants/${uid}`, variantData);
    return response.data;
  },

  // Delete a variant (using uid)
  deleteVariant: async (uid: string): Promise<void> => {
    await api.delete(`/variants/${uid}`);
  },

  // Get a single variant by uid
  getVariant: async (uid: string): Promise<Variant> => {
    const response = await api.get(`/variants/${uid}`);
    return response.data;
  },
};

// Sales API functions
export const salesApi = {
  // Create a sale
  createSale: async (saleData: {
    variantId: string;
    sellingPrice: number;
    customer: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    paymentMethod?: string;
    notes?: string;
    soldBy?: string;
  }) => {
    const response = await api.post("/sales", saleData);
    return response.data;
  },

  // Search sales with filters in body
  getAllSales: async (filters?: {
    search?: string;
    branch?: string;
    brand?: string;
    created_at?: string; // JSON stringified object
  }) => {
    const response = await api.post("/sales/search", filters || {});
    // Return full response with both items and count
    return response.data;
  },

  // Get sales statistics with filters in body
  getSalesStatistics: async (filters?: {
    search?: string;
    branch?: string;
    brand?: string;
    created_at?: string; // JSON stringified object
  }) => {
    const response = await api.post("/sales/stats", filters || {});
    return response.data;
  },

  // Get sale by ID
  getSale: async (id: string) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Export sales to Excel and send via email
  exportSales: async (exportData: {
    recipientEmail: string;
    search?: string;
    branch?: string;
    brand?: string;
    created_at?: string; // JSON stringified object
  }) => {
    const response = await api.post("/sales/export", exportData);
    return response.data;
  },

};

// Products API functions (Parent products)
export const productsApi = {
  // Search all products with filters in body
  getAllProducts: async (filters?: ProductsQueryParams): Promise<Product[]> => {
    const response = await api.post("/products/search", filters || {});
    return response.data.items || response.data.data || response.data;
  },

  // Create a new product
  createProduct: async (
    productData: Omit<Product, "_id" | "createdAt" | "updatedAt" | "__v">
  ): Promise<Product> => {
    const response = await api.post("/products", productData);
    return response.data;
  },

  // Update an existing product (using uid)
  updateProduct: async (
    uid: string,
    productData: Partial<
      Omit<Product, "_id" | "uid" | "createdAt" | "updatedAt" | "__v">
    >
  ): Promise<Product> => {
    const response = await api.put(`/products/${uid}`, productData);
    return response.data;
  },

  // Delete a product (using uid)
  deleteProduct: async (uid: string): Promise<void> => {
    await api.delete(`/products/${uid}`);
  },

  // Get a single product by uid
  getProduct: async (uid: string): Promise<Product> => {
    const response = await api.get(`/products/${uid}`);
    return response.data;
  },
};

// Dashboard API functions
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};

// Customers API functions
export const customersApi = {
  // Get all customers with optional search
  getAllCustomers: async (search?: string) => {
    const response = await api.get("/customers", {
      params: { search },
    });
    return response.data;
  },

  // Get customer by phone number
  getCustomerByPhone: async (phone: string) => {
    const response = await api.get(`/customers/${phone}`);
    return response.data;
  },

  // Get customer sales history
  getCustomerSales: async (phone: string) => {
    const response = await api.get(`/customers/${phone}/sales`);
    return response.data;
  },
};

// Enhanced Sales API functions (add to existing salesApi if needed)
export const receiptApi = {
  // Download PDF receipt
  downloadReceipt: async (saleId: string): Promise<Blob> => {
    const response = await api.get(`/sales/${saleId}/receipt`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Email receipt to customer
  emailReceipt: async (saleId: string, recipientEmail: string) => {
    const response = await api.post(`/sales/${saleId}/receipt/email`, {
      recipientEmail,
    });
    return response.data;
  },
};

export default api;
