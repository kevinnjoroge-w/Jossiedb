# Construction Company Inventory Database

A full-featured inventory management system for construction companies using Node.js, Express, Sequelize, and SQLite with JWT authentication and role-based access control.

## Features

- **User Authentication**: JWT-based login system
- **Role-Based Access Control**: Admin and Personnel roles
- **Inventory Management**: Track office equipment and construction tools
- **Location Tracking**: Manage multiple locations (warehouses, sites, etc.)
- **Real-time Updates**: Change item locations and quantities
- **Responsive UI**: Bootstrap-based modern interface
- **RESTful API**: Well-structured API endpoints
- **Data Validation**: Input validation with Joi
- **Security**: Helmet, CORS, and secure practices
- **Scalable Architecture**: MVC pattern with Sequelize ORM

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: EJS templates with Bootstrap
- **Validation**: Joi
- **Security**: Helmet, CORS, Morgan logging

## Setup

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Initialize the database with sample data**:
   ```
   npm run init
   ```

3. **Start the development server**:
   ```
   npm run dev
   ```

   Or for production:
   ```
   npm start
   ```

4. **Access the application**:
   Open your browser and go to `http://localhost:3002`

## Usage

### Login Credentials

- **Admin**: username `admin`, password `adminpass`
- **Personnel**: username `personnel1`, password `personnelpass`

### Admin Features

- View all inventory items
- Filter items by location
- Add new items
- Update item quantities
- Add new locations
- Change item locations

### Personnel Features

- View all inventory items
- Filter by location
- Change item locations (to track movement between sites)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Items
- `GET /api/items` - Get all items (authenticated)
- `POST /api/items` - Creanpm startte new item (admin)
- `PUT /api/items/:id/location` - Update item location (authenticated)
- `PUT /api/items/:id/quantity` - Update item quantity (admin)

### Locations
- `GET /api/locations` - Get all locations (authenticated)
- `POST /api/locations` - Create new location (admin)

### Categories & Suppliers
- `GET /api/categories` - Get all categories (authenticated)
- `GET /api/suppliers` - Get all suppliers (authenticated)

## Database Schema

- **Users**: id, username, password, role
- **Categories**: id, name
- **Suppliers**: id, name, contact
- **Locations**: id, name
- **Items**: id, name, description, quantity, category_id, supplier_id, location_id

## Project Structure

```
jossiedb/
├── models/          # Sequelize models
├── routes/          # API routes
├── controllers/     # Business logic
├── middleware/      # Auth middleware
├── views/           # EJS templates
├── public/          # Static files
├── scripts/         # Database initialization
├── server.js        # Main application file
└── package.json
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Helmet for security headers
- CORS configuration
- Input validation and sanitization
- Role-based access control

## Development

- Use `npm run dev` for development with nodemon
- Environment variables can be set in `.env` file
- Database is SQLite for easy development and deployment

This system is designed to handle multiple users efficiently and can be easily extended with additional features like user management, reporting, or integration with other systems.# Jossiedb
