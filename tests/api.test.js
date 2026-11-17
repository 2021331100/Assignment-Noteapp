const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Note = require('../src/models/Note');
const Post = require('../src/models/Post');

const PORT = 4300;
let server;
let userToken;
let adminToken;
let normalUserId;
let adminUserId;
let noteId;

const request = async (path, method = 'GET', payload = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:${PORT}${path}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  return {
    status: response.status,
    body,
  };
};

test.before(async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Note.deleteMany({}),
    Post.deleteMany({}),
  ]);

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  await mongoose.disconnect();
});

test('register normal user and reject admin assignment during registration', async () => {
  const registerResponse = await request('/api/auth/register', 'POST', {
    name: 'Alice User',
    email: 'alice@example.com',
    password: 'password123',
    interests: ['reading', 'chess'],
    role: 'admin',
  });

  assert.equal(registerResponse.status, 403);
  assert.match(registerResponse.body.message, /admin role/i);

  const response = await request('/api/auth/register', 'POST', {
    name: 'Alice User',
    email: 'alice@example.com',
    password: 'password123',
    interests: ['reading', 'chess'],
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.role, 'user');
  assert.equal(response.body.user.password, undefined);
  normalUserId = response.body.user._id;
  userToken = response.body.token;
});

test('login with valid credentials', async () => {
  const response = await request('/api/auth/login', 'POST', {
    email: 'alice@example.com',
    password: 'password123',
  });

  assert.equal(response.status, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.email, 'alice@example.com');
  userToken = response.body.token;
});

test('user can create and retrieve notes with pagination', async () => {
  const createResponse = await request('/api/notes', 'POST', {
    title: 'First note',
    content: 'This is the first note content.',
  }, userToken);

  assert.equal(createResponse.status, 201);
  noteId = createResponse.body.note._id;

  const listResponse = await request('/api/notes?page=1&limit=1', 'GET', null, userToken);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.page, 1);
  assert.equal(listResponse.body.limit, 1);
  assert.ok(Array.isArray(listResponse.body.data));

  const getResponse = await request(`/api/notes/${noteId}`, 'GET', null, userToken);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.note.title, 'First note');
});

test('user cannot modify another user\'s note', async () => {
  const secondUserResponse = await request('/api/auth/register', 'POST', {
    name: 'Bob User',
    email: 'bob@example.com',
    password: 'password456',
    interests: ['coding'],
  });

  assert.equal(secondUserResponse.status, 201);

  const updateResponse = await request(`/api/notes/${noteId}`, 'PUT', {
    title: 'Hacked Title',
    content: 'Should fail',
  }, secondUserResponse.body.token);

  assert.equal(updateResponse.status, 404);
});

test('admin can manage users and notes', async () => {
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin1234',
    role: 'admin',
    interests: ['coding', 'reading'],
  });

  adminUserId = adminUser._id.toString();
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'admin1234',
  });

  assert.equal(adminLogin.status, 200);
  adminToken = adminLogin.body.token;

  const createUserResponse = await request('/api/admin/users', 'POST', {
    name: 'Charlie User',
    email: 'charlie@example.com',
    password: 'charlie123',
    role: 'user',
    interests: ['chess', 'coding'],
  }, adminToken);

  assert.equal(createUserResponse.status, 201);

  const usersResponse = await request('/api/admin/users?page=1&limit=2', 'GET', null, adminToken);
  assert.equal(usersResponse.status, 200);
  assert.equal(usersResponse.body.page, 1);
  assert.ok(Array.isArray(usersResponse.body.data));

  const allNotesResponse = await request('/api/admin/notes?page=1&limit=10', 'GET', null, adminToken);
  assert.equal(allNotesResponse.status, 200);
  assert.ok(Array.isArray(allNotesResponse.body.data));
});

test('normal user cannot access admin endpoints', async () => {
  const response = await request('/api/admin/users', 'GET', null, userToken);
  assert.equal(response.status, 403);
});

test('group users by interests and posts lookup work', async () => {
  const groupResponse = await request('/api/admin/users/group-by-interests?page=1&limit=10', 'GET', null, adminToken);
  assert.equal(groupResponse.status, 200);
  assert.ok(Array.isArray(groupResponse.body.data));

  await Post.create({
    title: 'Public post',
    content: 'This post belongs to Alice.',
    userId: normalUserId,
  });

  const postsResponse = await request(`/api/users/${normalUserId}/posts?page=1&limit=10`, 'GET', null, userToken);
  assert.equal(postsResponse.status, 200);
  assert.ok(Array.isArray(postsResponse.body.posts));
  assert.ok(postsResponse.body.user);
});

test('duplicate emails and invalid credentials return the correct errors', async () => {
  const duplicateResponse = await request('/api/auth/register', 'POST', {
    name: 'Alice Duplicate',
    email: 'alice@example.com',
    password: 'duplicatepass',
  });

  assert.equal(duplicateResponse.status, 409);

  const invalidLogin = await request('/api/auth/login', 'POST', {
    email: 'alice@example.com',
    password: 'wrongpassword',
  });

  assert.equal(invalidLogin.status, 401);
});
