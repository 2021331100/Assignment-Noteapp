# Secure Note-Taking REST API

A secure, modular note-taking application built with Node.js, Express.js, MongoDB, and Mongoose. The project follows MVC architecture, includes JWT-based authentication, role-based permission checks, pagination, database indexing, and aggregation endpoints for the required interview assignment.

## Features

- User registration and login with JWT authentication
- Password hashing with bcryptjs
- Role-based access control with `user` and `admin`
- Note CRUD restricted to note owners
- Admin user management and admin note visibility
- Pagination for every list route
- Database indexes created via `schema.index()`
- Aggregation for grouping users by interests
- Aggregation with `$lookup` for user posts
- Helmet-based security headers
- Rate limiting on auth routes
- CORS configuration
- Centralized error handling and validation
- Minimal frontend using HTML/CSS/Vanilla JavaScript

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- HTML, CSS, and Vanilla JavaScript

## Folder Structure

```text
.
├── .env
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── server.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── noteController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Note.js
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── noteRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── asyncHandler.js
│   │   └── pagination.js
│   └── validators/
│       ├── adminValidator.js
│       ├── authValidator.js
│       └── noteValidator.js
└── tests/
    └── api.test.js
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` into `.env` and update the values.

```bash
cp .env.example .env
```

Required variables:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.example.mongodb.net/note_app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> The project also contains a safe in-memory MongoDB fallback used in restricted environments for testing. The production config should still use the Atlas URI when available.

## Database Setup

1. Make sure MongoDB is running or your MongoDB Atlas connection string is valid.
2. The app automatically connects to MongoDB using `MONGODB_URI`.
3. If the external URI is unavailable, it falls back to a local in-memory MongoDB instance for smoke testing and local verification.

## Authentication and Authorization

### Default admin account

The app creates a default admin automatically on startup if no matching admin user exists. The default credentials are:

```text
Email: admin@example.com
Password: Admin@123
```

These values can be overridden using `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

### JWT usage

After successful login or registration, the API returns a JWT bearer token. Clients must send it with the `Authorization: Bearer <token>` header.

### Role permissions

- `user`
  - Register
  - Log in
  - View own profile
  - Create notes
  - List own notes
  - View own note
  - Update own note
  - Delete own note
- `admin`
  - All user permissions
  - Create users
  - List all users
  - View user profiles
  - Update users
  - Delete users
  - View all notes
  - View user grouping by interests

### Security notes

- Passwords are never returned in responses.
- Passwords are hashed with bcryptjs before persistence.
- Normal users cannot assign themselves the admin role during registration.
- Admin-only routes enforce fresh DB role checks.
- A Bearer token approach is used instead of cookies for simplicity and compatibility, but cookies would require CSRF protection and secure cookie flags in production if chosen.

## API Endpoints

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

### Posts

- `GET /api/users/:userId/posts`

## Pagination

All list endpoints support pagination:

```text
?page=1&limit=10
```

Response structure:

```json
{
  "page": 1,
  "limit": 10,
  "totalRecords": 42,
  "totalPages": 5,
  "data": []
}
```

## Indexing Strategy

The app explicitly uses `schema.index()` to define the necessary compound indexes:

### User indexes

- `email` unique index for login and duplicate check prevention
- `{ createdAt: -1, _id: -1 }` for admin user listing and consistent sorting

### Note indexes

- `{ userId: 1, createdAt: -1, _id: -1 }` for listing a user's notes with pagination and sorting
- `{ createdAt: -1, _id: -1 }` for admin-wide note listing

### Post index

- `{ userId: 1, createdAt: -1, _id: -1 }` for the user posts lookup pipeline and pagination within `$lookup`

These indexes are intentionally kept minimal and directly support required query and sorting behavior.

## Aggregation Pipelines

### 1) Group users by interests

This route uses a single `User.aggregate()` call with:

- `$unwind`
- `$group`
- `$push`
- `$sort`

It returns the users grouped by interest.

### 2) User posts lookup

This route uses a single `User.aggregate()` pipeline with a `$lookup` stage to join the `posts` collection by `userId`. It sorts posts by `createdAt` descending and `_id` descending and paginates inside the pipeline.

## Running the App

```bash
npm start
```

For local development:

```bash
npm run dev
```

## Testing

The project includes a Node.js test suite covering registration, login, auth, user permissions, note ownership checks, admin access, pagination, and aggregation behavior.

```bash
npm test
```

## Notes

- The application uses a Bearer token pattern in the API and therefore is designed to work with a frontend that stores the token in memory or localStorage.
- If a cookie-based auth model is chosen later, CSRF protection and secure cookie flags should be added at that time.
