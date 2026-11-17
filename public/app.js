const state = {
  token: localStorage.getItem('token') || '',
  user: null,
};

const els = {
  registerPanel: document.getElementById('register-panel'),
  loginPanel: document.getElementById('login-panel'),
  dashboardSection: document.getElementById('dashboard-section'),
  adminSection: document.getElementById('admin-section'),
  profileBox: document.getElementById('profile-box'),
  notesList: document.getElementById('notes-list'),
  adminUsersList: document.getElementById('admin-users-list'),
  adminNotesList: document.getElementById('admin-notes-list'),
  interestGroups: document.getElementById('interest-groups'),
  authSection: document.getElementById('auth-section'),
};

const setMessage = (element, message, type = 'error') => {
  element.innerHTML = `<div class="${type}">${message}</div>`;
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'Something went wrong.');
  }

  return body;
};

const updateVisibleSections = () => {
  const isLoggedIn = !!state.token;
  const isAdmin = state.user && state.user.role === 'admin';

  els.registerPanel.classList.toggle('hidden', isLoggedIn);
  els.loginPanel.classList.toggle('hidden', isLoggedIn);
  els.dashboardSection.classList.toggle('hidden', !isLoggedIn);
  els.adminSection.classList.toggle('hidden', !(isLoggedIn && isAdmin));
  els.authSection.classList.toggle('hidden', isLoggedIn);

  if (!isLoggedIn) {
    els.profileBox.innerHTML = '';
    els.notesList.innerHTML = '';
  }
};

const loadCurrentUser = async () => {
  if (!state.token) {
    state.user = null;
    updateVisibleSections();
    return;
  }

  try {
    const data = await apiRequest('/api/auth/me');
    state.user = data.user;
    updateVisibleSections();
    renderProfile();
    loadMyNotes();
    if (state.user.role === 'admin') {
      loadAdminUsers();
      loadAdminNotes();
      loadInterestGroups();
    }
  } catch (error) {
    console.error(error);
    logout();
  }
};

const renderProfile = () => {
  if (!state.user) {
    els.profileBox.innerHTML = '';
    return;
  }

  els.profileBox.innerHTML = `
    <p><strong>Name:</strong> ${state.user.name}</p>
    <p><strong>Email:</strong> ${state.user.email}</p>
    <p><strong>Role:</strong> ${state.user.role}</p>
    <p><strong>Interests:</strong> ${(state.user.interests || []).join(', ') || 'None'}</p>
  `;
};

const logout = () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('token');
  updateVisibleSections();
  els.notesList.innerHTML = '';
  els.adminUsersList.innerHTML = '';
  els.adminNotesList.innerHTML = '';
  els.interestGroups.innerHTML = '';
};

document.getElementById('show-register').addEventListener('click', () => {
  els.registerPanel.classList.remove('hidden');
  els.loginPanel.classList.add('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
  els.loginPanel.classList.remove('hidden');
  els.registerPanel.classList.add('hidden');
});

document.getElementById('show-dashboard').addEventListener('click', () => {
  if (state.token) {
    updateVisibleSections();
  }
});

document.getElementById('show-admin').addEventListener('click', () => {
  if (state.user && state.user.role === 'admin') {
    updateVisibleSections();
  }
});

document.getElementById('logout-btn').addEventListener('click', logout);

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById('register-name').value,
    email: document.getElementById('register-email').value,
    password: document.getElementById('register-password').value,
    interests: document.getElementById('register-interests').value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  };

  try {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    state.token = data.token;
    localStorage.setItem('token', data.token);
    state.user = data.user;
    updateVisibleSections();
    renderProfile();
    loadMyNotes();
  } catch (error) {
    setMessage(document.getElementById('register-panel'), error.message, 'error');
  }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });

    state.token = data.token;
    localStorage.setItem('token', data.token);
    state.user = data.user;
    updateVisibleSections();
    renderProfile();
    loadMyNotes();
  } catch (error) {
    setMessage(document.getElementById('login-panel'), error.message, 'error');
  }
});

