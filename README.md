

# Shopifake B2C Customer Microservice

This microservice manages customer profiles for B2C (Business to Customer) applications.

- Customer profile management (view, edit)
- Customer administration (CRUD)
- Service and database status check via `/healthz`

Developed with Node.js, TypeScript, Express, and Prisma (PostgreSQL).

## Features

- **Customer Profile Management:** Customers can view and update their personal information.
- **Customer Administration:** Full CRUD for customers (create, read, update, delete).
- **Authentication:** JWT authentication (BetterAuth compatible).
- **Healthcheck Endpoint:** `/healthz` to check service and database status.

## How It Works

- **Authentication:** Protected routes require a valid JWT token (signed with the BetterAuth secret).
- **Database:** Uses Prisma ORM to interact with a PostgreSQL database.
- **Endpoints:** REST routes allow customer management and profile updates.
- **Healthcheck:** The `/healthz` route checks service and database availability.

## Test Strategy

This project uses **Jest** for unit and integration testing. The test strategy covers:

- **Middlewares:**
   - `checkAuth`: Ensures authentication logic (valid/invalid tokens, user payload).
- **Routes:**
   - `customers`: Tests customer management endpoints (get, create, update, delete) with mocked database and authentication.

**Mocking:**
- External dependencies (Prisma, Express) are mocked to isolate business logic.
- Environment variables are simulated in tests.

**How to run tests:**
```bash
npm run test
```

## Endpoints

- `GET /api/customers/me` — Get current customer's profile
- `PUT /api/customers/me` — Update current customer's profile
- `GET /api/customers` — List all customers
- `POST /api/customers` — Create a new customer
- `GET /api/customers/:id` — Get a customer by ID
- `PUT /api/customers/:id` — Update a customer
- `DELETE /api/customers/:id` — Delete a customer
- `GET /healthz` — Healthcheck for service and database

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure the `.env` file:**
   Copy `.env.template` to `.env` and fill in your PostgreSQL credentials and JWT secret.
3. **Run Prisma migrations:**
   ```bash
   npm run db:push
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```
5. **Start the service:**
   ```bash
   npm start
   ```
