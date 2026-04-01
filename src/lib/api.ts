const BASE_URL = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem("token");
export const setToken = (token: string) => localStorage.setItem("token", token);
export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async <T = unknown>(
  method: string,
  path: string,
  body?: object,
): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    removeToken();
    window.dispatchEvent(new Event("auth-expired"));
  }
  if (!res.ok) throw data;
  return data as T;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  role: "VIEWER" | "ANALYST" | "ADMIN";
}

export interface ManagedUser {
  id: string;
  email: string;
  username: string;
  role: "VIEWER" | "ANALYST";
  is_active: boolean;
}

export interface FinancialRecord {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RecordsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FinancialRecord[];
  success: boolean;
}

export interface DashboardData {
  summary: {
    total_income: number;
    total_expense: number;
    net_balance: number;
  };
  category_totals: Array<{
    category: string;
    type: string;
    total: number;
    count: number;
  }>;
  recent_activity: FinancialRecord[];
  monthly_trends: Array<{ month: string; income: number; expense: number }>;
  weekly_trends: Array<{
    week_starting: string;
    income: number;
    expense: number;
  }>;
  success: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authLogin = (email: string, password: string) =>
  request<{ token: string; user: User; message: string; success: boolean }>(
    "POST",
    "/api/auth/login/",
    { email, password },
  );

export const authRegister = (data: {
  email: string;
  username: string;
  password: string;
  role?: string;
}) =>
  request<{ message: string; success: boolean }>(
    "POST",
    "/api/auth/register/",
    data,
  );

// ─── Financial Records ────────────────────────────────────────────────────────

export const getRecords = (params?: Record<string, string>) => {
  const query =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
  return request<RecordsResponse>("GET", `/api/finance/records/${query}`);
};

// GET /api/finance/records/<uuid>/ — requires IsAnalyst (ANALYST or ADMIN)
export const getRecord = (id: string) =>
  request<{ record: FinancialRecord; success: boolean }>(
    "GET",
    `/api/finance/records/${id}/`,
  );

export const createRecord = (data: {
  amount: string;
  type: string;
  category: string;
  date: string;
  notes?: string;
}) =>
  request<{ record: FinancialRecord; message: string; success: boolean }>(
    "POST",
    "/api/finance/records/",
    data,
  );

export const updateRecord = (
  id: string,
  data: Partial<{
    amount: string;
    type: string;
    category: string;
    date: string;
    notes: string;
  }>,
) =>
  request<{ record: FinancialRecord; message: string; success: boolean }>(
    "PATCH",
    `/api/finance/records/${id}/`,
    data,
  );

export const deleteRecord = (id: string) =>
  request<{ message: string; success: boolean }>(
    "DELETE",
    `/api/finance/records/${id}/`,
  );

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = () =>
  request<DashboardData>("GET", "/api/dashboard/summary/");

// ─── User Management ──────────────────────────────────────────────────────────

export const getUsers = (role?: string) => {
  const query = role ? `?role=${role}` : "";
  return request<{ users: ManagedUser[]; success: boolean }>(
    "GET",
    `/api/manage/users/${query}`,
  );
};

// GET /api/manage/users/<uuid>/ — requires IsAdmin
export const getUser = (id: string) =>
  request<{ user: ManagedUser; success: boolean }>(
    "GET",
    `/api/manage/users/${id}/`,
  );

export const createUser = (data: {
  email: string;
  username: string;
  password: string;
  role: string;
  is_active?: boolean;
}) =>
  request<{ user: ManagedUser; message: string; success: boolean }>(
    "POST",
    "/api/manage/users/",
    data,
  );

export const updateUser = (
  id: string,
  data: Partial<{
    email: string;
    username: string;
    password: string;
    role: string;
    is_active: boolean;
  }>,
) =>
  request<{ user: ManagedUser; message: string; success: boolean }>(
    "PATCH",
    `/api/manage/users/${id}/`,
    data,
  );

export const deleteUser = (id: string) =>
  request<{ message: string; success: boolean }>(
    "DELETE",
    `/api/manage/users/${id}/`,
  );