document.getElementById('create-note-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/api/notes', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
      }),
    });

    document.getElementById('create-note-form').reset();
    loadMyNotes();
  } catch (error) {
    setMessage(document.getElementById('notes-list'), error.message, 'error');
  }
});

const loadMyNotes = async () => {
  if (!state.token) return;

  try {
    const data = await apiRequest('/api/notes?page=1&limit=20');
    const notes = data.data || [];

    if (!notes.length) {
      els.notesList.innerHTML = '<p>No notes found.</p>';
      return;
    }

    els.notesList.innerHTML = notes
      .map(
        (note) => `
          <div class="note-item">
            <h4>${note.title}</h4>
            <p>${note.content}</p>
            <div class="note-actions">
              <button class="inline-button" data-action="edit" data-id="${note._id}">Edit</button>
              <button class="small-button" data-action="delete" data-id="${note._id}">Delete</button>
            </div>
          </div>
        `
      )
      .join('');

    document.querySelectorAll('[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        try {
          await apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
          loadMyNotes();
        } catch (error) {
          setMessage(els.notesList, error.message, 'error');
        }
      });
    });

    document.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        const note = notes.find((item) => item._id === id);
        const newTitle = prompt('Update title', note.title);
        const newContent = prompt('Update content', note.content);

        if (!newTitle || !newContent) return;

        try {
          await apiRequest(`/api/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: newTitle, content: newContent }),
          });
          loadMyNotes();
        } catch (error) {
          setMessage(els.notesList, error.message, 'error');
        }
      });
    });
  } catch (error) {
    setMessage(els.notesList, error.message, 'error');
  }
};

const loadAdminUsers = async () => {
  if (!state.user || state.user.role !== 'admin') return;

  try {
    const data = await apiRequest('/api/admin/users?page=1&limit=20');
    const users = data.data || [];

    els.adminUsersList.innerHTML = users
      .map(
        (user) => `
          <div class="user-item">
            <p><strong>${user.name}</strong> (${user.role})</p>
            <p>${user.email}</p>
            <div class="note-actions">
              <button data-user-action="delete" data-user-id="${user._id}">Delete</button>
            </div>
          </div>
        `
      )
      .join('');

    document.querySelectorAll('[data-user-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.userId;
        try {
          await apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
          loadAdminUsers();
        } catch (error) {
          setMessage(els.adminUsersList, error.message, 'error');
        }
      });
    });
  } catch (error) {
    setMessage(els.adminUsersList, error.message, 'error');
  }
};

const loadAdminNotes = async () => {
  if (!state.user || state.user.role !== 'admin') return;

  try {
    const data = await apiRequest('/api/admin/notes?page=1&limit=20');
    const notes = data.data || [];

    els.adminNotesList.innerHTML = notes
      .map(
        (note) => `
          <div class="note-item">
            <p><strong>Title:</strong> ${note.title}</p>
            <p><strong>Owner:</strong> ${note.userId?.name || 'Unknown'}</p>
            <p>${note.content}</p>
          </div>
        `
      )
      .join('');
  } catch (error) {
    setMessage(els.adminNotesList, error.message, 'error');
  }
};

const loadInterestGroups = async () => {
  if (!state.user || state.user.role !== 'admin') return;

  try {
    const data = await apiRequest('/api/admin/users/group-by-interests?page=1&limit=20');
    const groups = data.data || [];

    els.interestGroups.innerHTML = groups
      .map(
        (group) => `
          <div class="group-item">
            <p><strong>Interest:</strong> ${group._id}</p>
            <p>Users: ${group.users.join(', ')}</p>
          </div>
        `
      )
      .join('');
  } catch (error) {
    setMessage(els.interestGroups, error.message, 'error');
  }
};

document.getElementById('admin-create-user-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('admin-user-name').value,
        email: document.getElementById('admin-user-email').value,
        password: document.getElementById('admin-user-password').value,
        role: document.getElementById('admin-user-role').value,
        interests: document.getElementById('admin-user-interests').value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    document.getElementById('admin-create-user-form').reset();
    loadAdminUsers();
  } catch (error) {
    setMessage(els.adminUsersList, error.message, 'error');
  }
});

updateVisibleSections();
loadCurrentUser();
