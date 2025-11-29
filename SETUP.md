# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher) - Optional for real-time features
- npm or yarn package manager

## Step 1: Clone and Install Dependencies

```bash
# Navigate to the project directory
cd deenmobiles

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Database Setup

### Create PostgreSQL Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE deenmobiles;

-- Create user (optional)
CREATE USER deenmobiles_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE deenmobiles TO deenmobiles_user;
```

### Configure Database Connection

1. Copy the environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` and update the `DATABASE_URL`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/deenmobiles?schema=public"
```

Replace `username`, `password` with your PostgreSQL credentials.

### Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Step 3: Configure Environment Variables

### Backend Configuration

Edit `backend/.env` and update:

```env
# JWT Secrets - Generate strong secrets for production
JWT_ACCESS_SECRET=your-super-secret-access-token
JWT_REFRESH_SECRET=your-super-secret-refresh-token

# File Storage (if using cloud storage)
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=your-bucket-name

# Redis (if using real-time features)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

The default values should work for local development.

## Step 4: Seed Initial Data (Optional)

Create a super admin user to access the system:

```bash
cd backend
# Create a seed script or use Prisma Studio
npx prisma studio
```

In Prisma Studio:
1. Open the `Company` table and create a company
2. Open the `User` table and create a user with:
   - email: admin@deenmobiles.com
   - password: (hash using bcrypt - see below)
   - role: SUPER_ADMIN
   - companyId: (the ID from step 1)

### Generate Password Hash

```javascript
// Run this in Node.js REPL or create a temp script
const bcrypt = require('bcrypt');
const password = 'your-password';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

## Step 5: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Backend will run on: http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on: http://localhost:5173

## Step 6: Verify Installation

1. Open browser and navigate to http://localhost:5173
2. You should see the login page
3. Test the health check endpoint: http://localhost:5000/health

## Next Steps

### Development Workflow

1. **Backend Development**
   - Controllers: `backend/src/controllers/`
   - Routes: `backend/src/routes/`
   - Services: `backend/src/services/`
   - Middleware: `backend/src/middleware/`

2. **Frontend Development**
   - Pages: `frontend/src/pages/`
   - Components: `frontend/src/components/`
   - State: `frontend/src/store/`
   - API Services: `frontend/src/services/`

3. **Database Changes**
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name your_migration_name
   npx prisma generate
   ```

### Production Deployment

1. Update environment variables with production values
2. Set `NODE_ENV=production`
3. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
4. Run database migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
5. Start the production server:
   ```bash
   cd backend
   npm run build
   npm start
   ```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format
- Ensure database exists: `psql -l`

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### Prisma Issues
- Clear generated files: `rm -rf node_modules/.prisma`
- Regenerate: `npx prisma generate`

## Support

For issues or questions, please check the documentation or create an issue in the repository.
