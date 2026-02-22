### Description

Guide to run it for production on your machine. (MacOS)

## Prerequistes

Update your codebase.

Run the command

```bash
git pull origin main
```

### .env file

There should be `.env` file on each project located inside `app/` folder except for `ws/`.
As template, copy the `.env.example` file into `.env`.

### api/

For API, the only thing you need to change are the ff:

`PAYMONGO_PUBLIC_KEY`, `PAYMONGO_SECRET_KEY`, `CORS_ORIGINS`

```
PAYMONGO_PUBLIC_KEY=<paymongo_test_public_key>
PAYMONGO_SECRET_KEY=<paymongo_test_secret_key>
PAYMONGO_API_URL=https://api.paymongo.com/v1
DATABASE_URL=postgres://svm:superpw64@pg:5432/svm?sslmode=disable
CORS_ORIGINS=http://<ip>:3000,http://<ip>:4000,http://<ip>:5000
```

### app/

```
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
```

### kiosk/

```
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
NEXT_PUBLIC_APP_URL=http://<ip>:4000
```

### migrations/

```
DATABASE_URL=postgres://svm:superpw64@pg:5432/svm?sslmode=disable
```

### student/

```
NEXT_PUBLIC_API_URL=http://<ip>:8000/v1
```

### Note:
Change anything inside `<>`.

`<ip>` = the IP address of the laptop
`<paymongo_test_public_key>` = get this in the Paymongo (switch to `test` mode) -> Settings -> Developers 
`paymongo_test_secret_key` = get this in the Paymongo (switch to `test` mode) -> Settings -> Developers 


### Setup

Once `.env` files are setup. Run the command.

```bash
bash tools/scripts/setup.sh
```

