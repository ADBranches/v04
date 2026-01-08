Here’s the **same feature-rich roadmap**, but this time **every phase = concrete files + paths**, and frontend is **only** `frontend/explore-uganda`.

We’ll mark files as:

* **(update)** = already exists, we extend/modify it
* **(new)** = create this file

---

## Phase 1 – Premium Traveler Experience (Week 1–2)

**Goals:** advanced destination discovery, rich destination pages, clean booking flow, first proper tests.

### Backend (Node/Express/Prisma)

**Data & models**

* **(update)** `backend/prisma/schema.prisma`

  * Extend `Destination` with fields like `region`, `difficulty`, `tags`, `durationDays`, `minPrice`, `maxPrice`, `bestSeason`, `featured`, etc.
  * Optionally add simple analytics fields like `viewCount`, `bookingCount`.

* **(new)** `backend/prisma/migrations/20xx..._destination_enhancements/migration.sql`

  * Prisma migration generated from the schema changes.

**Controllers / routes**

* **(update)** `backend/controllers/destination-controller.js`

  * Add logic for search, filters, “similar destinations”, featured.

* **(update)** `backend/routes/destinations.js`

  * Ensure routes like:

    * `GET /api/destinations`
    * `GET /api/destinations/search`
    * `GET /api/destinations/:id`
    * Optional: `GET /api/destinations/:id/similar`

* **(update)** `backend/controllers/booking-controller.js`

  * Add validation: dates, min people, prevent crazy double-booking.

* **(update)** `backend/routes/bookings.js`

  * Make sure `POST /api/bookings` supports the nicer booking payload from frontend.

**Docs / health**

* **(new)** `backend/routes/docs.js`
* **(update)** `backend/server.js`

  * Mount a simple OpenAPI/Swagger UI route like `/api/docs` (even a stub), and ensure existing `/api/health` is clearly exposed.

**Tests**

* **(update)** `backend/jest.config.cjs`

  * Make sure new test files in `backend/tests/` are picked up.

* **(new)** `backend/tests/destinations.search.test.js`

  * Jest/Supertest tests for `GET /api/destinations`, `GET /api/destinations/search`, `GET /api/destinations/:id`.

* **(new)** `backend/tests/bookings.basic.test.js`

  * Tests for `POST /api/bookings` happy path + simple validation errors.

---

### Frontend – `frontend/explore-uganda` (React Router)

**API services**

* **(update)** `frontend/explore-uganda/app/services/destination-service.ts`

  * Add functions:

    * `listDestinations(filters)`
    * `searchDestinations(query, filters)`
    * `getDestination(id)`
    * `getSimilarDestinations(id)`

* **(update)** `frontend/explore-uganda/app/services/booking.service.ts`

  * Ensure an API like `createBooking(payload)` matches the backend `POST /api/bookings`.

**Pages / routes**

* **(update)** `frontend/explore-uganda/app/routes/destinations.tsx`

  * Wire hero filters to URL query params + `destination-service.ts`.

* **(update)** `frontend/explore-uganda/app/routes/destinations.search.tsx`

  * Dedicated search results view using filters + search term.

* **(update)** `frontend/explore-uganda/app/routes/destinations.$id.tsx`

  * Rich destination detail page: gallery, highlights, similar destinations section.

* **(update)** `frontend/explore-uganda/app/routes/bookings.create.tsx`

  * Booking form + validation, calls `createBooking`.

* **(update)** `frontend/explore-uganda/app/components/destinations/destination-card.tsx`

* **(update)** `frontend/explore-uganda/app/components/destinations/destination-filter.tsx`

  * Ensure they use the new filters/props (region, difficulty, price range, etc.).

**Tests infra & basic tests**

* **(new)** `frontend/explore-uganda/vitest.config.ts`

  * Vitest config (can reuse Vite aliases).

* **(update)** `frontend/explore-uganda/package.json`

  * Add `vitest` + `@testing-library/react` + script:

    * `"test": "vitest --run"`.

