# JossieDB — Equipment & Inventory Management System

A full-stack inventory and equipment management platform built for tracking, transferring, and maintaining equipment across multiple site locations.

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS v4
- Framer Motion (animations)
- Lucide React (icons)
- Socket.IO client (real-time updates)
- React Hot Toast

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (real-time events)
- JWT authentication
- Redis (caching)
- Winston (logging)

---

## Features

### Inventory Management
- View all inventory items as cards, grouped by item name (deduplicated across locations)
- Click any item to see a **location summary modal** — total quantity and per-location breakdown
- Add, edit, and delete items (admin only)
- Low-stock highlighting when quantity falls below minimum threshold
- Items support SKU, serial number, description, condition, and status tracking

### Location Transfers
- Request transfers of a specific quantity of an item from one location to another
- Approval workflow: **Pending → Approved → Completed**
- On completion, quantity is deducted from the source and added at the destination
  - If the item already exists at the destination, its quantity is incremented
  - If not, a new record is created at that location
- Reject transfers with a reason
- Real-time updates via Socket.IO when transfers are approved or completed

### Maintenance Tracking
- Schedule preventive, corrective, or inspection maintenance jobs for any item
- Assign a technician to each job (optional)
- Status lifecycle: **Scheduled → In Progress → Completed / Cancelled**
- Overdue detection — records past their scheduled date are highlighted in red
- Mark complete with technician notes recorded
- Summary stats: Active, Overdue, Completed, Total
- Searchable and filterable by status
- Delete records (admin only)

### Location Management
- Create and manage site locations
- Assign foremen to locations (restricts their inventory view to assigned sites)
- View all items at a given location

### User Management (Admin)
- Create, edit, and delete users
- Role-based access: **Admin**, **Supervisor**, **Foreman**
- Foremen are restricted to inventory and transfers at their assigned locations only

### Notifications
- In-app notifications for transfer requests, approvals, and rejections
- Mark notifications as read

### Analytics (Admin / Supervisor)
- Inventory overview — item counts, low-stock alerts
- Transfer activity over time
- Location utilization

### Audit Logs (Admin / Supervisor)
- Full audit trail of all create, update, delete, and status-change actions

### Projects
- Attach notes and context to ongoing site projects

---

## Role Permissions

| Action | Admin | Supervisor | Foreman |
|---|:---:|:---:|:---:|
| View inventory | ✓ | ✓ | ✓ (own locations) |
| Add / edit / delete items | ✓ | — | — |
| Request transfer | ✓ | ✓ | ✓ |
| Approve / reject transfer | ✓ | ✓ | — |
| Schedule maintenance | ✓ | — | — |
| Update maintenance status | ✓ | ✓ | ✓ |
| Manage users | ✓ | — | — |
| View analytics | ✓ | ✓ | — |
| View audit logs | ✓ | ✓ | — |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching)

### Installation

```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### Environment Variables

Create `server/.env`:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/jossiedb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379   # optional
```

> **Note on Redis (Caching):** Redis is highly recommended for production at scale, but the system is designed with a **graceful fallback**. If `REDIS_URL` is omitted or the Redis server goes offline, the application will automatically log a warning and fallback to direct database queries without crashing.

Create `.env` (frontend):

```env
VITE_API_URL=http://localhost:8000/api
```

### Running in Development

```bash
# From the project root — starts both frontend and backend
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:8000`

---

## Project Structure

```
Jossiedb/
├── src/                    # React frontend
│   ├── pages/              # Route-level page components
│   ├── components/         # Shared UI and feature components
│   ├── services/           # API call wrappers
│   ├── context/            # Auth, Socket, Theme providers
│   └── utils/              # Axios instance and helpers
└── server/
    └── src/
        ├── models/         # Mongoose models
        ├── routes/         # Express route handlers
        ├── services/       # Business logic layer
        ├── middlewares/    # Auth, location filter, error handling
        └── utils/          # Logger, cache, socket helpers
```
