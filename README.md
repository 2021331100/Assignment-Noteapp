# Secure Notes — Backend API

A full-stack note management application with a REST API built using Node.js, Express, MongoDB, and Mongoose. The API supports user accounts, private notes, and administrator tools.

## Project Links

| Resource | Link |
|---|---|
| Live application | https://cerulean-starburst-490a40.netlify.app/ |
| Frontend source code | https://github.com/2021331100/secure-notes-frontend |
| Backend source code | https://github.com/2021331100/Assignment-Noteapp |
| Live API base URL | https://secure-notes-api-u0nq.onrender.com |
| API health check | https://secure-notes-api-u0nq.onrender.com/health |
| Backend README | https://github.com/2021331100/Assignment-Noteapp/blob/production-hardening/README.md |
| Frontend README | https://github.com/2021331100/secure-notes-frontend/blob/main/README.md |

The health check should return `status: "ok"` and `database: "connected"`.

## What the Application Does

Users can create an account, sign in, and manage their own notes. Administrators have additional access to manage user accounts and view notes across the application.

### User features
- Register and sign in.
- Create a note.
- View a list of personal notes.
- View, edit, and delete an individual personal note.
- View the signed-in user's profile.

### Administrator features
- Sign in with an administrator account.
- View all registered users.
- Create, view, update, and delete user accounts.
- View notes belonging to all users.
- Group users by their interests.

### Security and reliability
- Passwords are hashed before storage.
- JWT bearer tokens protect private API routes.
- Role checks restrict administrator routes.
- Users can only access their own notes.
- Request validation, rate limiting, Helmet security headers, and CORS origin checks are enabled.
- MongoDB stores application data.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password hashing:** bcryptjs
- **Hosting:** Netlify (frontend), Render (backend)

## How to Use the Live Application

1. Open the [live application](https://cerulean-starburst-490a40.netlify.app/).
2. Choose **Register** to create a regular user account.
3. Sign in with the email and password used during registration.
4. Create notes from the notes dashboard.
5. Select a note to view or edit it. Use the delete action to remove a note.
6. Sign out when finished.

A regular registration creates a normal user account. It does not create an administrator account.

## Roles and Permissions

| Action | User | Admin |
|---|:---:|:---:|
| Register and sign in | Yes | Yes |
| Create notes | Yes | Yes |
| View own notes | Yes | Yes |
| Update own notes | Yes | Yes |
| Delete own notes | Yes | Yes |
| List all users | No | Yes |
| Create, update, and delete users | No | Yes |
| View all users' notes | No | Yes |
| Group users by interests | No | Yes |

The server checks permissions. Hiding an administrator page in the frontend does not replace the server-side permission checks.

## API Reference

All endpoints use this live base URL:

```
https://secure-notes-api-u0nq.onrender.com
```

For protected endpoints, send the token returned by login in the request header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a regular user account |
| POST | `/api/auth/login` | Public | Sign in and receive an access token |
| GET | `/api/auth/me` | Signed-in user | Get the current user's profile |

Example registration body:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "Use-a-strong-password",
  "interests": ["reading", "coding"]
}
```

Example login body:

```json
{
  "email": "user@example.com",
  "password": "Use-a-strong-password"
}
```

Use the exact field names shown in the examples. The server does not allow public registration to grant administrator privileges.

### Notes

All note endpoints require a valid User or Admin token. A user can access only their own notes.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List your notes |
| GET | `/api/notes/:id` | Get one of your notes |
| PUT | `/api/notes/:id` | Update one of your notes |
| DELETE | `/api/notes/:id` | Delete one of your notes |

Use **PUT** to update a note. The documented update route is not PATCH.

### Administrator

Every endpoint in this section requires an Admin token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/users` | Create a user |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:id` | View one user |
| PUT | `/api/admin/users/:id` | Update a user |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/notes` | View all users' notes |
| GET | `/api/admin/users/group-by-interests` | Group users by interests |

### Other endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/:userId/posts` | Get posts for a user (requires sign-in) |
| GET | `/health` | Check API and database status |

List endpoints support pagination with query parameters such as `?page=1&limit=10`.

## Administrator Account Setup

