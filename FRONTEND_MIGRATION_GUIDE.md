# Backend Migration Guide - JWT Authentication & Data Isolation

**Tanggal:** 7 Februari 2026
**Ringkasan:** Migrasi dari session-based authentication ke JWT authentication + implementasi data isolation per user

---

## 🔴 Breaking Changes

### 1. Authentication Method Changed: Session → JWT

**SEBELUM (Session-based):**
- Backend set cookie session otomatis
- Frontend tidak perlu kirim token
- User data di `req.session.user`

**SEKARANG (JWT-based):**
- Backend return JWT tokens di response body
- Frontend HARUS kirim `Authorization: Bearer <token>` di setiap request
- User data di `req.user`

---

## 📋 Migration Checklist untuk Frontend

### ✅ Step 1: Update Login Flow

**Endpoint:** `POST /auth/login`

**Response Format (TIDAK BERUBAH, tapi sekarang wajib simpan token!):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    },
    "expiresIn": 900
  }
}
```

**Frontend Action Required:**
```javascript
// ❌ SEBELUM - Tidak perlu simpan apapun, cookie otomatis
async function login(email, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  // Cookie otomatis tersimpan, done!
}

// ✅ SEKARANG - WAJIB simpan accessToken & refreshToken
async function login(email, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const { data } = await response.json();

  // Simpan tokens (pilih salah satu strategi):

  // Option 1: Memory + localStorage (Recommended untuk Web)
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  // Option 2: Electron Store (Recommended untuk Electron)
  store.set('accessToken', data.accessToken);
  store.set('refreshToken', data.refreshToken);

  // Option 3: Zustand/Redux (Runtime memory)
  authStore.setTokens(data.accessToken, data.refreshToken);
}
```

---

### ✅ Step 2: Update All API Requests

**Frontend WAJIB kirim Authorization header:**

```javascript
// ❌ SEBELUM - Tidak perlu header apapun
fetch('/gallery/jobs', {
  method: 'GET'
});

// ✅ SEKARANG - WAJIB kirim Authorization header
const accessToken = localStorage.getItem('accessToken');

fetch('/gallery/jobs', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

**Recommended: Buat Axios Interceptor atau Fetch Wrapper**

```javascript
// Example dengan Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// Request interceptor - otomatis inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh token
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry request dengan token baru
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } else {
        // Refresh gagal, redirect ke login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### ✅ Step 3: Implement Token Refresh

**Endpoint:** `POST /auth/refresh`

```javascript
async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');

    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }) // Untuk Electron
      // Atau biarkan kosong untuk Web (ambil dari cookie)
    });

    const { data } = await response.json();

    // Simpan accessToken baru
    localStorage.setItem('accessToken', data.accessToken);

    return data.accessToken;
  } catch (error) {
    // Refresh gagal, hapus tokens dan redirect ke login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
}
```

**Token Lifecycle:**
- `accessToken`: Expired dalam **15 menit**
- `refreshToken`: Expired dalam **7 hari**

**Recommended Flow:**
1. Simpan `accessToken` di memory/localStorage
2. Simpan `refreshToken` di localStorage/electron-store (lebih secure)
3. Set interval untuk auto-refresh setiap 14 menit
4. Atau handle 401 error untuk refresh on-demand

---

### ✅ Step 4: Update Logout Flow

**Endpoint:** `POST /auth/logout`

```javascript
// ✅ Frontend harus kirim refreshToken untuk invalidate
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');

  await fetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  // Hapus tokens dari storage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Redirect ke login
  window.location.href = '/login';
}
```

---

## 🔐 Endpoints yang Sekarang Protected dengan JWT

Semua endpoints berikut **WAJIB** kirim `Authorization: Bearer <token>`:

### Gallery Module
- `GET /gallery/jobs` - List semua jobs milik user
- `GET /gallery/jobs/:jobId` - Detail job
- `DELETE /gallery/jobs/:jobId` - Delete job
- `DELETE /gallery/videos/:videoId` - Delete video

### History Module
- `GET /history` - Riwayat aktivitas user

### Generate Video Module
- `POST /generate/text` - Generate text dari gambar
- `POST /generate/video` - Generate video
- `POST /generate/upload` - Upload gambar
- `SSE /generate/progress/:jobId` - Stream progress

### Reports Module
- `GET /reports/view-tiktok` - View TikTok analytics

### **Accounts Module** ⚠️ **MAJOR CHANGES**
- `GET /accounts` - **SEKARANG RETURN HANYA ACCOUNTS MILIK USER SENDIRI**
- `GET /accounts/:id` - **Validasi ownership (403 jika bukan pemilik)**
- `POST /accounts` - Create account baru (auto assign ke user login)
- `PATCH /accounts/:id` - **Validasi ownership (403 jika bukan pemilik)**
- `DELETE /accounts/:id` - **Validasi ownership (403 jika bukan pemilik)**

---

## 🔥 Major Behavior Changes - Accounts Module

### SEBELUM:
```javascript
// GET /accounts - Return SEMUA accounts dari SEMUA user
{
  "success": true,
  "data": [
    { "id": 1, "username": "user1_tiktok", "userId": 1 },
    { "id": 2, "username": "user2_tiktok", "userId": 2 }, // ❌ User lain
    { "id": 3, "username": "user3_tiktok", "userId": 3 }  // ❌ User lain
  ]
}

