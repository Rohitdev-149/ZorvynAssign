# Financial Management System - Backend API Documentation

**Version:** 1.0.0  
**Date:** April 5, 2025  
**Base URL:** `http://localhost:5000/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Role-Based Access Control](#role-based-access-control)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
6. [Data Models](#data-models)
7. [Validation Rules](#validation-rules)
8. [Error Handling](#error-handling)
9. [Setup & Deployment](#setup--deployment)

---

## Overview

The Financial Management System is a RESTful backend API for managing users, financial records, and dashboard analytics. Built with Node.js, Express, and MongoDB, it implements comprehensive role-based access control and validation.

### Key Features

- User management with role assignments (Viewer, Analyst, Admin)
- Financial record CRUD operations with filtering
- Dashboard analytics with aggregated financial data
- JWT-based authentication
- Input validation with Joi
- Soft delete functionality
- Role-based authorization middleware

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcryptjs |
| Validation | Joi |
| API Documentation | Swagger/OpenAPI 3.0 |
| Security Helmet, CORS |

---

## Role-Based Access Control

### Role Definitions

| Role | Permissions |
|------|-------------|
| **Viewer** | - View dashboard only<br>- Cannot access financial records<br>- Cannot manage users |
| **Analyst** | - View dashboard<br>- Create, read, update, delete **own** financial records<br>- Cannot manage users |
| **Admin** | - View dashboard<br>- Full access to **all** financial records (any user)<br>- Full user management (create, read, update, delete, assign roles, activate/deactivate) |

### Role Assignment

- **Self-registration**: Users can only self-register as `Viewer` role
- **Admin privileges**: Only admins can assign or change roles
- **Role protection**: Implemented via middleware at route level

---

## Authentication

### JWT Token Flow

1. **Register**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login` → Returns JWT token
3. **Authenticated Requests**: Include token in `Authorization` header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```
4. **Token Expiry**: Configurable via `JWT_EXPIRES_IN` (default: 7 days)

### Authentication Middleware

All protected routes require the `authenticate` middleware, which:
- Verifies JWT token
- Attaches user object to `req.user`
- Validates account status (must be `active`)
- Returns `401` for invalid/expired tokens

---

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
```

**Description:** Creates a new user account (self-registration limited to Viewer role)

**Headers:** None (public endpoint)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "viewer"  // optional, defaults to viewer; ignored if provided with other values
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "viewer",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

---

#### Login
```http
POST /api/v1/auth/login
```

**Description:** Authenticates user and returns JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "viewer",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

#### Get Profile
```http
GET /api/v1/auth/profile
```

**Description:** Returns the authenticated user's profile

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "viewer",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### User Management

**All user management endpoints require ADMIN role**

#### Get All Users
```http
GET /api/v1/users
```

**Description:** Retrieve paginated list of all users with optional filters

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page, max 100 (default: 10) |
| `status` | string | No | Filter by status: `active` or `inactive` |
| `role` | string | No | Filter by role: `viewer`, `analyst`, or `admin` |
| `search` | string | No | Search in name or email (case-insensitive) |

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "analyst",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:25:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false
    }
  }
}
```

---

#### Get User By ID
```http
GET /api/v1/users/:id
```

**Description:** Retrieve user details by ID. Users can access their own profile; admins can access any user.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - User MongoDB ID

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "analyst",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:25:00.000Z"
    },
    "stats": {
      "recordCount": 42
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

---

#### Assign Role to User
```http
PATCH /api/v1/users/:id/role
```

**Description:** Assign or change user role (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - User MongoDB ID

**Request Body:**
```json
{
  "role": "admin"
}
```

**Valid roles:** `viewer`, `analyst`, `admin`

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role assigned successfully",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active"
    }
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot change your own admin role"
}
```

---

#### Update User Status
```http
PATCH /api/v1/users/:id/status
```

