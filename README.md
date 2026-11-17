# Secure Note-Taking REST API

A modular note-taking API built with Node.js, Express, MongoDB, and Mongoose. It includes JWT authentication, role-based access control, note ownership rules, pagination, indexes, aggregation endpoints, and a demo frontend.

## Live Deployment

| Resource | URL |
| --- | --- |
| Live Backend API | https://secure-notes-api-u0nq.onrender.com |
| Health Check | https://secure-notes-api-u0nq.onrender.com/health |
| GitHub Repository | https://github.com/2021331100/Assignment-Noteapp |

The health endpoint should return `status: "ok"` and `database: "connected"` when the API and MongoDB are ready.

> Render free services may spin down after inactivity. The first request after a quiet period may take longer.

## Features

- User registration and login with JWT bearer authentication
- Password hashing with bcryptjs
- User and admin role-based permissions
- Note CRUD restricted to note owners
- Admin user management and visibility of all notes
- Group users by interests
- Pagination and MongoDB indexes
- Helmet security headers and rate limiting
- Exact-origin CORS allowlist
- Environment validation and persistent MongoDB requirement
- Health check, structured request logs, and graceful shutdown

## Local Setup

```bash
npm install
cp .env.example .env
```

Set the required values in `.env`:

- `MONGODB_URI`: MongoDB Atlas or another persistent MongoDB connection string
- `JWT_SECRET`: a random secret of at least 32 characters
- `CORS_ORIGIN`: the exact frontend origin, e.g. `http://localhost:3000`
- `TRUST_PROXY_HOPS`: use `0` for local development

Start the API:

```bash
npm run dev
```

The server listens on `PORT` (default 3000). It fails at startup if required production configuration is missing. There is no local or in-memory database fallback.

## Roles and Permissions

| Feature | User | Admin |
| --- | :---: | :---: |
| Register and log in | Yes | Yes |
| Create notes | Yes | Yes |
| View own notes | Yes | Yes |
| Update own notes | Yes | Yes |
| Delete own notes | Yes | Yes |
| Manage users | No | Yes |
| View all users | No | Yes |
| View every user's notes | No | Yes |
| Group users by interests | No | Yes |

A regular user must not be able to access admin endpoints or another user's notes. The registration endpoint must not allow a client to grant itself the admin role.

## API Endpoints

All endpoints below are relative to the live API base URL:

`https://secure-notes-api-u0nq.onrender.com`

### Authentication

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register a regular user | No |
| POST | `/api/auth/login` | Log in and receive an access token | No |
| GET | `/api/auth/me` | Get the authenticated user's profile | Bearer token |

### Notes

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/notes` | Create a note | User/Admin |
| GET | `/api/notes` | List the current user's notes | User/Admin |
| GET | `/api/notes/:id` | Get a note | User/Admin; owner only |
| PUT | `/api/notes/:id` | Update a note | User/Admin; owner only |
| DELETE | `/api/notes/:id` | Delete a note | User/Admin; owner only |

Use **PUT** for updates. This API does not document PATCH as the update method.

### Admin

Every admin endpoint requires a valid Admin Bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/admin/users` | Create a user |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:id` | Get a user's details |
| PUT | `/api/admin/users/:id` | Update a user |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/notes` | View notes from all users |
| GET | `/api/admin/users/group-by-interests` | Group users by interests |

### Other

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/users/:userId/posts` | Get posts for a user |
| GET | `/health` | Check API and database readiness |

List endpoints support pagination with `?page=1&limit=10`.

## Admin Account Setup

For security, the application does not create a default admin account and public registration should not grant admin privileges.

The repository provides a one-time seed command. Run it from the backend project using the **production MongoDB connection string** and temporary environment variables:

```bash
ADMIN_NAME="Assignment Admin" \
ADMIN_EMAIL="your-admin-email@example.com" \
ADMIN_PASSWORD="Use-A-Unique-Password-12+" \
MONGODB_URI="your-production-mongodb-connection-string" \
JWT_SECRET="your-local-valid-jwt-secret-of-at-least-32-characters" \
npm run seed:admin
```

Replace the example values locally. Do not paste real credentials into this README, GitHub, screenshots, or public messages. The admin password must be at least 12 characters. The seed command will not promote an existing regular user to admin.

After successful seeding, remove the temporary admin environment variables from your shell/environment. Keep the admin password private and store it securely.

### Admin Login

Send:

`POST https://secure-notes-api-u0nq.onrender.com/api/auth/login`

