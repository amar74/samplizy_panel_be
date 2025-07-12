# Panel Sam API Documentation

## Overview

The Panel Sam API is a RESTful service for managing online survey panels. It provides endpoints for user authentication, user management, panelist operations, and survey management.

**Base URL:** `http://localhost:5000/api`

**Content-Type:** `application/json`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... },
  "errors": [ ... ] // Only present on validation errors
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "contactNumber": "+1234567890",
  "countryCode": "+1",
  "location": "New York, USA",
  "language": "en",
  "occupation": "Software Engineer",
  "age": 30,
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "data": {
    "userId": 1,
    "email": "john.doe@example.com",
    "otp": "123456" // Only in development mode
  }
}
```

### 2. Verify OTP

**POST** `/auth/verify-otp`

Verify email with OTP received during registration.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "panelist",
      "isEmailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "panelist",
      "isEmailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Current User

**GET** `/auth/me`

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "contactNumber": "+1234567890",
      "countryCode": "+1",
      "location": "New York, USA",
      "language": "en",
      "occupation": "Software Engineer",
      "age": 30,
      "role": "panelist",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## User Management Endpoints

*Requires Admin or Researcher role*

### 1. Get All Users

**GET** `/users`

Get paginated list of users with filtering options.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-100 (default: 10)
- `role` (optional): Filter by role (`admin`, `panelist`, `researcher`)
- `search` (optional): Search in name and email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "panelist",
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 2. Get User by ID

**GET** `/users/:id`

Get specific user details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "panelist",
      "isActive": true,
      "isEmailVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 3. Update User Profile

**PUT** `/users/profile`

Update current user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "location": {
    "country": "USA",
    "state": "New York",
    "city": "New York City"
  },
  "preferences": {
    "emailNotifications": true,
    "surveyNotifications": true,
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "gender": "male",
      "location": {
        "country": "USA",
        "state": "New York",
        "city": "New York City"
      },
      "preferences": {
        "emailNotifications": true,
        "surveyNotifications": true,
        "language": "en"
      }
    }
  }
}
```

### 4. Update User (Admin Only)

**PUT** `/users/:id`

Update any user's details (admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "role": "researcher",
  "isActive": true,
  "isEmailVerified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.doe@example.com",
      "role": "researcher",
      "isActive": true,
      "isEmailVerified": true
    }
  }
}
```

### 5. Delete User (Admin Only)

**DELETE** `/users/:id`

Delete a user account.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 6. Get User Statistics (Admin Only)

**GET** `/users/stats/overview`

Get user statistics and analytics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "verifiedUsers": 100,
    "usersByRole": [
      { "_id": "panelist", "count": 100 },
      { "_id": "researcher", "count": 30 },
      { "_id": "admin", "count": 20 }
    ],
    "recentUsers": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "panelist",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Panelist Endpoints

### 1. Get Panelist Dashboard

**GET** `/panelists/dashboard`

Get dashboard data for panelist users.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "availableSurveys": 15,
      "completedSurveys": 8,
      "profileCompletion": 85
    },
    "recentSurveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "description": "Help us understand your shopping habits",
        "category": "Consumer Research",
        "estimatedDuration": 10,
        "reward": 50,
        "createdBy": {
          "firstName": "Jane",
          "lastName": "Researcher"
        }
      }
    ]
  }
}
```

### 2. Get Panelist Profile

**GET** `/panelists/profile`

Get current panelist's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "contactNumber": "+1234567890",
      "countryCode": "+1",
      "location": "New York, USA",
      "language": "en",
      "occupation": "Software Engineer",
      "age": 30,
      "role": "panelist",
      "isEmailVerified": true,
      "isActive": true
    }
  }
}
```

### 3. Update Panelist Profile

**PUT** `/panelists/profile`

Update panelist's profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "location": {
    "country": "USA",
    "state": "New York",
    "city": "New York City"
  },
  "preferences": {
    "emailNotifications": true,
    "surveyNotifications": true,
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "gender": "male",
      "location": {
        "country": "USA",
        "state": "New York",
        "city": "New York City"
      },
      "preferences": {
        "emailNotifications": true,
        "surveyNotifications": true,
        "language": "en"
      }
    }
  }
}
```

### 4. Get Survey History

**GET** `/panelists/survey-history`

Get panelist's survey completion history.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-20 (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "id": 1,
        "surveyId": 1,
        "surveyTitle": "Consumer Preferences Survey",
        "completedAt": "2024-01-15T10:30:00.000Z",
        "reward": 50,
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 5. Get Panelist Statistics (Researcher/Admin)

**GET** `/panelists/stats/:panelistId`

Get detailed statistics for a specific panelist.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "panelist": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "panelist",
      "isActive": true,
      "isEmailVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "stats": {
      "totalSurveysCompleted": 25,
      "totalPointsEarned": 1250,
      "averageCompletionTime": 8.5,
      "completionRate": 95.2,
      "lastActivity": "2024-01-15T10:30:00.000Z",
      "memberSince": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 6. Get All Panelists (Researcher/Admin)

**GET** `/panelists/all`

Get paginated list of all panelists with filtering.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-50 (default: 10)
- `search` (optional): Search in name and email
- `country` (optional): Filter by country
- `gender` (optional): Filter by gender

**Response:**
```json
{
  "success": true,
  "data": {
    "panelists": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "panelist",
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 7. Get Panelist Demographics (Researcher/Admin)

**GET** `/panelists/demographics`

Get demographic statistics for all panelists.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPanelists": 100,
    "verifiedUsers": 85,
    "activeUsers": 90,
    "genderDistribution": {
      "male": 45,
      "female": 50,
      "other": 3,
      "prefer_not_to_say": 2
    },
    "countryDistribution": {
      "USA": 60,
      "Canada": 20,
      "UK": 15,
      "Australia": 5
    }
  }
}
```