**Description:** Activate or deactivate a user account (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - User MongoDB ID

**Request Body:**
```json
{
  "status": "inactive"
}
```

**Valid statuses:** `active`, `inactive`

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "analyst",
      "status": "inactive"
    }
  }
}
```

---

#### Delete User (Deactivate)
```http
DELETE /api/v1/users/:id
```

**Description:** Soft delete/deactivate user (Admin only). Sets status to inactive.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - User MongoDB ID

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deactivated successfully",
  "data": null
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot delete your own account"
}
```

---

### Financial Records

**All record endpoints require ANALYST or ADMIN role. Analysts can only access their own records; Admins can access all records.**

#### Create Record
```http
POST /api/v1/records
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 1500.50,
  "type": "income",
  "category": "Salary",
  "date": "2024-01-15T10:30:00.000Z",
  "notes": "Monthly salary payment"
}
```

**Required fields:**
- `amount` (number ≥ 0)
- `type` (string): `income` or `expense`
- `category` (string, max 50 chars)

**Optional fields:**
- `date` (ISO 8601 datetime, defaults to current time)
- `notes` (string, max 500 chars)

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Record created successfully",
  "data": {
    "record": {
      "_id": "60d21b4667d0d8992e610c86",
      "userId": "60d21b4667d0d8992e610c85",
      "amount": 1500.50,
      "type": "income",
      "category": "Salary",
      "date": "2024-01-15T10:30:00.000Z",
      "notes": "Monthly salary payment",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

#### Get All Records
```http
GET /api/v1/records
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page, max 100 (default: 10) |
| `type` | string | No | Filter by `income` or `expense` |
| `category` | string | No | Filter by category (case-sensitive) |
| `userId` | string | No | **Admin only**: filter by specific user ID |
| `startDate` | string | No | Filter records from this date (ISO 8601) |
| `endDate` | string | No | Filter records until this date (ISO 8601) |
| `search` | string | No | Search in category or notes (case-insensitive partial match) |
| `sortBy` | string | No | Sort field: `date`, `amount`, or `createdAt` (default: `date`) |
| `sortOrder` | string | No | Sort direction: `asc` or `desc` (default: `desc`) |

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Records retrieved successfully",
  "data": {
    "records": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "userId": "60d21b4667d0d8992e610c85",
        "amount": 1500.50,
        "type": "income",
        "category": "Salary",
        "date": "2024-01-15T10:30:00.000Z",
        "notes": "Monthly salary payment",
        "isDeleted": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false
    }
  }
}
```

---

#### Get Single Record
```http
GET /api/v1/records/:id
```

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Record MongoDB ID

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Record retrieved successfully",
  "data": {
    "record": {
      "_id": "60d21b4667d0d8992e610c86",
      "userId": "60d21b4667d0d8992e610c85",
      "amount": 1500.50,
      "type": "income",
      "category": "Salary",
      "date": "2024-01-15T10:30:00.000Z",
      "notes": "Monthly salary payment",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Record not found"
}
```

---

#### Update Record
```http
PATCH /api/v1/records/:id
```

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Record MongoDB ID

**Request Body (all fields optional, at least one required):**
```json
{
  "amount": 2000.00,
  "type": "income",
  "category": "Updated Salary",
  "date": "2024-01-15T10:30:00.000Z",
  "notes": "Updated salary record"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Record updated successfully",
  "data": {
    "record": {
      "_id": "60d21b4667d0d8992e610c86",
      "userId": "60d21b4667d0d8992e610c85",
      "amount": 2000.00,
      "type": "income",
      "category": "Updated Salary",
      "date": "2024-01-15T10:30:00.000Z",
      "notes": "Updated salary record",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-21T08:15:00.000Z"
    }
  }
}
```

---

#### Delete Record (Soft Delete)
```http
DELETE /api/v1/records/:id
```

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Record MongoDB ID

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Record deleted successfully",
  "data": null
}
```

**Note:** This performs a soft delete by setting `isDeleted: true`. The record remains in the database but is excluded from all queries.

---

### Dashboard

**All authenticated users (Viewer, Analyst, Admin) can access dashboard**

#### Get Dashboard Summary
```http
GET /api/v1/dashboard
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "totals": {
      "income": 15000.00,
      "expense": 8500.50,
      "netBalance": 6499.50,
      "incomeCount": 25,
      "expenseCount": 42
    },
    "categoryWise": {
      "income": [
        {
          "category": "Salary",
          "total": 12000.00,
          "count": 3
        },
        {
          "category": "Freelance",
          "total": 3000.00,
          "count": 5
        }
      ],
      "expense": [
        {
          "category": "Rent",
          "total": 4500.00,
          "count": 3
        },
        {
          "category": "Groceries",
          "total": 1200.50,
          "count": 15
        }
      ]
    },
    "recentTransactions": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "amount": 1500.50,
        "type": "income",
        "category": "Salary",
        "date": "2024-01-15T10:30:00.000Z",
        "notes": "Monthly salary payment",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "monthlySummary": [
      {
        "month": "2024-01",
        "income": 5000.00,
        "expense": 2500.00,
        "net": 2500.00,
        "incomeCount": 4,
        "expenseCount": 8
      },
      {
        "month": "2023-12",
        "income": 4800.00,
        "expense": 2300.50,
        "net": 2499.50,
        "incomeCount": 3,
        "expenseCount": 7
      }
    ]
  }
}
```

---

## Data Models

### User Model

**Collection:** `users`

```javascript
{
  _id: ObjectId,              // Auto-generated
  name: String,               // Required, 2-100 chars
  email: String,              // Required, unique, lowercase
  password: String,           // Required, min 6 chars, hashed (select: false)
  role: String,               // Required, enum: 'viewer' | 'analyst' | 'admin', default: 'viewer'
  status: String,             // Required, enum: 'active' | 'inactive', default: 'active'
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

**Indexes:**
- `email` (unique)
- `role`
- `status`

---

### FinancialRecord Model

**Collection:** `financialrecords`

```javascript
{
  _id: ObjectId,              // Auto-generated
  userId: ObjectId,           // Required, reference to User
  amount: Number,             // Required, min 0
  type: String,               // Required, enum: 'income' | 'expense'
  category: String,           // Required, max 50 chars
  date: Date,                 // Optional, defaults to creation time
  notes: String,              // Optional, max 500 chars
  isDeleted: Boolean,         // Required, default: false (soft delete)
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

**Indexes:**
- `userId`
- `type`
- `category`
- `date`
- `{ userId: 1, isDeleted: 1 }`

---

## Validation Rules

### User Validation

| Field | Rules | Error Code |
|-------|-------|------------|
| `name` | Required, string, 2-100 chars | 400 |
| `email` | Required, valid email format, unique | 400, 409 |
| `password` | Required, string, min 6 chars | 400 |
| `role` | Optional, enum: viewer/analyst/admin (self-register only allows viewer) | 400 |
| `status` | enum: active/inactive | 400 |

---

### Record Validation

| Field | Rules | Error Code |
|-------|-------|------------|
| `amount` | Required, number, ≥ 0 | 400 |
| `type` | Required, enum: income/expense | 400 |
| `category` | Required, string, max 50 chars | 400 |
| `date` | Optional, ISO 8601 datetime | 400 |
| `notes` | Optional, string, max 500 chars | 400 |

**Note:** Update endpoint requires at least one field to be provided.

---

### Query Validation

Record list endpoint validates:
- `page`: integer ≥ 1
- `limit`: integer 1-100
- `type`: string, must be `income` or `expense`
- `startDate`, `endDate`: ISO 8601 date format
- `sortBy`: must be `date`, `amount`, or `createdAt`
- `sortOrder`: must be `asc` or `desc`

---

## Error Handling

All errors follow this standardized format:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET/PATCH/DELETE |
| `201` | Created | Successful POST (create) |
| `400` | Bad Request | Validation error, invalid input |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions, self-modification restrictions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate email on registration |
| `422` | Unprocessable Entity | Invalid enum value |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

---

### Common Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": [
    {
      "field": "amount",
      "message": "Amount cannot be negative"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token required"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Require role: admin. Current role: analyst"
}
```

---

## Security Features

1. **JWT Authentication**: Stateless authentication with token expiry
2. **Role-Based Access Control**: Route-level and resource-level checks
3. **Password Security**: Bcrypt hashing (12 salt rounds)
4. **Input Validation**: Joi validation on all user inputs
5. **SQL Injection Protection**: Mongoose ORM automatically sanitizes queries
6. **XSS Protection**: Helmet middleware with security headers
7. **CORS Configurable**: Allowed origins configurable via environment
8. **Rate Limiting**: Applied to authentication endpoints
9. **No Password Leaks**: Password field excluded by default (`select: false`)
10. **Soft Deletes**: Data preservation with `isDeleted` flag

---

## Environment Variables

Create a `.env` file with:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/financial_management

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=*
```

---

## Setup & Deployment

### Prerequisites
- Node.js 16+
- MongoDB 4+

### Installation

```bash
# 1. Navigate to project
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start MongoDB (if local)
mongod

# 5. Start server
npm start

# Development with auto-restart
npm run dev
```

### Database Schema

The application uses Mongoose and will automatically create collections on first data insertion. No manual migration needed.

### Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Server is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.45,
  "database": {
    "status": "connected"
  }
}
```

---

## API Testing with Swagger

Interactive API documentation available at:

```
http://localhost:5000/api-docs
```

You can test all endpoints directly from the Swagger UI interface.

---

## Access Control Matrix

| Endpoint | Method | Viewer | Analyst | Admin |
|----------|--------|--------|---------|-------|
| `/auth/register` | POST | ✓ | ✓ | ✓ |
| `/auth/login` | POST | ✓ | ✓ | ✓ |
| `/auth/profile` | GET | ✓ | ✓ | ✓ |
| `/users` | GET | ✗ | ✗ | ✓ (all users) |
| `/users/:id` | GET | ✓ (self only) | ✓ (self only) | ✓ (any) |
| `/users/:id/role` | PATCH | ✗ | ✗ | ✓ |
| `/users/:id/status` | PATCH | ✗ | ✗ | ✓ |
| `/users/:id` | DELETE | ✗ | ✗ | ✓ |
| `/records` | POST | ✗ | ✓ (own only) | ✓ (all) |
| `/records` | GET | ✗ | ✓ (own only) | ✓ (all, with userId filter) |
| `/records/:id` | GET/PATCH/DELETE | ✗ | ✓ (own only) | ✓ (any) |
| `/dashboard` | GET | ✓ | ✓ | ✓ |

---

## Database Schema Summary

### Users Collection
- 3 roles: `viewer`, `analyst`, `admin`
- 2 statuses: `active`, `inactive`
- Bcrypt password hashing
- Unique email constraint

### FinancialRecords Collection
- Linked to user via `userId`
- 2 record types: `income`, `expense`
- Soft delete with `isDeleted` flag
- Date field for transaction date

---

## Development Guidelines

### Adding New Routes

1. Define route in appropriate `routes/*.routes.js`
2. Add controller method in `controllers/*.controller.js`
3. Add validation schema in `validators/*.validator.js`
4. Apply middleware: `authenticate` + `authorizeRoles(...)`
5. Update Swagger documentation
6. The system uses a consistent response pattern via `ApiResponse` and error handling via `ApiError`

### Conventions

- Use async/await with try-catch
- Pass errors to `next()` for centralized error handling
- Always include pagination on list endpoints
- Use soft deletes (`isDeleted` flag) instead of hard deletes
- Validate all inputs with Joi
- Return consistent JSON structure
- Do not expose passwords in API responses

---

## License

Internal use - All rights reserved.

---

**END OF DOCUMENTATION**
