const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (_error) {
    throw new Error("Cannot connect to the server. Start the backend and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getTransactions: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ""}`);
  },
  addTransaction: (payload) => request("/transactions", { method: "POST", body: JSON.stringify(payload) }),
  getAnalytics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics${query ? `?${query}` : ""}`);
  },
  calculateLoan: (payload) => request("/loan/calculate", { method: "POST", body: JSON.stringify(payload) }),
  getNotifications: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications${query ? `?${query}` : ""}`);
  },
  getAdminOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/overview${query ? `?${query}` : ""}`);
  },
};
