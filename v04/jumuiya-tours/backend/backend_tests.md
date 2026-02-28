 *poking* the RBAC 😈

Your Phase 4 plan is basically correct, it just needs **one important adjustment** for your app:

* Your API lives at **`/api`**, so all paths must be `/api/moderation/...`, not just `/moderation/...`.

I’ll rewrite the whole Phase 4 guide **correctly for your project** (localhost:5000 + `/api`).

---

## Setup once in this shell

From `backend/`:

```bash
export BASE_URL="http://localhost:5000/api"

# These should already exist from generate-test-tokens/get-tokens
export ADMIN_TOKEN="...paste..."
export AUDITOR_TOKEN="...paste..."
export GUIDE_TOKEN="...paste..."
export USER_TOKEN="...paste..."
```

All curls below assume that.

---

## 1️⃣ Queue – requires `view_moderation_queue`

### Admin

```bash
curl -i "$BASE_URL/moderation/queue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Auditor

```bash
curl -i "$BASE_URL/moderation/queue" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
```

### Guide

```bash
curl -i "$BASE_URL/moderation/queue" \
  -H "Authorization: Bearer $GUIDE_TOKEN"
```

### User

```bash
curl -i "$BASE_URL/moderation/queue" \
  -H "Authorization: Bearer $USER_TOKEN"
```

✅ **Expectations**

* **Admin / Auditor** → `200` + JSON list (whatever shape your controller returns).
* **Guide / User** → `403` with JSON containing:

  ```json
  {
    "success": false,
    "code": "INSUFFICIENT_PERMISSIONS",
    ...
  }
  ```

(Exact wording of `error` is up to your middleware, but the `code` should be that.)

---

## 2️⃣ Approve / reject – need `approve_content` / `approve_destinations` etc.

First, get a **pending moderation id**:

```bash
curl -s "$BASE_URL/moderation/pending" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
```

Pick an `id` from the response, e.g. `123`, and then:

```bash
export MOD_ID="123"
```

### Auditor approves

```bash
curl -i -X POST "$BASE_URL/moderation/$MOD_ID/approve" \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Guide tries to approve (should fail)

```bash
curl -i -X POST "$BASE_URL/moderation/$MOD_ID/approve" \
  -H "Authorization: Bearer $GUIDE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Same idea for reject

```bash
curl -i -X POST "$BASE_URL/moderation/$MOD_ID/reject" \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Not enough details"}'
```

```bash
curl -i -X POST "$BASE_URL/moderation/$MOD_ID/reject" \
  -H "Authorization: Bearer $GUIDE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Not enough details"}'
```

✅ **Expectations**

* **Admin / Auditor** → `200` with a success payload (updated moderation item, or `{ success: true, ... }`).
* **Guide / User** → `403` with `code: "INSUFFICIENT_PERMISSIONS"`.

---

## 3️⃣ Logs & stats – `view_moderation_logs` / `access_moderation_dashboard`

### Admin

```bash
curl -i "$BASE_URL/moderation/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$BASE_URL/moderation/logs/activity" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Auditor

```bash
curl -i "$BASE_URL/moderation/dashboard/stats" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"

curl -i "$BASE_URL/moderation/logs/activity" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
```

### Regular user (should fail)

```bash
curl -i "$BASE_URL/moderation/dashboard/stats" \
  -H "Authorization: Bearer $USER_TOKEN"

curl -i "$BASE_URL/moderation/logs/activity" \
  -H "Authorization: Bearer $USER_TOKEN"
```

(You can also test with `GUIDE_TOKEN` if you want to be thorough.)

✅ **Expectations**

* **Admin / Auditor** → `200` with stats / logs JSON.
* **User / Guide** → `403` with `INSUFFICIENT_PERMISSIONS`.

---

## 4️⃣ Submit content – still **role-based** (`requireRole(['guide'])`)

This endpoint is intentionally **role-guarded** (not permission-based yet).

### Guide submits content

```bash
curl -i -X POST "$BASE_URL/moderation/submit" \
  -H "Authorization: Bearer $GUIDE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "destination",
    "content_id": 1
  }'
```

(Use a real `content_id` that exists in `destinations`.)

### User/Admin tries to submit (should fail)

```bash
curl -i -X POST "$BASE_URL/moderation/submit" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content_type": "destination", "content_id": 1}'
```

```bash
curl -i -X POST "$BASE_URL/moderation/submit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content_type": "destination", "content_id": 1}'
```

✅ **Expectations**

* **Guide** → `200` or `201` (depending on your controller) and a moderation log entry is created.
* **User / Admin** → `403` from `requireRole(['guide'])`.

---

That’s the **fully corrected Phase 4 guide** tailored to your actual backend:

* Correct host: `http://localhost:5000`
* Correct prefix: `/api`
* Tokens consistent with your existing scripts.

Run these and paste any weird responses (especially unexpected 200/403 combos) and we’ll know exactly which middleware/permission needs tightening.
