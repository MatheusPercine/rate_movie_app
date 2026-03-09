import api from "@/services/api";
import type {
  AuthResponse,
  AuthenticatedUser,
  LoginCredentials,
  RegisterPayload,
} from "@/types/auth";

interface ApiUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}

function mapUser(user: ApiUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function mapAuthResponse(response: ApiAuthResponse): AuthResponse {
  return {
    token: response.token,
    user: mapUser(response.user),
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<ApiAuthResponse>("/auth/register", payload);
  return mapAuthResponse(response.data);
}

export async function login(payload: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiAuthResponse>("/auth/login", payload);
  return mapAuthResponse(response.data);
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await api.get<ApiUser>("/auth/me");
  return mapUser(response.data);
}