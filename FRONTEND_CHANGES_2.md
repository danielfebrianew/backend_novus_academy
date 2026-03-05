# Frontend Changes Required (Part 2)

## 1. Deposits — Halaman Baru

### 1.1 List Bank (untuk dropdown)

```
GET /deposits/banks
```

Response:
```json
{
  "data": [
    { "bankId": 1, "bankName": "BANK BRI", "bankCode": "002" },
    { "bankId": 7, "bankName": "BANK BCA", "bankCode": "014" },
    ...
  ]
}
```

Gunakan untuk dropdown pilihan bank saat user membuat deposit.

### 1.2 Create Deposit

```
POST /deposits
Content-Type: multipart/form-data
```

| Field | Type | Keterangan |
|-------|------|-----------|
| `depositValue` | number | Jumlah deposit |
| `depositDescription` | string | Keterangan transfer |
| `bankCode` | string | Kode bank dari dropdown (misal `"014"`) |
| `buktiTransfer` | file | Foto/PDF bukti transfer (jpg, png, webp, pdf) |

Response:
```json
{
  "message": "Deposit berhasil dibuat",
  "data": {
    "depositId": 1,
    "userId": 5,
    "depositValue": "100000.00",
    "depositUnik": "347",
    "depositDescription": "Transfer BCA",
    "depositBankTransfer": 7,
    "depositStatus": 0,
    "buktiTransfer": "https://s3.../uploads/xxx.jpg",
    "depositCreateDate": "..."
  }
}
```

### 1.3 List Deposit User

```
GET /deposits
```

Response termasuk data bank:
```json
{
  "data": [
    {
      "depositId": 1,
      "depositValue": "100000.00",
      "depositDescription": "Transfer BCA",
      "depositStatus": 0,
      "buktiTransfer": "https://s3.../uploads/xxx.jpg",
      "bank": {
        "bankId": 7,
        "bankName": "BANK BCA",
        "bankCode": "014"
      },
      "depositCreateDate": "..."
    }
  ]
}
```

### 1.4 Detail Deposit

```
GET /deposits/:id
```

### 1.5 Update Status Deposit (Admin)

```
PATCH /deposits/:id/status
Content-Type: application/json

{ "status": 1 }
```

### 1.6 Status Deposit
- `0` = Pending (baru dibuat, menunggu verifikasi)
- `1` = Approved (sudah diverifikasi admin)

---

## 2. History Saldo — Halaman Baru

### 2.1 List History Saldo

```
GET /history-saldo
```

Response:
```json
{
  "data": [
    {
      "historySaldoId": 1,
      "userId": 5,
      "historySaldoValue": "100000.00",
      "historySaldoKeterangan": "Deposit via BCA",
      "historySaldoType": "d",
      "historySaldoRef": "DEP-001",
      "historySaldoDate": "2026-03-05",
      "historySaldoStatus": 1,
      "historySaldoCreateDate": "..."
    }
  ]
}
```

### 2.2 Detail History Saldo

```
GET /history-saldo/:id
```

### 2.3 Tipe History Saldo
- `"d"` = Deposit (saldo masuk)
- `"k"` = Kredit (saldo keluar)

### 2.4 Status History Saldo
- `1` = Pending
- `2` = Approved

---

## 3. Status Reference (Semua Module)

| Field | Value | Keterangan |
|-------|-------|-----------|
| `depositStatus` | `0` = pending, `1` = approved | Status deposit |
| `historySaldoStatus` | `1` = pending, `2` = approved | Status history saldo |
| `historySaldoType` | `"d"` = deposit, `"k"` = kredit | Tipe transaksi |
| `aktivasiStatus` | `true`/`false` | Status aktivasi user |
| `userStatus` | `1` = aktif, `0` = dihapus | Status user |

---

## 4. Database Column Convention

Semua kolom database sekarang menggunakan **UPPER_SNAKE_CASE** (misal `USER_ID`, `DEPOSIT_VALUE`, `BANK_CODE`). Tapi di API response tetap **camelCase** (misal `userId`, `depositValue`, `bankCode`). Frontend tidak perlu berubah untuk ini.
