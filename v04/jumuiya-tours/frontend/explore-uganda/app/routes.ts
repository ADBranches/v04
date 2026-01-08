import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  // ─── Home route ────────────────────────────────
  index("routes/home.tsx"),

  // ─── Auth routes ───────────────────────────────
  {
    path: "/auth",
    file: "routes/auth.tsx",
    children: [
      { path: "login", file: "routes/auth.login.tsx" },
      { path: "register", file: "routes/auth.register.tsx" },
    ],
  },

  // ─── Dashboard routes ──────────────────────────
  { path: "dashboard/admin", file: "routes/dashboard.admin.tsx" },
  { path: "dashboard/auditor", file: "routes/dashboard.auditor.tsx" },
  { path: "dashboard/guide", file: "routes/dashboard.guide.tsx" },
  { path: "dashboard/user", file: "routes/dashboard.user.tsx" },

  // ─── Destination routes ────────────────────────
  { path: "destinations", file: "routes/destinations.tsx" },
  { path: "destinations/:id", file: "routes/destinations.$id.tsx" },
  { path: "destinations/create", file: "routes/destinations.create.tsx" },
  { path: "destinations/edit/:id", file: "routes/destinations.edit.$id.tsx" },

  { path: "search", file: "routes/search.tsx" },
  
  // ─── Guide routes ──────────────────────────────
  { path: "guides", file: "routes/guides.tsx" },
  { path: "guides/profile", file: "routes/guides.profile.tsx" },
  { path: "guides/verification", file: "routes/guides.verification.tsx" },
  { path: "guides/:id", file: "routes/guides.$id.tsx" },

  // ─── Booking routes ────────────────────────────
  { path: "bookings", file: "routes/bookings.tsx" },
  { path: "bookings/create", file: "routes/bookings.create.tsx" },
  { path: "bookings/manage/:id", file: "routes/bookings.manage.$id.tsx" },

  // ─── Admin nested routes ───────────────────────
  {
    path: "/admin",
    file: "routes/admin.tsx",
    children: [
      { path: "analytics", file: "routes/admin.analytics.tsx" },
      { path: "roles", file: "routes/admin.roles.tsx" },
      { path: "users", file: "routes/admin.users.tsx" },
    ],
  },

  // ─── Auditor nested routes ─────────────────────
  {
    path: "/auditor",
    file: "routes/auditor.tsx",
    children: [
      { path: "dashboard", file: "routes/auditor.dashboard.tsx" },
      { path: "content-queue", file: "routes/auditor.content-queue.tsx" },
      { path: "guide-approvals", file: "routes/auditor.guide-approvals.tsx" },
    ],
  },

  { path: "profile", file: "routes/profile.tsx" },
  
  {
    path: "dashboard",
    file: "routes/dashboard.redirect.tsx",
  },
  // ─── Error routes ──────────────────────────────
  { path: "500", file: "routes/500.tsx" },
  
  // ─── 404 catch-all (MUST remain last) ──────────
  { path: "*", file: "routes/404.tsx" },
] satisfies RouteConfig;
