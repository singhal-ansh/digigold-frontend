import axios, { AxiosError } from "axios";

// Base URL: reads from .env (VITE_API_URL) with fallback
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401, then retry once
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { fullName: string; email: string; phone: string; password: string }) =>
    api.post("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data).then((r) => r.data),
};

// ── Gold Price ────────────────────────────────────────────────
export const goldPriceApi = {
  getLivePrice: () => api.get("/gold-prices/live").then((r) => r.data),
  // Admin only
  setPrice: (data: { buyPricePerGram: number; sellPricePerGram: number; source?: string }) =>
    api.post("/gold-prices", data).then((r) => r.data),
  getPriceHistory: (page = 0, size = 20) =>
    api.get(`/gold-prices/history?page=${page}&size=${size}`).then((r) => r.data),
};

// ── Wallet ────────────────────────────────────────────────────
export const walletApi = {
  getMyWallet: () => api.get("/wallet").then((r) => r.data),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionApi = {
  initiateBuy: (data: { amountInRupees?: number; goldGrams?: number; goldPriceId: number }) =>
    api.post("/transactions/buy", data).then((r) => r.data),

  verifyPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderReference: string;
  }) => api.post("/transactions/buy/verify-payment", data).then((r) => r.data),

  sell: (data: { goldGrams: number; goldPriceId: number }) =>
    api.post("/transactions/sell", data).then((r) => r.data),

  getMyTransactions: (page = 0, size = 10) =>
    api.get(`/transactions?page=${page}&size=${size}&sort=createdAt,desc`).then((r) => r.data),

  getTransaction: (orderRef: string) =>
    api.get(`/transactions/${orderRef}`).then((r) => r.data),
};

// ── User ──────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get("/users/me").then((r) => r.data),
  updateMe: (data: { fullName?: string; phone?: string }) =>
    api.patch("/users/me", data).then((r) => r.data),
  submitKyc: (data: { panNumber: string; kycDocumentNote?: string }) =>
    api.post("/users/me/kyc", data).then((r) => r.data),
};

// ── Bank Account ──────────────────────────────────────────────
export const bankApi = {
  getMyBankAccount: () => api.get("/users/me/bank-account").then((r) => r.data),
  saveBankAccount: (data: { accountNumber: string; ifscCode: string; accountHolderName: string; bankName: string }) =>
    api.put("/users/me/bank-account", data).then((r) => r.data),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard").then((r) => r.data),
  getUsers: (search?: string, page = 0, size = 20) =>
    api.get(`/admin/users?page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ""}`).then((r) => r.data),
  updateKyc: (userId: number, status: string) =>
    api.patch(`/admin/users/${userId}/kyc`, { status }).then((r) => r.data),
  enableUser: (userId: number) =>
    api.patch(`/admin/users/${userId}/enable`).then((r) => r.data),
  disableUser: (userId: number) =>
    api.patch(`/admin/users/${userId}/disable`).then((r) => r.data),
  getAllTransactions: (page = 0, size = 20) =>
    api.get(`/admin/transactions?page=${page}&size=${size}&sort=createdAt,desc`).then((r) => r.data),
};

export default api;
