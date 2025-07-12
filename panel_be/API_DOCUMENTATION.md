# Panel Sam - API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Panel Sam backend system. All APIs follow RESTful conventions and return JSON responses.

**Base URL:** `http://localhost:5000/api`

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Response Format

All APIs return responses in this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ },
  "errors": [ /* validation errors */ ]
}
```

---

## 🔑 Authentication APIs

### 1. User Registration
```http
POST /auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "contactNumber": "1234567890",
  "countryCode": "+1",
  "location": "New York, USA",
  "language": "en",
  "occupation": "Developer",
  "age": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "otp": "123456" // Only in development
  }
}
```

### 2. OTP Verification
```http
POST /auth/verify-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "panelist",
      "isEmailVerified": true
    }
  }
}
```

### 3. User Login
```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "panelist",
      "isEmailVerified": true
    }
  }
}
```

### 4. Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email",
  "data": {
    "otp": "123456" // Only in development
  }
}
```

### 5. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 6. Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
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
      "email": "john@example.com",
      "role": "panelist",
      "isEmailVerified": true,
      "isActive": true
    }
  }
}
```

---

## 👤 Panelist Profile Management APIs

### 1. Get Panelist Dashboard
```http
GET /panelists/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "availableSurveys": 15,
      "completedSurveys": 8,
      "profileCompletion": 85,
      "totalRewards": 450
    },
    "recentSurveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "description": "Help us understand your preferences",
        "category": "Consumer",
        "estimatedDuration": 10,
        "reward": 50,
        "createdBy": {
          "firstName": "Admin",
          "lastName": "User"
        }
      }
    ],
    "recentActivity": [
      {
        "id": "1",
        "type": "survey_completed",
        "title": "Completed Survey",
        "description": "Consumer Preferences Survey",
        "timestamp": "2025-07-11T10:52:36.000Z",
        "value": 50
      }
    ]
  }
}
```

### 2. Get Panelist Profile
```http
GET /panelists/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "Amarnath",
      "lastName": "Rana",
      "email": "info@samplizy.com",
      "contactNumber": "9876543210",
      "countryCode": "+1",
      "location": "New York, USA",
      "language": "English",
      "occupation": "Business Owner",
      "age": 30,
      "gender": "male",
      "education": "bachelor",
      "income": "medium",
      "maritalStatus": "married",
      "householdSize": 3,
      "children": 1,
      "role": "panelist",
      "isEmailVerified": true,
      "isActive": true,
      "profileCompletion": 85,
      "totalPoints": 450,
      "createdAt": "2025-07-11T10:52:36.000Z",
      "updatedAt": "2025-07-11T10:52:36.000Z"
    }
  }
}
```

### 3. Update Panelist Profile
```http
PUT /panelists/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Amarnath",
  "lastName": "Rana",
  "contactNumber": "9876543210",
  "location": "New York, USA",
  "language": "English",
  "occupation": "Business Owner",
  "age": 30,
  "gender": "male",
  "education": "bachelor",
  "income": "medium",
  "maritalStatus": "married",
  "householdSize": 3,
  "children": 1
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
      "firstName": "Amarnath",
      "lastName": "Rana",
      "email": "info@samplizy.com",
      "contactNumber": "9876543210",
      "countryCode": "+1",
      "location": "New York, USA",
      "language": "English",
      "occupation": "Business Owner",
      "age": 30,
      "gender": "male",
      "education": "bachelor",
      "income": "medium",
      "maritalStatus": "married",
      "householdSize": 3,
      "children": 1,
      "role": "panelist",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2025-07-11T10:52:36.000Z",
      "updatedAt": "2025-07-11T10:52:36.000Z"
    }
  }
}
```

### 4. Get Survey History
```http
GET /panelists/survey-history?page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "id": 1,
        "survey": {
          "id": 1,
          "title": "Consumer Preferences Survey",
          "category": "Consumer"
        },
        "status": "completed",
        "startedAt": "2025-07-11T10:00:00.000Z",
        "completedAt": "2025-07-11T10:15:00.000Z",
        "timeSpent": 900,
        "pointsEarned": 50,
        "isQualified": true
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

---

## 📊 Survey Management APIs

