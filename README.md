# Multi-Branch Mobile Service Management System

A comprehensive mobile service/repair management platform with multi-tenant support.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- Socket.IO Client

### Backend
- Node.js + Express.js (TypeScript)
- PostgreSQL
- Prisma ORM
- JWT + Refresh Tokens
- bcrypt
- Socket.IO + Redis Pub/Sub

### File Storage
- AWS S3 / Cloudflare R2 / DigitalOcean Spaces

## Project Structure

```
deenmobiles/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   └── prisma/
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
└── README.md
```

## Features

- Multi-tenant architecture (company & branch isolation)
- Role-based access control (Admin, Manager, Technician, Receptionist)
- Service/Repair ticket management
- Customer management
- Inventory & parts tracking
- Invoice generation & payment processing
- Real-time notifications
- File uploads (service images, invoices, reports)

## Getting Started

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your database connection in .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## License

MIT