// User A bisa DELETE account milik User B ❌
DELETE /accounts/2 // SUKSES (BAHAYA!)
```

### SEKARANG:
```javascript
// GET /accounts - Return HANYA accounts milik user login
{
  "success": true,
  "data": [
    { "id": 1, "username": "my_tiktok_1", "userId": 1 },
    { "id": 4, "username": "my_tiktok_2", "userId": 1 }
  ]
  // ✅ User 2 dan 3 punya tidak muncul!
}

// User A coba DELETE account milik User B
DELETE /accounts/2
// Response: 403 Forbidden
{
  "success": false,
  "message": "Anda tidak memiliki akses ke akun ini"
}
```

**Frontend Impact:**
- Dropdown account selector sekarang hanya show accounts milik user login
- Tidak perlu filter manual di frontend
- Tidak bisa akses/edit/delete account user lain (akan dapat 403)

---

## 📝 Complete Example - Frontend Integration

```javascript
// auth.js - Authentication utilities
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:3000';
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      return result.data;
    }

    throw new Error(result.message);
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('accessToken', result.data.accessToken);
      return result.data.accessToken;
    }

    throw new Error('Refresh token failed');
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');

    await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }
}

// api.js - API client dengan auto token injection
class ApiClient {
  constructor(authService) {
    this.authService = authService;
    this.baseURL = 'http://localhost:3000';
  }

  async request(endpoint, options = {}) {
    const token = this.authService.getAccessToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };

    let response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Handle 401 - Token expired
    if (response.status === 401) {
      try {
        // Refresh token
        await this.authService.refreshToken();

        // Retry request dengan token baru
        const newToken = this.authService.getAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}${endpoint}`, config);
      } catch (error) {
        // Refresh gagal, redirect ke login
        this.authService.logout();
        window.location.href = '/login';
        throw error;
      }
    }

    return response.json();
  }

  // Shorthand methods
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Usage example
const authService = new AuthService();
const api = new ApiClient(authService);

// Login
await authService.login('user@example.com', 'password123');

// Fetch accounts (otomatis inject token)
const accounts = await api.get('/accounts');
console.log(accounts); // Hanya accounts milik user login

// Create account
await api.post('/accounts', {
  username: 'my_tiktok_account',
  email: 'tiktok@example.com'
});

// Logout
await authService.logout();
```

---

## ⚠️ Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 Unauthorized | Token tidak ada/invalid/expired | Refresh token atau redirect ke login |
| 403 Forbidden | User tidak punya akses ke resource (e.g., account bukan miliknya) | Show error message "Akses ditolak" |
| 404 Not Found | Resource tidak ditemukan | Show error "Data tidak ditemukan" |
| 429 Too Many Requests | Rate limit exceeded | Show error "Terlalu banyak request, coba lagi nanti" |

**Example Error Response:**
```json
{
  "success": false,
  "message": "Anda tidak memiliki akses ke akun ini",
  "statusCode": 403
}
```

---

## 🧪 Testing Checklist

### Manual Testing Steps:

1. **Test Login Flow**
   - ✅ Login berhasil dapat accessToken & refreshToken
   - ✅ Tokens tersimpan di storage
   - ✅ User data tersimpan

2. **Test Protected Endpoints**
   - ✅ Request tanpa token → 401 Unauthorized
   - ✅ Request dengan token valid → 200 OK
   - ✅ Request dengan token expired → Auto refresh → 200 OK

3. **Test Account Isolation**
   - ✅ User A hanya lihat accounts milik User A
   - ✅ User B hanya lihat accounts milik User B
   - ✅ User A tidak bisa edit/delete account User B (403)

4. **Test Token Refresh**
   - ✅ Refresh token sebelum accessToken expired → Berhasil
   - ✅ Refresh token setelah refreshToken expired → Redirect ke login

5. **Test Logout**
   - ✅ Tokens terhapus dari storage
   - ✅ Request setelah logout → 401 Unauthorized

---

## 📚 Additional Notes

### Security Recommendations:
1. **Jangan simpan tokens di cookies untuk Electron app** (gunakan electron-store)
2. **Untuk web app**, simpan refreshToken di httpOnly cookie (backend sudah handle ini)
3. **Clear tokens saat logout** untuk prevent unauthorized access
4. **Implement auto-refresh** untuk better UX (user tidak perlu login ulang tiap 15 menit)

### Performance Tips:
1. **Batch requests** jika perlu fetch multiple resources
2. **Cache user data** di frontend untuk reduce API calls
3. **Use SSE** untuk real-time updates (e.g., `/generate/progress/:jobId`)

---

## 📞 Need Help?

Jika ada masalah saat migrasi:
1. Check console untuk error messages
2. Verify token tersimpan di localStorage/storage
3. Check Network tab untuk melihat request headers
4. Pastikan Authorization header format benar: `Bearer <token>`

---

**Generated by:** Claude Code
**Backend Version:** v2.0 (JWT Authentication)
**Breaking Changes:** Yes - Requires frontend migration
