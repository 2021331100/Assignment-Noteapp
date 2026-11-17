# Secure Note-Taking REST API

A modular note-taking API built with Node.js, Express, MongoDB, and Mongoose. It includes JWT authentication, role-based access control, note ownership rules, pagination, indexes, aggregation endpoints, and a small demo frontend.

## Features

- User registration and login with JWT bearer authentication
- Password hashing with bcryptjs
- User and admin role-based permissions
- Note CRUD restricted to note owners
- Admin user management and visibility of all notes
- Pagination and MongoDB indexes
- Aggregation for grouping users by interests and looking up posts
- Helmet security headers and rate limiting
- Exact-origin CORS allowlist
- Environment validation and persistent MongoDB requirement
- Health check, structured request logs, and graceful shutdown

## Local setup

```bash
npm install
cp .env.example .env
```

Set real values in `.env`:

- `MONGODB_URI`: a MongoDB Atlas or local persistent MongoDB connection string
- `JWT_SECRET`: a random secret of at least 32 characters
- `CORS_ORIGIN`: the exact frontend origin, e.g. `http://localhost:3000`
- `TRUST_PROXY_HOPS`: `0` for local development

Start the API:

```bash
npm run dev
```

The server listens on `PORT` (default 3000). It fails at startup if required production configuration is missing. There is no local or in-memory database fallback.

## Create the first admin

Admin creation is an explicit one-time operation. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and optionally `ADMIN_NAME` in your local environment, then run:

```bash
npm run seed:admin
```

The seed command will not promote an existing regular user to admin and will not create an account with a built-in default password. Remove the temporary admin environment variables after setup.

## API endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Notes
- `POST /api/notes`
- `GET /api/notes`
- `GET /api/notes/:id`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

### Admin
- `POST /api/admin/users`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/notes`
- `GET /api/admin/users/group-by-interests`

### Other
- `GET /api/users/:userId/posts`
- `GET /health` — returns HTTP 200 when MongoDB is connected, otherwise HTTP 503

List endpoints accept `?page=1&limit=10`.

## Deployment on Render

This repository includes `render.yaml` for a Render Web Service.

1. Create a Render Web Service from this repository.
2. Use the `production-hardening` branch until its changes are merged into `main`.
3. Set `MONGODB_URI` to your MongoDB Atlas connection string in Render Environment.
4. Set `CORS_ORIGIN` to the exact deployed frontend origin (for example, `https://your-site.netlify.app`).
5. Keep `JWT_SECRET` private. Render can generate a value from the Blueprint.
6. Deploy and check `https://YOUR-SERVICE.onrender.com/health`.

Render's free web services may spin down after inactivity, so the first request after a quiet period can take longer.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | Use `production` on Render |
| `PORT` | No | Server port; supplied by Render |
| `MONGODB_URI` | Yes | Persistent MongoDB connection |
| `JWT_SECRET` | Yes | JWT signing secret (32+ characters) |
| `JWT_EXPIRES_IN` | No | Token lifetime; defaults to `7d` |
| `CORS_ORIGIN` | Production | Exact frontend origin; comma-separated for multiple origins |
| `TRUST_PROXY_HOPS` | No | Number of trusted reverse-proxy hops; set to match hosting topology |
| `ADMIN_EMAIL` | Admin setup only | One-time admin email |
| `ADMIN_PASSWORD` | Admin setup only | One-time admin password (12+ characters) |

Never commit `.env` or production credentials.

## Security and operations

- TLS is terminated by Render; public service URLs use HTTPS.
- CORS permits only configured origins.
- Do not set `trust proxy` to `true`; configure the hop count to match the host's proxy chain.
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