### 1. Get All Surveys (Admin/Researcher)
```http
GET /surveys?page=1&limit=10&status=active
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by status (draft, active, paused, completed)
- `category` (optional): Filter by category
- `search` (optional): Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": 1,
        "title": "Consumer Preferences Survey",
        "description": "Help us understand your preferences",
        "category": "Consumer",
        "status": "active",
        "estimatedDuration": 10,
        "reward": 50,
        "questions": [
          {
            "id": 1,
            "type": "multiple_choice",
            "question": "What is your favorite color?",
            "options": ["Red", "Blue", "Green", "Yellow"]
          }
        ],
        "targetAudience": {
          "ageRange": [18, 65],
          "gender": ["male", "female"],
          "location": ["USA", "Canada"]
        },
        "tags": ["consumer", "preferences", "marketing"],
        "createdBy": {
          "id": 1,
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2025-07-11T10:00:00.000Z",
        "updatedAt": "2025-07-11T10:00:00.000Z"
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

### 2. Create Survey (Admin/Researcher)
```http
POST /surveys
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Consumer Preferences Survey",
  "description": "Help us understand your preferences",
  "category": "Consumer",
  "estimatedDuration": 10,
  "reward": 50,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is your favorite color?",
      "options": ["Red", "Blue", "Green", "Yellow"],
      "required": true
    }
  ],
  "targetAudience": {
    "ageRange": [18, 65],
    "gender": ["male", "female"],
    "location": ["USA", "Canada"]
  },
  "tags": ["consumer", "preferences", "marketing"]
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
      "description": "Help us understand your preferences",
      "category": "Consumer",
      "status": "draft",
      "estimatedDuration": 10,
      "reward": 50,
      "createdBy": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2025-07-11T10:00:00.000Z",
      "updatedAt": "2025-07-11T10:00:00.000Z"
    }
  }
}
```

### 3. Get Survey by ID
```http
GET /surveys/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": 1,
      "title": "Consumer Preferences Survey",
      "description": "Help us understand your preferences",
      "category": "Consumer",
      "status": "active",
      "estimatedDuration": 10,
      "reward": 50,
      "questions": [...],
      "targetAudience": {...},
      "tags": [...],
      "createdBy": {...},
      "createdAt": "2025-07-11T10:00:00.000Z",
      "updatedAt": "2025-07-11T10:00:00.000Z"
    }
  }
}
```

### 4. Update Survey
```http
PUT /surveys/:id
Authorization: Bearer <token>
Content-Type: application/json
```

### 5. Delete Survey
```http
DELETE /surveys/:id
Authorization: Bearer <token>
```

### 6. Get Available Surveys for Panelists
```http
GET /surveys/available/panelist?page=1&limit=10
Authorization: Bearer <token>
```

---

## 👥 Admin/Researcher APIs

### 1. Get All Panelists
```http
GET /panelists/all?page=1&limit=10&search=john&country=USA
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
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
        "firstName": "Amarnath",
        "lastName": "Rana",
        "email": "info@samplizy.com",
        "role": "panelist",
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2025-07-11T10:52:36.000Z"
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

### 2. Get Panelist Statistics
```http
GET /panelists/stats/:panelistId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "panelist": {
      "id": 1,
      "firstName": "Amarnath",
      "lastName": "Rana",
      "email": "info@samplizy.com",
      "role": "panelist",
      "isActive": true,
      "isEmailVerified": true,
      "createdAt": "2025-07-11T10:52:36.000Z"
    },
    "stats": {
      "totalSurveysCompleted": 15,
      "totalPointsEarned": 750,
      "averageCompletionTime": 12.5,
      "completionRate": 85.5,
      "lastActivity": "2025-07-11T10:52:36.000Z",
      "memberSince": "2025-07-11T10:52:36.000Z"
    }
  }
}
```

### 3. Get Panelist Demographics
```http
GET /panelists/demographics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPanelists": 1000,
    "verifiedUsers": 850,
    "activeUsers": 750,
    "locationDistribution": {
      "USA": 400,
      "Canada": 200,
      "UK": 150,
      "Australia": 100,
      "Not specified": 150
    }
  }
}
```

---

## 🔧 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please enter a valid email address",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Development Notes

### Environment Variables
- `NODE_ENV`: Set to 'development' for demo OTP (123456)
- `JWT_SECRET`: Secret key for JWT tokens
- `DATABASE_URL`: MySQL connection string

### Demo Credentials
- **Email:** info@samplizy.com
- **Password:** Amar12345
- **Demo OTP:** 123456 (in development mode)

### Testing
Use tools like Postman, Insomnia, or curl to test these APIs. Remember to:
1. Register/login to get a JWT token
2. Include the token in Authorization header for protected endpoints
3. Use proper Content-Type headers for POST/PUT requests

---

**Last Updated:** July 2024  
**Version:** 1.0.0 