### Base
- Local: `http://localhost:3000/api`
- Prod: `https://app.arzansite.com/api`
- Global prefix: `/api`

### Auth model
- Prefer cookie-based auth in browsers: backend sets HttpOnly cookie `appwrite_jwt` via `POST /api/auth/session` with `{ jwt }` from Appwrite `account.createJWT()`.
- Alternatively, send `Authorization: Bearer <token>` where token can be:
  - Backend JWT (from `auth/login`, `auth/refresh`, etc.)
  - Appwrite JWT (guard will validate with Appwrite)
- CORS: set `credentials: 'include'`. Origins must be allowed via `CORS_ORIGINS`.

### Required headers
- JSON: `Content-Type: application/json`
- Auth: send cookie automatically with `credentials: 'include'` OR header `Authorization: Bearer <token>`
- File uploads: `multipart/form-data`

### Response shape
- Success: `{ success: true, data: <payload>, timestamp: ISO }` (via TransformInterceptor) for most controllers. Some endpoints return raw shapes as coded.
- Error: `{ success: false, error: string, errorCode?: string, errorDetails?: string, timestamp: ISO }` (ErrorInterceptor) or standard Nest error `{ statusCode, message, error, ... }` from HttpExceptionFilter for some cases.

### Status codes and frontend handling
- 200 OK: parse JSON normally
- 201 Created: creation success
- 204 No Content: deletion success (no body)
- 400 Bad Request: validation/user input; show message, highlight fields if available
- 401 Unauthorized: refresh or re-auth; if using cookie, redirect to login/session creation
- 403 Forbidden: hide/disable UI, show “no permission”
- 404 Not Found: show friendly missing state
- 429 Too Many Requests: backoff/retry UI
- 500 Server Error: generic error, allow retry

### Auth endpoints `/auth`
- POST `/auth/signup`
  - Body: `{ email, password, metadata? }`
  - 201: user created + verification email
- POST `/auth/verify-email`
  - Body: `{ token, userId? }`
  - 200: email verified
- POST `/auth/password-reset`
  - Body: `{ email }`
  - 200: reset email sent
- POST `/auth/login`
  - Body: `{ email, password }`
  - 200: `{ access_token, refresh_token, user, session?, redirect? }`
- POST `/auth/refresh`
  - Body: `{ refresh_token }`
  - 200: `{ access_token, user }`
- POST `/auth/logout` (Bearer required)
  - 200: logout
- GET `/auth/me` (Bearer required)
  - 200: current user info
- POST `/auth/session`  [cookie-based]
  - Body: `{ jwt }` (Appwrite JWT)
  - 200: sets cookie `appwrite_jwt`, returns `{ user, message }`
- POST `/auth/userinfo` (Appwrite JWT via header/cookie)
  - 200: `{ user }`
- POST `/auth/exchange-jwt`
  - Body: `{ appwriteJwt }`
  - 200: backend JWT tokens `{ access_token, refresh_token, user }`
- POST `/auth/session-auth`
  - Body: `{ sessionId?, email?, password? }` (either sessionId+email or email+password)
  - 200: backend JWT tokens
- POST `/auth/session-logout`
  - Body: `{ sessionId }`
  - 200: session invalidated
- GET `/auth/session-info/:sessionId`
- POST `/auth/session-validate` Body: `{ sessionId }` → `{ valid, sessionId }`
- OAuth helpers:
  - POST `/auth/oauth/:provider/start` Body: `{ successUrl, failureUrl }` → `{ redirectUrl }`
  - POST `/auth/oauth/:provider/callback` Body: `{ userId, secret }` → sets cookies + redirect
  - GET `/auth/oauth/providers`
  - GET `/auth/oauth/me`
  - POST `/auth/oauth/logout` clears cookies

