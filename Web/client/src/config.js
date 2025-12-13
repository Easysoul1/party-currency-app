export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const ACCESS_TOKEN_DURATION = 14;

export const googleAuthUrl = `${BASE_URL}/auth/google/login`;

export const DENOMINATION_CHOICES = [
  {
    value: 100,
    label: "100",
  },
  {
    value: 200,
    label: "200",
  },
  {
    value: 500,
    label: "500",
  },
  {
    value: 1000,
    label: "1000",
  },
];
