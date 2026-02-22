# SVM Production Setup Guide

This guide helps you run SVM on your machine for production-like testing.

## 1) Prerequisites

- Make sure your local branch is up to date:

```bash
git pull origin main
```

- Docker and Docker Compose installed
- Node.js + npm installed
- Go insalled
- Nx available through project scripts (`npx nx ...` is fine)

## 2) Create `.env` files

Create a `.env` file in each app folder under `app/`, except `app/ws`.

Use each project's `.env.example` as template:

```bash
cp app/<project>/.env.example app/<project>/.env
```

Projects that need `.env`:

- `app/api`
- `app/app`
- `app/kiosk`
- `app/migrations`
- `app/student`

## 3) Required environment values per project

Replace all values inside angle brackets (example: `<ip>`).

### `app/api/.env`

Only these usually need your custom values:
- `PAYMONGO_PUBLIC_KEY`
- `PAYMONGO_SECRET_KEY`
- `CORS_ORIGINS`

```env
PAYMONGO_PUBLIC_KEY=<paymongo_test_public_key>
PAYMONGO_SECRET_KEY=<paymongo_test_secret_key>
PAYMONGO_API_URL=https://api.paymongo.com/v1
DATABASE_URL=postgres://svm:superpw64@pg:5432/svm?sslmode=disable
CORS_ORIGINS=http://<ip>:3000,http://<ip>:4000,http://<ip>:5000
```

### `app/app/.env`

```env
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
```

### `app/kiosk/.env`

```env
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
NEXT_PUBLIC_APP_URL=http://<ip>:4000
```

### `app/migrations/.env`

```env
DATABASE_URL=postgres://svm:superpw64@pg:5432/svm?sslmode=disable
```

### `app/student/.env`

```env
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
```

## 4) Where to get each value

- `<ip>` = your machine's local IP address
- `<paymongo_test_public_key>` = PayMongo → **Test mode** → Settings → Developers
- `<paymongo_test_secret_key>` = PayMongo → **Test mode** → Settings → Developers

## 5) Run the setup script

After all `.env` files are ready, run:

```bash
bash tools/scripts/setup.sh
```

## 6) Quick sanity check

After setup:

- API should be reachable at `http://<ip>:8000`
- Admin app should load at `http://<ip>:3000`
- Kiosk app should load at `http://<ip>:4000`
- Student app should load at `http://<ip>:5000`

If one service fails, check its `.env` first, then re-run `bash tools/scripts/setup.sh`.

