import axios from 'axios';
import { getToken, renovarToken, isTokenNearExpiry } from '@/lib/auth/auth';

// Usa variável de ambiente (pode ser definida em .env) ou cai para '/api' (proxy configurado em vite.config.ts)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  validateStatus: (status) => status < 400,
});

// Flag para evitar múltiplas renovações simultâneas
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Interceptor para adicionar o token JWT em todas as requisições
// E renovar proativamente se estiver próximo de expirar
api.interceptors.request.use(
  async (config) => {
    let token = getToken();
    
    // Verifica se o token está próximo de expirar (menos de 5 min)
    if (token && isTokenNearExpiry(token)) {
      // Evita múltiplas renovações simultâneas
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = renovarToken();
      }
      
      try {
        const renovado = await refreshPromise;
        console.log('[API] 🔄 Renovação proativa:', renovado ? 'SUCESSO' : 'FALHA');
        
        if (renovado) {
          token = getToken();
        }
      } catch (error) {
        console.error('[API] ❌ Erro na renovação proativa:', error);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Interceptor de resposta para tentar renovar token em 401 e refazer a requisição uma vez
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se for 401 e ainda não tentamos renovar, tenta uma vez
    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      console.log('[API] 🔄 Erro 401: Tentando renovar token...');
      originalRequest._retry = true;

      try {
        const renovado = await renovarToken();
        
        if (renovado) {
          const newToken = getToken();
          
          if (newToken) {
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
            console.log('[API] ✅ Token renovado, refazendo requisição');
          }
          return api.request(originalRequest);
        } else {
          console.error('[API] ❌ Renovação falhou, não vai refazer requisição');
        }
      } catch (renewError) {
        console.error('[API] ❌ Erro ao renovar token:', renewError);
        // segue para rejeição abaixo
      }
    }

    return Promise.reject(error);
  }
);