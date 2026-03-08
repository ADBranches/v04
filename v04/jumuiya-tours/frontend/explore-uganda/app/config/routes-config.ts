// app/config/routes-config.ts

export const ROUTES = {
  // ─── Public ─────────────────────────────────────
  home: "/",

//   destinations: {
//     list: "/destinations",
//     detail: (id: number | string) => `/destinations/${id}`,
//     create: "/destinations/create",
//     edit: (id: number | string) => `/destinations/${id}/edit`,
//   },
  destinations: {
    list: "/destinations",
    detail: (id: number | string) => `/destinations/${id}`,
    create: "/destinations/create",
    edit: (id: number | string) => `/destinations/${id}/edit`,
  },

  guides: {
    list: "/guides",
    detail: (id: number | string) => `/guides/${id}`,
    verification: "/guides/verification",
    profile: "/guides/profile",
  },

  // ─── Auth ───────────────────────────────────────
  // (keeping your current /auth/* scheme)
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },

  search: "/search",

  // ─── Bookings ───────────────────────────────────
  bookings: {
    list: "/bookings",
    create: "/bookings/create",
    manage: (id: number | string) => `/bookings/manage/${id}`,
  },

  // ─── Dashboards ─────────────────────────────────
  dashboards: {
    base: "/dashboard",
    admin: "/dashboard/admin",
    guide: "/dashboard/guide",
    auditor: "/dashboard/auditor",
    user: "/dashboard/user",
  },

  // ─── Admin area ─────────────────────────────────
  admin: {
    users: "/admin/users",
    destinations: "/admin/destinations",
    approvals: "/admin/approvals",
    analytics: "/admin/analytics",
    activity: "/admin/activity",
    settings: "/admin/settings",
  },

  // ─── Auditor area (matches your layout usage) ───
  auditor: {
    dashboard: "/auditor/dashboard",
    contentQueue: "/auditor/content-queue",
    guideApprovals: "/auditor/guide-approvals",
  },

  // ─── Moderation tools (to match backend) ────────
    moderation: {
    queue: "/moderation/queue",
    pending: "/moderation/pending",
    review: (id: number | string) => `/moderation/review/${id}`,
  },

  // ─── Error pages ────────────────────────────────
  errors: {
    notFound: "/404",
  },

  // ─── Fallback ───────────────────────────────────
  notFound: "*",
} as const;