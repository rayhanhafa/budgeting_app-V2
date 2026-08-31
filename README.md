<div align="center">
  <h1>💰 Personal Budgeting App</h1>
  <p>A full-stack, secure, and automated personal finance manager built with React, Node.js, and PostgreSQL.</p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
</div>

<br />

## 📖 About The Project

This is a comprehensive, production-ready personal finance application designed to help users track their income, expenses, and savings goals across multiple accounts. The application features a robust backend architecture deployed via Serverless functions and a responsive, modern frontend UI.

It was built with a strong emphasis on **Security** (JWT, Rate Limiting, CORS, private registration), **Automation** (Serverless Cron Jobs for recurring transactions), and **Data Integrity** (Prisma ORM with strict relational constraints).

## ✨ Key Features

- **Multi-Account Management:** Track balances across Bank, Cash, and E-Wallet accounts.
- **Automated Recurring Transactions:** Set up daily, weekly, or monthly recurring bills. A Serverless Cron Job automatically processes them with a precise "catch-up" logic to prevent missed transactions.
- **Budgeting & Savings Goals:** Allocate monthly/weekly budgets per category and monitor real-time savings progression.
- **Advanced Transaction Handling:** Supports Income, Expense, and internal Transfers between accounts.
- **Enterprise-grade Security:** 
  - JWT-based authentication with secure HTTP headers.
  - Express Rate Limiting to prevent brute-force login attacks.
  - Hidden registration (`DISABLE_REGISTER` flag) for private/invite-only usage.
- **CSV Export:** Download all financial reports seamlessly.

---

## 🛠 Tech Stack & Architecture

### Frontend (Client)
- **Framework:** React.js + Vite for blazing-fast builds.
- **Styling:** Modern, responsive custom CSS architecture.
- **State Management:** React Context API for Global Auth state.
- **HTTP Client:** Axios with dynamic interceptors for token handling.

### Backend (Server)
- **Runtime:** Node.js + Express.js.
- **Database:** PostgreSQL (Hosted on Neon.tech).
- **ORM:** Prisma (Configured with global singleton pattern for serverless cold-starts).
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken`, `cors`, `express-rate-limit`.

### Infrastructure & Deployment
- **Frontend Hosting:** Vercel
- **Backend API:** Vercel Serverless Functions (`api/index.js` approach).
- **Automation:** Vercel Cron Jobs securely triggered via `CRON_SECRET` Bearer tokens.

---

## 🚀 Local Development Setup

To run this project locally, you need Node.js (v18+) and PostgreSQL installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/rayhanhafa/budgeting_app-V2.git
cd budgeting_app-V2
```

### 2. Setup Database & Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/budgeting_app"
JWT_SECRET="your_super_secret_key"
PORT=5000
DISABLE_REGISTER="false"
CRON_SECRET="local_test_secret"
```
Run migrations and seed the database:
```bash
npx prisma db push
npm run seed
npm run dev
```

### 3. Setup Frontend
Open a new terminal and navigate to the client folder:
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL="http://localhost:5000/api"
```
Start the frontend server:
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## ☁️ Production Deployment Guide

This app is optimized for a 100% free serverless architecture using **Vercel** and **Neon**.

### 1. Database Setup (Neon.tech)
1. Create a PostgreSQL project on [Neon.tech](https://neon.tech).
2. Copy the **Pooled Connection String** (`DATABASE_URL`) and the **Direct Connection String** (`DIRECT_URL`).

### 2. Seeding the Database
Before deploying, populate your production database from your local machine:
1. Temporarily replace your local `server/.env` `DATABASE_URL` with the Neon Pooled string.
2. Run `npx prisma db push` and `npm run seed`.
3. Save the generated temporary passwords for your accounts.

### 3. Backend Deployment (Vercel)
1. Import the project into Vercel.
2. Set the **Root Directory** to `server`.
3. Add the following Environment Variables:
   - `DATABASE_URL` (Neon Pooler)
   - `DIRECT_URL` (Neon Direct)
   - `JWT_SECRET` (Random secure string)
   - `CRON_SECRET` (Random secure string for cron auth)
   - `NODE_ENV` = `production`
   - `DISABLE_REGISTER` = `true`
4. Deploy! Vercel will automatically run `prisma generate && prisma migrate deploy` via the `postinstall` script.

### 4. Frontend Deployment (Vercel)
1. Import the project into Vercel again, but set the **Root Directory** to `client`.
2. Add the Environment Variable:
   - `VITE_API_URL` = `https://<your-backend-vercel-url>.vercel.app/api`
3. Deploy!

### 5. Finalize CORS
Return to your Backend Project on Vercel, add/update the `CLIENT_URL` environment variable to match your new Frontend Vercel URL (e.g., `https://<your-frontend>.vercel.app`), and hit **Redeploy**.

---

<div align="center">
  <i>Developed with ❤️ by <a href="https://github.com/rayhanhafa">Rayhan Hafa</a></i>
</div>
