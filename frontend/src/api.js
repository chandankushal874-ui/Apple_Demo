// API base: relative so it works both in dev (vite proxy) and prod (served by FastAPI)
const BASE = "/api";

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res.json();
}

export const api = {
  getProducts: () => req("/products"),
  checkout: (items) =>
    req("/checkout", { method: "POST", body: JSON.stringify({ items }) }),
  shipOrder: (id) => req(`/orders/${id}/ship`, { method: "POST" }),
  getAnalytics: () => req("/analytics"),
  getContracts: () => req("/contracts"),
  signContract: (company, value, status) =>
    req("/contracts", {
      method: "POST",
      body: JSON.stringify({ company, value, status }),
    }),
};
