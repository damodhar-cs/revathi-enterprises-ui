// User types
export interface User {
  _id?: string; // MongoDB ID (optional for Firebase users)
  uid?: string; // Firebase UID (optional for MongoDB users)
  name: string; // Changed from firstName/lastName to single name field
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string; // Changed from firstName/lastName to single name
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateUserFormData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface UpdateUserFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface OutputDto<T> {
  items: T[];
  count: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// Context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

// Variant Dimensions interface (matches backend)
export interface VariantDimensions {
  height?: number; // in mm
  width?: number; // in mm
  depth?: number; // in mm
}

// Variant Attributes interface (matches backend)
export interface VariantAttributes {
  color?: string;
  weight?: number; // in grams
  size?: string;
  ram?: number; // in GB
  storage?: number; // in GB
  os?: string;
  processor?: string;
  dimensions?: VariantDimensions;
  screen_size?: string;
  battery_life?: number; // in hours
  material?: string;
}

// Product types (Parent) - matches backend Product schema
export interface Product {
  _id?: string; // MongoDB generated ID
  uid?: string; // Contentstack UID
  title: string; // Product name/title
  brand: string;
  category: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // Mongoose timestamp
  updatedAt?: string; // Mongoose timestamp
  __v?: number;
}

// Variant types (Child) - matches backend Variant schema
export interface Variant {
  _id?: string; // MongoDB generated ID
  uid?: string; // Contentstack UID
  product_uid: string; // Reference to parent product UID
  product_name: string; // Denormalized product name
  title: string; // CMS title (random uid for CMS integration)
  description: string;
  sku: string;
  category: string;
  brand: string;
  branch: string;
  supplier?: string;
  cost_price: number;
  selling_price?: number;
  profit_margin?: number;
  quantity: number;
  warranty?: number; // in years
  image?: string;
  notes?: string;
  attributes?: VariantAttributes;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // Mongoose timestamp
  updatedAt?: string; // Mongoose timestamp
  count?: number; // Added by aggregation
  __v?: number;
}

// Variant Status Enum (matches backend)
export enum ProductStatusEnum {
  InStock = "In Stock",
  LowStock = "Low Stock",
  OutOfStock = "Out of Stock",
}

// Base Query interface (matches backend)
export interface BaseGetQuery {
  skip?: number;
  limit?: number;
  sort?: string;
  order?: number; // -1 for desc, 1 for asc
  search?: string;
}

// Products Query interface (for parent products)
export interface ProductsQueryParams extends BaseGetQuery {
  category?: string;
}

// Variants Query interface (matches backend FindAllVariantsQuery)
export interface VariantsQueryParams extends BaseGetQuery {
  category?: string;
  branch?: string;
  stockStatus?: ProductStatusEnum;
  product_uid?: string; // Changed to match backend field name
}