* **(new)** `frontend/explore-uganda/app/__tests__/destinations.search.test.tsx`

  * Test that search page renders, calls API, shows results/empty state.

* **(new)** `frontend/explore-uganda/app/__tests__/booking-form.test.tsx`

  * Test field validation + successful submit (mock API).

---

## Phase 2 – Guide & Auditor Portals v2 (Week 3–4)

**Goals:** solid Guide + Auditor experiences with full RBAC from DB → API → UI.

### Backend

**RBAC & permissions**

* **(update)** `backend/config/permissions-config.js`

  * Ensure granular permissions for GUIDES, AUDITORS, ADMINS on new routes.

* **(update)** `backend/middleware/role-middleware.js`

* **(update)** `backend/middleware/permission-middleware.js`

  * Improve checks so new endpoints use the config consistently.

**Guide endpoints**

* **(update)** `backend/controllers/guide-controller.js`

  * Add handlers:

    * `getMyDestinations`
    * `createDestination`
    * `updateDestination`
    * `submitDestinationForReview`
    * `getMyBookings`

* **(update)** `backend/routes/guides.js`

  * Add routes like:

    * `GET /api/guides/me/destinations`
    * `POST /api/guides/me/destinations`
    * `PUT /api/guides/me/destinations/:id`
    * `POST /api/guides/me/destinations/:id/submit`
    * `GET /api/guides/me/bookings`

**Auditor endpoints**

* **(update)** `backend/controllers/moderation-controller.js`

  * Add unified queue + moderation actions.

* **(update)** `backend/routes/moderation.js`

  * Routes like:

    * `GET /api/moderation/queue`
    * `POST /api/moderation/destinations/:id/approve`
    * `POST /api/moderation/destinations/:id/reject`
    * `POST /api/moderation/destinations/:id/request-revision`

**Audit logs**

* **(update)** `backend/middleware/audit.js`

  * Log moderation actions (approve/reject/revision) and guide actions (submit for review).

**Tests**

* **(new)** `backend/tests/guides.portal.test.js`

  * Test guide flows (CRUD + submit).

* **(new)** `backend/tests/moderation.queue.test.js`

  * Test auditor queue + actions.

* **(new)** `backend/tests/rbac.matrix.test.js`

  * Consolidate RBAC checks per role; formalise what `test-real-endpoints.js` already explores.

---

### Frontend – `frontend/explore-uganda`

**Services**

* **(update)** `frontend/explore-uganda/app/services/guide.service.ts`

  * Functions:

    * `getMyDestinations`, `createDestination`, `updateDestination`, `submitDestination`, `getMyBookings`.

* **(update)** `frontend/explore-uganda/app/services/moderation.service.ts`

  * Functions:

    * `getModerationQueue`, `approveDestination`, `rejectDestination`, `requestRevision`.

**Guide UI**

* **(update)** `frontend/explore-uganda/app/routes/dashboard.guide.tsx`

  * Cards for “My destinations”, “Upcoming tours”, statuses.

* **(update)** `frontend/explore-uganda/app/routes/destinations.create.tsx`

* **(update)** `frontend/explore-uganda/app/routes/destinations.edit.$id.tsx`

  * Use guide APIs to create/edit/submit.

* **(update)** `frontend/explore-uganda/app/components/destinations/destination-form.tsx`

  * Support status info, submit for review button, validation.

**Auditor UI**

* **(update)** `frontend/explore-uganda/app/routes/dashboard.auditor.tsx`

  * High-level stats + quick links to queues.

* **(update)** `frontend/explore-uganda/app/routes/auditor.content-queue.tsx`

  * Unified moderation list (destinations & guide verifications).

* **(update)** `frontend/explore-uganda/app/routes/auditor.guide-approvals.tsx`

* **(update)** `frontend/explore-uganda/app/components/auditor/moderation-queue.tsx`

  * Table + approve / reject / request revision actions.

