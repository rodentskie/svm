# SVM Production Setup Guide

This guide helps you run SVM on your machine for production-like testing.

## 1) Prerequisites

- Make sure your local branch is up to date:

```bash
git pull origin main
```

- Docker and Docker Compose installed
- Node.js + npm installed
- Go installed
- Nx available through project scripts (`npx nx ...` is fine)

## 2) Create environment files

Create environment files in each project under `app/`, except `app/ws`.

Use each project's `.env.example` as the template:

```bash
cp app/<project>/.env.example app/<project>/.env
```

Projects that use `.env`:

- `app/api`
- `app/migrations`

Projects that use `.env.production`:

- `app/app`
- `app/kiosk`
- `app/student`

Example:

```bash
cp app/kiosk/.env.example app/kiosk/.env.production
cp app/student/.env.example app/student/.env.production
cp app/app/.env.example app/app/.env.production
```

## 3) Required environment values per project

Replace all values inside angle brackets (for example: `<ip>`).

### `app/api/.env`

Usually, only these values need to be customized:
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

### `app/app/.env.production`

```env
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
```

### `app/kiosk/.env.production`

```env
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
NEXT_PUBLIC_APP_URL=http://<ip>:4000
```

### `app/migrations/.env`

```env
DATABASE_URL=postgres://svm:superpw64@pg:5432/svm?sslmode=disable
```

### `app/student/.env.production`

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

If any service fails, check its `.env` file first, then re-run `bash tools/scripts/setup.sh`.

## 7) Raspberry Setup

Make sure the Raspberry Pi is connected to the same network (Ethernet or Wi-Fi) as your laptop/PC.

From your laptop/PC, connect to the Raspberry Pi over SSH:

```bash
ssh svm@<ip of raspberry>
```

Enter the Raspberry Pi password when prompted.

Then edit the kiosk startup script:

```bash
gedit ~/scripts/run_kiosk.sh
```

At the bottom of that file, replace the existing URL/IP with your **host machine IP** (the same `<ip>` used in this guide), then save.

```bash
crontab -e
```

Find the line that starts with `# @reboot ...` and uncomment it by removing `#`.

Save and exit. Reboot the Raspberry Pi to verify it auto-starts in kiosk mode.

```bash
sudo reboot now
```
### Note !!

Disable `crontab` when not in use. Just comment again the line with `@reboot` by adding `#` at the beginning.