JSON body:

```json
{
  "email": "your-admin-email@example.com",
  "password": "your-admin-password"
}
```

Copy the returned access token into your API client (for example, Postman):

- Authorization type: **Bearer Token**
- Token: the access token returned by login

Then call the admin endpoints listed above. Never share the access token.

### How Assignment Evaluators Can Test Admin Features

The project owner should create a dedicated test admin account in the deployed database and share its login credentials with the evaluator through a private submission channel—not in this public repository.

The evaluator can then:

1. Log in using the Admin Login instructions above.
2. Set the returned access token as a Bearer token in Postman or another API client.
3. Call `GET /api/admin/users` to list users.
4. Call `GET /api/admin/users/group-by-interests` to test the interests aggregation.
5. Call `POST /api/admin/users` to create a test user.
6. Call `GET /api/admin/users/:id`, `PUT /api/admin/users/:id`, and `DELETE /api/admin/users/:id` to test user management. Use a disposable test user for deletion.
7. Call `GET /api/admin/notes` to view notes across users.

Use a separate normal user account to test the User role. Do not give evaluators a personal account or production owner credentials. After evaluation, rotate or disable the temporary test admin account.

## Deployment on Render

This repository includes `render.yaml` for a Render Web Service.

1. Create or configure a Render Web Service from this repository.
2. Use the `production-hardening` branch until its changes are merged into `main`.
3. Set `MONGODB_URI` to the MongoDB Atlas connection string in Render Environment.
4. Set `CORS_ORIGIN` to the exact deployed frontend origin.
5. Keep `JWT_SECRET` private. Render can generate a value from the Blueprint.
6. Deploy and verify the health check: https://secure-notes-api-u0nq.onrender.com/health

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | Use `production` on Render |
| `PORT` | No | Server port; supplied by Render |
| `MONGODB_URI` | Yes | Persistent MongoDB connection |
| `JWT_SECRET` | Yes | JWT signing secret (32+ characters) |
| `JWT_EXPIRES_IN` | No | Token lifetime; defaults to `7d` |
| `CORS_ORIGIN` | Production | Exact frontend origin; comma-separated for multiple origins |
| `TRUST_PROXY_HOPS` | No | Number of trusted reverse-proxy hops |
| `ADMIN_EMAIL` | Admin setup only | One-time admin email |
| `ADMIN_PASSWORD` | Admin setup only | One-time admin password (12+ characters) |
| `ADMIN_NAME` | Admin setup only | Optional admin display name |

Never commit `.env`, database connection strings, passwords, JWT secrets, or access tokens.

## Security Testing Checklist

Run these checks with separate test accounts and non-sensitive test data. Record the actual result before marking a check as passed.

| Test | Expected result |
| --- | --- |
| Request a protected endpoint without a token | `401 Unauthorized` |
| Send an invalid or expired token | `401 Unauthorized` |
| Call an admin endpoint with a normal user's token | `403 Forbidden` |
| Try to register with `role: "admin"` | Must not grant admin access |
| Read another user's note | Access denied |
| Update or delete another user's note | Access denied |
| Submit invalid request data | Validation error (normally `400 Bad Request`) |
| Send repeated login requests | Rate limiting should apply |
| Send a request from an unapproved browser origin | CORS should block the origin |

Do not test against other people's accounts or data. Do not perform destructive tests on real user records. A checklist item is not considered passed until it has been executed and its actual response checked.

## Security and Operations

- Public service URLs use HTTPS.
- CORS permits only configured origins.
- Do not set `trust proxy` to `true`; configure the hop count to match the hosting topology.
- `/health` checks database readiness.
- SIGTERM and SIGINT trigger graceful HTTP and MongoDB shutdown.
- Request logs record method, path, status, and duration only; they do not record passwords, tokens, cookies, or request bodies.
- Configure MongoDB Atlas backups and periodically test restoration.

## Tests

The API test suite requires a reachable MongoDB database:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/secure_notes_test JWT_SECRET=local-test-secret-that-is-at-least-32-characters npm test
```

GitHub Actions runs the suite against a temporary MongoDB service on pushes and pull requests.
