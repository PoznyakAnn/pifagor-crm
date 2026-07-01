export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export const CRM_URL =
  import.meta.env.VITE_CRM_URL?.replace(/\/$/, "") || "http://localhost:8000";
