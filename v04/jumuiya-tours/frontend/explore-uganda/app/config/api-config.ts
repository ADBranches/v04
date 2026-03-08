// app/config/api-config.ts

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    me: "/api/auth/me",
  },

  destinations: {
    base: "/api/destinations",
    list: "/api/destinations",
    search: "/api/destinations",
    detail: (id: number | string) => `/api/destinations/${id}`,
    create: "/api/destinations",
    update: (id: number | string) => `/api/destinations/${id}`,
    submitForReview: (id: number | string) => `/api/destinations/${id}/submit`,
  },

  bookings: {
    base: "/api/bookings",
    list: "/api/bookings",
    create: "/api/bookings",
    detail: (id: number | string) => `/api/bookings/${id}`,
    cancel: (id: number | string) => `/api/bookings/${id}/cancel`,
  },

  guides: {
    base: "/api/guides",
    list: "/api/guides",
    detail: (id: number | string) => `/api/guides/${id}`,
    verify: "/api/guides/verify",
  },

  moderation: {
    base: "/api/moderation",
    queue: "/api/moderation/queue",
    pending: "/api/moderation/pending",
    review: (id: number | string) => `/api/moderation/review/${id}`,
  },

  admin: {
    base: "/api/admin",
    users: "/api/admin/users",
    destinations: "/api/admin/destinations",
    approvals: "/api/admin/approvals",
    analytics: "/api/admin/analytics",
    activity: "/api/admin/activity",
    settings: "/api/admin/settings",
  },
} as const;