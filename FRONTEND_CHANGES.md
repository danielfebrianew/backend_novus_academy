# Frontend Changes Required

## 1. Register — Hapus field `phoneNumber` dan `referralCode`

Request body register sekarang hanya:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

Field `phoneNumber` dan `referralCode` sudah dihapus dari backend. Hapus input form dan validasi terkait di frontend.

## 2. User Response — Field baru

Response dari `/auth/profile`, `/auth/login`, `/auth/register` sekarang include:
```json
{
  "id": 1,
  "name": "John",
  "email": "john@mail.com",
  "role": "ROLE_USER",
  "credits": 500,
  "userLevelId": null,
  "paketId": null,
  "userWallet": null,
  "userBonus": null,
  "userPoint": null,
  "userStatus": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Hapus:**
- `phoneNumber` — tidak ada lagi di response
- `referralCode` — tidak ada lagi di response

**Tambah (optional, tampilkan jika perlu):**
- `credits` — saldo credit user untuk generate video
- `userWallet`, `userBonus`, `userPoint` — data dari sistem PHP

## 3. Credit System — Generate Video

Setiap generate sekarang memotong credit:
- **Non-pro:** 1 credit per variasi video (`targetCount`)
- **Pro:** 20 credit per generate

Jika credit tidak cukup, backend return:
```json
{
  "statusCode": 400,
  "message": "Credit tidak cukup"
}
```

**Frontend harus:**
- Tampilkan sisa credit user di UI (dari `credits` di user response)
- Handle error 400 "Credit tidak cukup" — tampilkan pesan ke user
- (Optional) Cek credit sebelum submit generate, disable button jika tidak cukup

## 4. Active Job Response — Field baru `taskId`

`GET /generate-pro/active-job` sekarang return tambahan `taskId`:
```json
{
  "jobId": "...",
  "taskId": "...",
  "productName": "...",
  "thumbnailUrl": "...",
  "status": "processing",
  "createdAt": "..."
}
```
