# Panel Sam - Complete Project Documentation

## 📋 Project Overview

Panel Sam is a full-stack survey panel management system built with modern technologies. The project follows a microservices-like architecture with separate backend and frontend applications.

## 🏗️ Architecture Overview

### Project Structure
```
panel_sam/
├── panel_be/          # Backend (Node.js + Express + Prisma + MySQL)
└── panel_fe/          # Frontend (React + TypeScript + Vite)
```

### Technology Stack

#### Backend (panel_be)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Email**: OTP verification system
- **Environment**: Environment-based configuration

#### Frontend (panel_fe)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Heroicons + React Icons
- **State Management**: React hooks + localStorage

## 🔧 Backend Architecture (panel_be)

### Key Features
- ✅ RESTful API design
- ✅ Prisma for database management
- ✅ JWT authentication
- ✅ OTP email verification
- ✅ Password reset functionality
- ✅ Environment-based configuration
- ✅ TypeScript for type safety

### Database Schema (Prisma)

```prisma
model User {
  id                    Int      @id @default(autoincrement())
  firstName            String
  lastName             String
  email                String   @unique
  password             String
  contactNumber        String?
  countryCode          String?
  location             String?
  language             String?
  occupation           String?
  age                  Int?
  role                 String   @default("panelist")
  isEmailVerified      Boolean  @default(false)
  isActive             Boolean  @default(true)
  emailVerificationToken String?
  emailVerificationExpires DateTime?
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
  surveys              Survey[] @relation("SurveyCreator")
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Survey {
  id                Int      @id @default(autoincrement())
  title             String
  description       String
  category          String
  status            String   @default("draft") // 'draft', 'active', 'paused', 'completed'
  estimatedDuration Int      // in minutes
  reward            Int      // points
  questions         Json?    // Store questions as JSON
  targetAudience    Json?    // Store target audience criteria as JSON
  tags              Json?    // Store tags as JSON array
  createdBy         User     @relation("SurveyCreator", fields: [createdById], references: [id])
  createdById       Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Authentication Flow
1. **Registration**: User registration with OTP generation
2. **Email Verification**: OTP verification for email confirmation
3. **Login**: JWT token generation after successful login
4. **Password Reset**: OTP-based password reset functionality
5. **Token Management**: Automatic JWT token validation

### API Endpoints

For detailed API documentation with request/response examples, see: `panel_be/API_DOCUMENTATION.md`

#### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

#### Panelist Profile Management Routes
- `GET /api/panelists/dashboard` - Panelist dashboard with stats
- `GET /api/panelists/profile` - Get panelist profile
- `PUT /api/panelists/profile` - Update panelist profile
- `GET /api/panelists/survey-history` - Get survey history

#### Survey Management Routes
- `GET /api/surveys` - Get all surveys (Admin/Researcher)
- `POST /api/surveys` - Create new survey (Admin/Researcher)
- `GET /api/surveys/:id` - Get survey by ID
- `PUT /api/surveys/:id` - Update survey (Admin/Researcher)
- `DELETE /api/surveys/:id` - Delete survey (Admin/Researcher)
- `GET /api/surveys/available/panelist` - Get available surveys for panelists

#### Admin/Researcher Routes
- `GET /api/panelists/all` - Get all panelists
- `GET /api/panelists/stats/:panelistId` - Get panelist statistics
- `GET /api/panelists/demographics` - Get panelist demographics

## 🎨 Frontend Architecture (panel_fe)

### Key Features
- ✅ Centralized API configuration
- ✅ Environment-based API URLs
- ✅ Service layer pattern
- ✅ Type-safe API calls
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design
- ✅ Component-based architecture

### API Configuration Approach

#### Environment-Based Configuration
```bash
# env.development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Panel Sam
VITE_APP_VERSION=1.0.0

# env.production
VITE_API_BASE_URL=https://your-production-domain.com/api
VITE_APP_NAME=Panel Sam
VITE_APP_VERSION=1.0.0
```

#### Centralized Endpoint Management
```typescript
// src/utils/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GET_ME: '/auth/me',
  },
  SURVEY: {
    LIST: '/surveys',
    CREATE: '/surveys',
    GET_BY_ID: (id: number) => `/surveys/${id}`,
    UPDATE: (id: number) => `/surveys/${id}`,
    DELETE: (id: number) => `/surveys/${id}`,
    AVAILABLE: '/surveys/available/panelist',
  },
  PANELIST: {
    DASHBOARD: '/panelists/dashboard',
    PROFILE: '/panelists/profile',
    SURVEY_HISTORY: '/panelists/survey-history',
  },
};
```

### Service Layer Pattern

#### Authentication Service
```typescript
// src/services/authService.ts
export const authService = {
  register: async (data: RegisterData): Promise<ApiResponse> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  login: async (data: LoginData): Promise<ApiResponse> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  // ... more methods
};
```

### Component Architecture
- **Pages**: Main page components
- **Components**: Reusable UI components
- **Services**: API service layer
- **Utils**: Helper functions and configuration
- **Types**: TypeScript type definitions

## 🚀 Development Workflow

### Environment Switching
```bash
# Development
npm run dev          # Uses env.development