The public Register page creates a regular user. Administrator accounts are created separately by the project owner using the backend's one-time seed command.

From the backend project directory, install dependencies and set the required environment values in your local terminal:

```bash
npm install

ADMIN_NAME="Assignment Admin" \
ADMIN_EMAIL="your-admin-email@example.com" \
ADMIN_PASSWORD="Choose-a-unique-password-of-12-chars-or-more" \
MONGODB_URI="your-production-mongodb-connection-string" \
npm run seed:admin
```

Replace the example values with your own. Use the same MongoDB database configured for the deployed API. The password must be at least 12 characters. The seed command will not convert an existing regular account into an administrator; use a separate email address.

After the command succeeds, remove the temporary environment values from your terminal session. Never add real passwords, database connection strings, or tokens to this repository.

### Administrator sign-in

Use the administrator email and password created by the seed command on the application's sign-in page. The server returns an access token for that account. Administrator pages and API routes are available only when the signed-in account has the Admin role.

Do not publish administrator credentials in this README. If an evaluator needs access, provide a dedicated test account through a private channel and disable or rotate it after evaluation.

## Run the Backend Locally

### Requirements
- Node.js (LTS version recommended)
- npm
- A MongoDB database (MongoDB Atlas or local MongoDB)

### Install

```bash
git clone https://github.com/2021331100/Assignment-Noteapp.git
cd Assignment-Noteapp
npm install
```

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_random_secret_of_at_least_32_characters
CORS_ORIGIN=http://localhost:5500
TRUST_PROXY_HOPS=0
```

Start the development server:

```bash
npm run dev
```

The API will run at `http://localhost:3000`. Check `http://localhost:3000/health` to confirm the database connection.

## Deployment and Configuration

The deployed frontend is hosted on Netlify and the API is hosted on Render.

The Render service needs these environment variables:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Set to `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Private signing secret, at least 32 characters |
| `CORS_ORIGIN` | Exact frontend origin: `https://cerulean-starburst-490a40.netlify.app` |
| `TRUST_PROXY_HOPS` | Proxy hop count configured for the hosting setup |

Do not add a trailing slash to the `CORS_ORIGIN` value. If another frontend domain is used, add its exact origin as a comma-separated value. Redeploy the backend after changing environment variables.

## Testing with Postman

1. Open the [live API base URL](https://secure-notes-api-u0nq.onrender.com).
2. Send a POST request to `/api/auth/register` with a new user's JSON details.
3. Send a POST request to `/api/auth/login` with that user's email and password.
4. Copy the returned access token.
5. For private routes, choose **Authorization → Bearer Token** in Postman and paste the token.
6. Test the note routes using the User token.
7. Sign in with a separately created Admin account and use its token to test the Admin routes.

### Expected access responses

| Situation | Expected status |
|---|---|
| Protected route without a token | 401 Unauthorized |
| Invalid or expired token | 401 Unauthorized |
| Normal user calls an Admin route | 403 Forbidden |
| Request data fails validation | 400 Bad Request (or the validation response defined by the API) |
| Successful creation | Usually 201 Created |
| Successful read or update | Usually 200 OK |
| Successful deletion | Usually 200 OK or 204 No Content, depending on the route |

Use test accounts and disposable test records when checking update and delete operations.

## Troubleshooting

**The application says it cannot connect to the API**
- Open the [API health check](https://secure-notes-api-u0nq.onrender.com/health).
- Confirm the response says the database is connected.
- Check the Render service status and logs.

**The browser reports a CORS error**
- Confirm the Netlify site URL is exactly listed in Render's `CORS_ORIGIN` variable.
- Do not include a trailing slash or an `/api` suffix in the origin.
- Save the environment variable and wait for the Render deployment to finish.

**The first API request takes a while**
- A free hosting service may sleep after a period without requests. The first request can take longer while it starts.

**A normal user cannot open the Admin page**
- This is expected. Sign in with an account whose database role is `admin`.

## Important Security Notes

- Never commit `.env` files or real credentials.
- Do not share access tokens.
- Use a unique administrator password.
- Do not use personal or production administrator credentials for demonstrations.
- Only test with accounts and data you are authorized to use.

## License

See the repository for license information.
