# Railway Database Setup Guide

## 🚀 Setting up Railway Database Connection

### Step 1: Get Railway Database Connection String

1. Go to your Railway dashboard: https://railway.app
2. Select your project
3. Click on your PostgreSQL database service
4. Go to the "Connect" tab
5. Copy the "Postgres Connection URL" (it should look like: `postgresql://postgres:password@host:port/railway`)

### Step 2: Update .env File

Replace the current DATABASE_URL in your `.env` file with the Railway connection string:

```env
# Replace this line:
DATABASE_URL="postgresql://user:password@localhost:5432/swrfph-db?schema=public"

# With your Railway connection string (add ?schema=public at the end):
DATABASE_URL="postgresql://postgres:your_password@your_host:your_port/railway?schema=public"
```

### Step 3: Run Database Setup

After updating the .env file, run these commands:

```bash
# Push the database schema to Railway
npx prisma db push

# Seed the database with test accounts
node seed-test-accounts.js
```

### Step 4: Test Accounts

The seeding script will create these test accounts:

- **Admin**: `admin@swrfph.com` / `admin123`
- **Provider**: `provider@swrfph.com` / `provider123`

### Troubleshooting

If you get connection errors:

1. Make sure the Railway database is running
2. Check that the connection string is complete and correct
3. Ensure the database service is accessible from your IP
4. Verify the password and credentials are correct

### Example Railway Connection String

```
postgresql://postgres:AbCdEfGhIjKlMnOp@containers-us-west-123.railway.app:6543/railway?schema=public
```

Make sure to replace with your actual Railway credentials!