Frontend example (cookie flow):
```javascript
// Create Appwrite session, then JWT, then backend cookie
const { jwt } = await account.createJWT();
await fetch(`${API}/auth/session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ jwt })
});
// Call protected
const res = await fetch(`${API}/profiles/me`, { credentials: 'include' });
```

### Profiles `/profiles` (Bearer or cookie)
- GET `/profiles/me` → my profile
- PATCH `/profiles/me` Body: `UpdateProfileDto`
- GET `/profiles` [admin]

### Orders `/orders` (Bearer or cookie)
- GET `/orders?mine=true|admin=true`
- POST `/orders` Body: `CreateOrderDto`
- GET `/orders/:id`
- PATCH `/orders/:id` Body: `UpdateOrderDto`
- DELETE `/orders/:id` → 204

Create example:
```json
{
  "title": "Website Design",
  "description": "Modern responsive website",
  "price": 15000000,
  "payment_status": "pending",
  "sessionId": "wizard_abc123"
}
```

Implementation notes (Appwrite DB):
- All order documents MUST include `user_id` (snake_case) referencing the authenticated user. If missing, Appwrite will return "Invalid document structure: Missing required attribute \"userId\"" depending on your schema.
- On create, the backend should inject `user_id` from the auth context; never trust client payload for ownership.
- Set permissions so the owner can read/write:
  - `Permission.read(Role.user(user_id))`, `Permission.write(Role.user(user_id))`.
- If you previously used `userid` or `userId`, migrate to `user_id` consistently across DTOs, services, and collection schema.

### Designs tied to orders `/orders/:orderId/design` (Bearer or cookie)
- POST `/` Body: `{ design, options? }`
- GET `/`
- GET `/options`
- PATCH `/options` Body: `{ options }`
- PATCH `/preview-url` Body: `{ previewUrl }`

### Uploads `/uploads` (Bearer or cookie)
- GET `/uploads?userId=&orderId=`
- GET `/uploads/order/:orderId`
- GET `/uploads/:id?bucketType=document|design|avatar`
- POST `/uploads` multipart: `file`, `orderId?`, `fileType?`
- POST `/uploads/bulk` multipart: `files[]`, `orderId?`, `fileType?`, `description?`
- DELETE `/uploads/:id?bucketType=...` → 204
- DELETE `/uploads/bulk` Body: `{ fileIds: string[], bucketType? }` → 204

JS upload (legacy uploads controller):
```javascript
const fd = new FormData();
fd.append('file', file);
fd.append('orderId', orderId);
fd.append('fileType', 'design');
await fetch(`${API}/uploads`, { method: 'POST', body: fd, credentials: 'include' });
```

Preferred (Appwrite Storage wrappers):
- POST `/storage/upload/:bucketId` multipart: `file`
- GET `/storage/:bucketId` list files
- GET `/storage/:bucketId/:fileId/url` → returns direct view/download URL
- DELETE `/storage/:bucketId/:fileId`

Backend (Nest + Appwrite Server SDK):
```ts
// POST /storage/upload/:bucketId
const file = request.file; // Multer
const created = await storage.createFile(bucketId, ID.unique(), InputFile.fromBuffer(file.buffer, file.originalname));
return { success: true, data: { fileId: created.$id } };

// GET /storage/:bucketId/:fileId/url
const url = storage.getFileView(bucketId, fileId); // or build URL if SDK returns a Response
return { success: true, data: { url } };
```

### Wallets `/wallets` (Bearer or cookie)
- GET `/wallets/me` → wallet
- GET `/wallets/me/balance` or `/wallets/balance`
- GET `/wallets/me/transactions?limit=&offset=`
- POST `/wallets/me/transactions` Body: `CreateTransactionDto`
- POST `/wallets/me/deposit` Body: `{ amount, description, callbackUrl?, mobile?, email? }` → `{ paymentUrl, authority }`
- POST `/wallets/me/deposit/verify` Body: `{ authority }` → credit wallet
- POST `/wallets/deposit/callback` payment gateway callback
- POST `/wallets/deposit/verify-with-gateway` Body: `{ authority, amount, userId, orderId? }`
- POST `/wallets/me/topup` Body: `{ amount, refId }`
- POST `/wallets/refund-order` Body: `{ orderId }`
- Admin:
  - POST `/wallets/:userId/credit` Body: `{ amount, description? }`
  - POST `/wallets/:userId/debit` Body: `{ amount, description? }`
  - GET `/wallets/:userId`
  - GET `/wallets/:userId/transactions?limit=&offset=`

### Payments `/payments` (Bearer or cookie)
- GET `/payments/test-connection`
- GET `/payments/status` → gateway status
- POST `/payments/request` Body: `{ amount, description, callbackUrl?, orderId?, mobile?, email? }` → `{ authority, paymentUrl }`
- POST `/payments/verify` Body: `{ authority, amount }` → `{ refId }`
- POST `/payments/refund` Body: `{ orderId, amount? }`
- POST `/payments/cancel` Body: `{ orderId }`
- GET `/payments/orders/:orderId`

### Transactions `/transactions` (Bearer or cookie)
- GET `/transactions/my?limit=&offset=`
- GET `/transactions/:id`
- GET `/transactions/order/:orderId`
- Admin: GET `/transactions?limit=&offset=`

### Invoices `/invoices` (Bearer or cookie)
- POST `/invoices` Body: `CreateInvoiceDto`
- GET `/invoices?page=&limit=` → user’s invoices; admin sees all
- GET `/invoices/:id`
- POST `/invoices/:id/pay` Body: `PayInvoiceDto` (wallet by default)
- PUT `/invoices/:id` [admin] Body: `UpdateInvoiceDto`
- GET `/invoices/admin/all?page=&limit=&status=&userId=` [admin]

### Receipts `/receipts` (Bearer or cookie)
- GET `/receipts?page=&limit=`
- GET `/receipts/:id`
- GET `/receipts/:id/download?format=pdf|html` → file download

### Email (admin only) `/emails` (Bearer admin)
- POST `/emails/test` Body: `{ to, subject, html, text? }`
- POST `/emails/template` Body: `{ to, template, data }`
- POST `/emails/send` Body: `{ to, subject, html, text?, replyTo? }`
- GET `/emails/logs?limit=&offset=&success=&template_type=`
- GET `/emails/status`

### Site config `/site-config`
- GET `/site-config/current`
- PATCH `/site-config` [admin] Body: `{ mode: 'normal'|'temporarily_unavailable'|'update_mode'|'development_mode' }`
- GET `/site-config/history` [admin]

### Domains `/domains`
- GET `/domains/extensions`
- GET `/domains/prices`
- GET `/domains/check?domain=&extension=.ir`
- POST `/domains/check-availability` Body: `{ domain, extension? }`
- POST `/domains/check` Body: `{ domain, extension? }`
- GET `/domains/search?q=` (auth required)
- PUT `/domains/prices/:extensionId` [admin] Body: `{ price, available }`

### Appwrite utilities (auth required)
- Database `/db`
  - POST `/db/:collectionId` Body: `{ data, documentId? }`
  - GET `/db/:collectionId/:documentId`
  - PUT `/db/:collectionId/:documentId` Body: `{ data }`
  - DELETE `/db/:collectionId/:documentId`
  - GET `/db/:collectionId?queries=<array>`
- Functions `/functions`
  - POST `/functions/execute` Body: `{ functionId, data?, xAsync? }`
  - POST `/functions/webhook` headers: `x-appwrite-webhook`, `x-appwrite-event`
- Storage `/storage` (two controllers exist; prefer these)
  - GET `/storage/:bucketId` list
  - GET `/storage/:bucketId/:fileId`
  - GET `/storage/:bucketId/:fileId/url`
  - POST `/storage/upload/:bucketId` multipart file
  - DELETE `/storage/:bucketId/:fileId`
  - Aliases via second storage controller:
    - POST `/storage/upload-url` Body: `{ bucketId, fileName }`
    - GET `/storage/file-url?bucketId=&fileId=`
    - POST `/storage/uploads?bucketId=` multipart `file`
    - GET `/storage/uploads?bucketId=`
    - DELETE `/storage/uploads/:id?bucketId=`
    - GET `/storage/uploads/signed-url?path=bucket/file` or `bucketId&fileId`

### Health
- GET `/health` (no prefix exclusion? Excluded path configured; available at `/health`)

### Frontend patterns

- Fetch with cookie auth:
```javascript
const get = (path) => fetch(`${API}${path}`, { credentials: 'include' })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));