# Production
npm run build        # Uses env.production
npm run dev:prod     # Development server with production env
```

### Backend Development
```bash
cd panel_be
npm install
npm run dev          # Start development server
```

### Frontend Development
```bash
cd panel_fe
npm install
npm run dev          # Start development server
```

## 🎯 Key Design Patterns

### 1. Separation of Concerns
- **Backend**: API logic, database, authentication
- **Frontend**: UI, state management, API calls
- **Services**: Business logic layer
- **Utils**: Helper functions and configuration

### 2. Environment Configuration
- **Development**: Local development settings
- **Production**: Production server settings
- **Single Point of Change**: Update environment files only

### 3. Type Safety
- **TypeScript**: Full type checking
- **Interfaces**: Defined for all API requests/responses
- **Prisma**: Type-safe database queries

### 4. Scalable Architecture
- **Modular Services**: Easy to add new features
- **Centralized Configuration**: Single source of truth
- **Reusable Components**: DRY principle

## 📁 Complete Project Structure

```
panel_sam/
├── panel_be/                    # Backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts         # Authentication routes
│   │   │   ├── surveys.ts      # Survey routes
│   │   │   ├── panelists.ts    # Panelist routes
│   │   │   └── users.ts        # User routes
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication middleware
│   │   │   └── errorHandler.ts # Error handling middleware
│   │   └── server.ts           # Main server file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── tsconfig.json
└── panel_fe/                   # Frontend
    ├── src/
    │   ├── components/
    │   │   ├── admin/          # Admin components
    │   │   ├── panelist/       # Panelist components
    │   │   ├── shared/         # Shared components
    │   │   └── LoginExample.tsx # Example login component
    │   ├── pages/
    │   │   ├── admin/          # Admin pages
    │   │   ├── auth/           # Authentication pages
    │   │   └── panelist/       # Panelist pages
    │   ├── services/
    │   │   └── authService.ts  # Authentication service
    │   ├── utils/
    │   │   └── api.ts          # API configuration
    │   ├── types/
    │   │   └── index.ts        # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── env.development         # Development environment
    ├── env.production          # Production environment
    ├── API_USAGE.md            # API usage guide
    ├── package.json
    └── vite.config.ts
```

## 🔐 Authentication System

### Registration Flow
1. User submits registration form
2. Backend validates data and creates user
3. OTP is generated and sent to email
4. User verifies email with OTP
5. Account is activated

### Login Flow
1. User submits login credentials
2. Backend validates email and password
3. JWT token is generated
4. Token is returned to frontend
5. Frontend stores token in localStorage

### Password Reset Flow
1. User requests password reset
2. OTP is generated and sent to email
3. User submits OTP and new password
4. Password is updated in database

## 📊 Database Design

### User Management
- **User Profiles**: Complete user information storage
- **Role-Based Access**: Different roles (admin, researcher, panelist)
- **Email Verification**: OTP-based email verification
- **Password Security**: Bcrypt hashing

### Survey Management
- **Survey Creation**: Complete survey builder
- **Question Types**: JSON-based question storage
- **Target Audience**: Demographic targeting
- **Reward System**: Point-based rewards
- **Status Management**: Draft, active, paused, completed

## 🎨 UI/UX Design

### Design Principles
- **Modern**: Clean, contemporary design
- **Responsive**: Mobile-first approach
- **Accessible**: WCAG compliance
- **User-Friendly**: Intuitive navigation

### Technology Stack
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **React Icons**: Additional icon library
- **Custom Components**: Reusable UI components

## 🚀 Deployment Strategy

### Backend Deployment
1. Set up MySQL database
2. Configure environment variables
3. Run Prisma migrations
4. Deploy Node.js application
5. Set up SSL certificates

### Frontend Deployment
1. Build production version
2. Deploy to CDN/static hosting
3. Configure environment variables
4. Set up custom domain

### Environment Management
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live application

## 🔧 Development Best Practices

### Code Organization
- **Modular Structure**: Separate concerns
- **Type Safety**: Use TypeScript everywhere
- **Error Handling**: Comprehensive error management
- **Documentation**: Clear code documentation

### API Design
- **RESTful**: Follow REST principles
- **Consistent**: Standardized response format
- **Secure**: JWT authentication
- **Scalable**: Easy to extend

### Frontend Development
- **Component-Based**: Reusable components
- **Service Layer**: Business logic separation
- **State Management**: Efficient state handling
- **Performance**: Optimized rendering

## 📈 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration
- **Advanced Analytics**: Survey analytics dashboard
- **Mobile App**: React Native application
- **Multi-language Support**: Internationalization
- **Advanced Targeting**: AI-powered audience targeting

### Scalability Considerations
- **Database Optimization**: Query optimization
- **Caching**: Redis integration
- **Load Balancing**: Multiple server instances
- **CDN**: Content delivery network

## 🛠️ Troubleshooting

### Common Issues
1. **Database Connection**: Check MySQL service
2. **Environment Variables**: Verify .env files
3. **CORS Issues**: Configure CORS middleware
4. **JWT Token**: Check token expiration

### Development Tips
1. **Use Development OTP**: 123456 for testing
2. **Check Console Logs**: Monitor API responses
3. **Database Migrations**: Run after schema changes
4. **Environment Switching**: Use correct environment files

---

**Last Updated**: July 2024
**Version**: 1.0.0
**Maintainer**: Panel Sam Development Team