---

## Survey Endpoints

### 1. Get All Surveys

**GET** `/surveys`

Get paginated list of surveys with filtering.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-50 (default: 10)
- `status` (optional): Filter by status (`draft`, `active`, `paused`, `completed`)
- `category` (optional): Filter by category
- `search` (optional): Search in title, description, and tags
- `createdBy` (optional): Filter by creator ID

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "description": "Help us understand your shopping habits",
        "category": "Consumer Research",
        "status": "active",
        "estimatedDuration": 10,
        "reward": 50,
        "createdBy": {
          "firstName": "Jane",
          "lastName": "Researcher",
          "email": "jane@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 2. Get Survey by ID

**GET** `/surveys/:id`

Get specific survey details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": 1,
      "title": "Consumer Preferences Survey",
      "description": "Help us understand your shopping habits",
      "category": "Consumer Research",
      "status": "active",
      "estimatedDuration": 10,
      "reward": 50,
      "questions": [
        {
          "id": "q1",
          "type": "radio",
          "question": "How often do you shop online?",
          "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
          "required": true
        }
      ],
      "targetAudience": {
        "ageRange": { "min": 18, "max": 65 },
        "gender": ["male", "female"],
        "countries": ["USA", "Canada"]
      },
      "createdBy": {
        "firstName": "Jane",
        "lastName": "Researcher",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 3. Create Survey (Researcher/Admin)

**POST** `/surveys`

Create a new survey.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Consumer Preferences Survey",
  "description": "Help us understand your shopping habits",
  "category": "Consumer Research",
  "estimatedDuration": 10,
  "reward": 50,
  "status": "draft",
  "questions": [
    {
      "id": "q1",
      "type": "radio",
      "question": "How often do you shop online?",
      "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
      "required": true
    },
    {
      "id": "q2",
      "type": "text",
      "question": "What factors influence your online shopping decisions?",
      "required": false
    }
  ],
  "targetAudience": {
    "ageRange": { "min": 18, "max": 65 },
    "gender": ["male", "female"],
    "countries": ["USA", "Canada"]
  },
  "tags": ["shopping", "consumer", "preferences"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey created successfully",
  "data": {
    "survey": {
      "id": 1,
      "title": "Consumer Preferences Survey",
      "description": "Help us understand your shopping habits",
      "category": "Consumer Research",
      "status": "draft",
      "estimatedDuration": 10,
      "reward": 50,
      "questions": [...],
      "targetAudience": {...},
      "createdBy": {
        "firstName": "Jane",
        "lastName": "Researcher",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Update Survey (Researcher/Admin)

**PUT** `/surveys/:id`

Update an existing survey.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Updated Consumer Preferences Survey",
  "description": "Updated description",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey updated successfully",
  "data": {
    "survey": {
      "id": 1,
      "title": "Updated Consumer Preferences Survey",
      "description": "Updated description",
      "status": "active",
      "createdBy": {
        "firstName": "Jane",
        "lastName": "Researcher",
        "email": "jane@example.com"
      }
    }
  }
}
```

### 5. Delete Survey (Researcher/Admin)

**DELETE** `/surveys/:id`

Delete a survey.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Survey deleted successfully"
}
```

### 6. Get Available Surveys for Panelists

**GET** `/surveys/available/panelist`

Get surveys available for panelists based on their profile and target audience criteria.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-20 (default: 10)
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "description": "Help us understand your shopping habits",
        "category": "Consumer Research",
        "estimatedDuration": 10,
        "reward": 50,
        "createdBy": {
          "firstName": "Jane",
          "lastName": "Researcher"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### 7. Get Survey Statistics (Researcher/Admin)

**GET** `/surveys/stats/overview`

Get survey statistics and analytics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSurveys": 50,
    "activeSurveys": 20,
    "draftSurveys": 15,
    "completedSurveys": 15,
    "surveysByCategory": [
      { "_id": "Consumer Research", "count": 20 },
      { "_id": "Market Research", "count": 15 },
      { "_id": "Product Testing", "count": 10 },
      { "_id": "Opinion Polls", "count": 5 }
    ],
    "recentSurveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "status": "active",
        "category": "Consumer Research",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "createdBy": {
          "firstName": "Jane",
          "lastName": "Researcher"
        }
      }
    ]
  }
}
```

---

## Health Check

### Get System Status

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Panel Sam Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Data Models

### User Model
```json
{
  "id": "number",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "contactNumber": "string",
  "countryCode": "string",
  "location": "string",
  "language": "string",
  "occupation": "string",
  "age": "number",
  "role": "admin|panelist|researcher",
  "isEmailVerified": "boolean",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Survey Model
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "status": "draft|active|paused|completed",
  "estimatedDuration": "number",
  "reward": "number",
  "questions": [
    {
      "id": "string",
      "type": "text|number|email|tel|url|date|time|datetime-local|month|week|select|textarea|radio|checkbox|range|file",
      "question": "string",
      "options": ["array"],
      "required": "boolean"
    }
  ],
  "targetAudience": {
    "ageRange": { "min": "number", "max": "number" },
    "gender": ["array"],
    "countries": ["array"]
  },
  "tags": ["array"],
  "createdBy": "User",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per user

---

## Environment Variables

Required environment variables:

```env
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-connection-string
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## Support

For API support and questions, please contact the development team or refer to the project documentation. 