**RBAC at navigation layer**

* **(update)** `frontend/explore-uganda/app/config/permissions-config.js`

  * Mirror backend permissions for menu visibility.

* **(update)** `frontend/explore-uganda/app/components/layout/navbar.tsx`

* **(update)** `frontend/explore-uganda/app/components/layout/sidebar.tsx`

* **(update)** `frontend/explore-uganda/app/components/navigation/protected-route.tsx`

  * Conditionals per role; redirect unauthorised users.

**Tests**

* **(new)** `frontend/explore-uganda/app/__tests__/guide-dashboard.test.tsx`
* **(new)** `frontend/explore-uganda/app/__tests__/auditor-queue.test.tsx`

  * Assert correct data rendering + actions call expected services.
* **(new)** `frontend/explore-uganda/app/__tests__/navigation-rbac.test.tsx`

  * Different roles → different visible links/routes.

---

## Phase 3 – Payments, Reviews & Notifications (Week 5–6)

**Goals:** bookings with payments, reviews & ratings, notification system.

### Backend

**Schema**

* **(update)** `backend/prisma/schema.prisma`

  * `Booking`: add `currency`, `totalAmount`, `paymentStatus`, `paymentReference`.
  * `Review`: ensure fields: `id`, `bookingId`, `destinationId`, `guideId`, `userId`, `rating`, `comment`.
  * `Notification`: `userId`, `type`, `payload`, `channel`, `status`, `createdAt`.

* **(new)** `backend/prisma/migrations/20xx..._payments_reviews_notifications/migration.sql`

**Payment APIs**

* **(new)** `backend/controllers/payment-controller.js`

* **(new)** `backend/routes/payments.js`

  * Routes:

    * `POST /api/payments/checkout` (create payment session)
    * `POST /api/payments/webhook` (PSP callback / mock)

* **(update)** `backend/controllers/booking-controller.js`

  * Handle payment status transitions (e.g. `pending` → `paid`).

* **(update)** `backend/routes/bookings.js`

  * Optional: `GET /api/bookings/:id` with payment & review status.

**Reviews APIs**

* **(new)** `backend/controllers/review-controller.js`
* **(new)** `backend/routes/reviews.js`

  * `POST /api/reviews`
  * `GET /api/destinations/:id/reviews`
  * `GET /api/guides/:id/reviews`

**Notifications**

* **(new)** `backend/services/notification-service.js`

  * Logic to create/send email notifications (or log them in dev).

* **(update)** `backend/middleware/audit.js`

  * Trigger notification service on booking & moderation events where relevant.

**Tests**

* **(new)** `backend/tests/payments.flow.test.js`
* **(new)** `backend/tests/reviews.permissions.test.js`
* **(new)** `backend/tests/notifications.events.test.js`

---

### Frontend – `frontend/explore-uganda`

**Services**

* **(new)** `frontend/explore-uganda/app/services/payment.service.ts`

  * `createCheckoutSession`, handle status.

* **(update)** `frontend/explore-uganda/app/services/booking.service.ts`

  * Add `getBooking(id)` and integrate payment reference.

* **(new)** `frontend/explore-uganda/app/services/review.service.ts`

  * `submitReview`, `getDestinationReviews`, `getGuideReviews`.

* **(new)** `frontend/explore-uganda/app/services/notification.service.ts`

  * Fetch user notifications list.

**UI – payments**

* **(update)** `frontend/explore-uganda/app/routes/bookings.create.tsx`

  * Add payment step (call `payment.service.ts`).

* **(new)** `frontend/explore-uganda/app/routes/bookings.confirmation.$id.tsx`

  * Show booking receipt & status.

**UI – reviews**

* **(update)** `frontend/explore-uganda/app/routes/destinations.$id.tsx`

  * Show average rating + reviews section.

* **(update)** `frontend/explore-uganda/app/routes/guide.profile.tsx`

  * Show guide rating + reviews.