await get('/profiles/me');
```

- Fetch with bearer:
```javascript
const authFetch = (path, options={}) =>
  fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers||{}) },
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
```

- Error handling:
```javascript
try {
  const res = await get('/invoices');
} catch (e) {
  if (e.errorCode === 'UNAUTHORIZED' || e.statusCode === 401) { /* re-auth */ }
  else if (e.errorCode === 'FORBIDDEN' || e.statusCode === 403) { /* show no access */ }
  else { /* show e.error || e.message */ }
}
```

- File upload:
```javascript
const fd = new FormData();
fd.append('file', file);
fd.append('orderId', orderId);
await fetch(`${API}/uploads`, { method: 'POST', body: fd, credentials: 'include' });
```

- Payment request + verify:
```javascript
const { paymentUrl, authority } = await authFetch('/payments/request', {
  method: 'POST',
  body: JSON.stringify({ amount, description, callbackUrl })
});
window.location.href = paymentUrl;
// After callback:
const verify = await authFetch('/payments/verify', {
  method: 'POST',
  body: JSON.stringify({ authority, amount })
});
```

- Wallet deposit:
```javascript
const { paymentUrl } = await authFetch('/wallets/me/deposit', {
  method: 'POST',
  body: JSON.stringify({ amount: 3000000, description: 'شارژ کیف پول' })
});
window.location.href = paymentUrl;
```

Notes
- Always use `credentials: 'include'` when using cookie-based auth.
- For admin endpoints, ensure token user has `role: admin` in Appwrite roles collection.
- For large bodies, server limit is 30MB. Use multipart for files.
- Swagger at `/api/docs` for live testing.

### OAuth guidance
- If Nest manages OAuth: use `/auth/oauth/:provider/start` and complete in `/auth/oauth/:provider/callback`, then mint backend JWT and set cookies. Do not redirect users to Appwrite callback routes directly.
- If Appwrite manages OAuth: use Appwrite JS SDK `account.createOAuth2Session(provider, successUrl, failureUrl)` and then exchange the Appwrite JWT with backend at `/auth/session` or `/auth/exchange-jwt`.

### Messaging topics
- `subscribe` must be a valid role: `any`, `guests`, `users`, `user:<USER_ID>`, `team:<ID>`, `member:<ID>`, or `label:<ID>`.
- Replace any usage of `me` with `user:<user_id>` or `users` as appropriate.

- If integration still fails, verify:
  - CORS_ORIGINS includes your frontend origin.
  - Cookies have correct domain/secure flags for prod.
  - Using HTTPS in production for `SameSite=None; Secure` cookies.

- Health check quickly:
```bash
curl http://localhost:3000/health
```

This should unblock the frontend team. If you want, I can also generate a Postman collection or TypeScript API client from these routes.