* **(new)** `frontend/explore-uganda/app/components/reviews/review-form.tsx`

* **(new)** `frontend/explore-uganda/app/components/reviews/review-list.tsx`

**UI – notifications**

* **(update)** `frontend/explore-uganda/app/components/layout/navbar.tsx`

  * Add notification bell.

* **(new)** `frontend/explore-uganda/app/components/ui/notification-center.tsx`

* **(new)** `frontend/explore-uganda/app/routes/notifications.tsx`

  * Simple “My notifications” list page.

**Tests**

* **(new)** `frontend/explore-uganda/app/__tests__/payments-flow.test.tsx`
* **(new)** `frontend/explore-uganda/app/__tests__/reviews-flow.test.tsx`
* **(new)** `frontend/explore-uganda/app/__tests__/notifications-center.test.tsx`

---

## Phase 4 – Intelligence, Analytics & Scale (Week 7–8)

**Goals:** recommendations, analytics dashboards, performance & polish, ready for pilots.

### Backend

**Analytics**

* **(update)** `backend/controllers/admin-controller.js`

  * Add analytics handlers: bookings per region, revenue, active users, top destinations.

* **(update)** `backend/routes/admin.js`

  * `GET /api/admin/analytics/summary`
  * `GET /api/admin/analytics/destinations`
  * `GET /api/admin/analytics/guides`

**Recommendations**

* **(new)** `backend/services/recommendation-service.js`

  * Simple logic based on region, tags, popularity.

* **(update)** `backend/controllers/destination-controller.js`

  * Use recommendation service for “similar” and “recommended” endpoints.

**Caching / performance**

* **(new)** `backend/apps/shared/cache.js` *(if you don’t already have one)*

  * Simple TTL cache wrapper.

* **(update)** `backend/server.js`

  * Plug cache into `GET /api/destinations`, `/api/destinations/:id`, analytics endpoints.

**Tests**

* **(new)** `backend/tests/analytics.summary.test.js`
* **(new)** `backend/tests/recommendations.test.js`

---

### Frontend – `frontend/explore-uganda`

**Services**

* **(update)** `frontend/explore-uganda/app/services/dashboard.service.ts`

  * Fetch admin & guide analytics.

* **(update)** `frontend/explore-uganda/app/services/destination-service.ts`

  * Add `getRecommendedDestinations()`.

**UI – analytics**

* **(update)** `frontend/explore-uganda/app/routes/dashboard.admin.tsx`

  * Use charts for key metrics.

* **(update)** `frontend/explore-uganda/app/routes/admin.analytics.tsx`

  * Filters by date range, region, etc.

* **(update)** `frontend/explore-uganda/app/routes/dashboard.guide.tsx`

  * Show “My performance” cards.

* **(new)** `frontend/explore-uganda/app/components/admin/analytics-overview.tsx`

* **(new)** `frontend/explore-uganda/app/components/admin/analytics-chart.tsx`

**UI – recommendations**

* **(update)** `frontend/explore-uganda/app/routes/_index.tsx`

  * Home page: “Recommended for you” + “Popular now in Uganda”.

* **(update)** `frontend/explore-uganda/app/routes/destinations.$id.tsx`

  * Use recommended list instead of static cards.

**Polish / performance**

* **(update)** `frontend/explore-uganda/app/components/ui/loader.tsx`

* **(update)** `frontend/explore-uganda/app/components/ui/empty-state.tsx`

* **(update)** `frontend/explore-uganda/app/components/ui/error-banner.tsx`

  * Better skeletons, error states.

* **(update)** `frontend/explore-uganda/app/app.css`

  * Global tweaks for animations/UX.

**Tests**

* **(new)** `frontend/explore-uganda/app/__tests__/admin-analytics.test.tsx`
* **(new)** `frontend/explore-uganda/app/__tests__/home-recommendations.test.tsx`

---
