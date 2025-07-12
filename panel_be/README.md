# Panel Sam Backend

A Node.js/Express backend API for the Panel Sam survey platform, built with TypeScript and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: Admin, Researcher, and Panelist user roles
- 📊 **Survey Management**: Create, manage, and distribute surveys
- 🎯 **Target Audience**: Filter surveys based on demographics
- 📈 **Analytics**: Survey statistics and user analytics
- 🔒 **Security**: Input validation, rate limiting, and security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend**
   ```bash
   cd panel_be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/panel_sam
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if using local instance)
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or start manually
   mongod
   ```

## Development

### Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot reload enabled.

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users` - Get all users (admin/researcher)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update own profile
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/stats/overview` - User statistics (admin)

### Surveys
- `GET /api/surveys` - Get all surveys
- `GET /api/surveys/:id` - Get survey by ID
- `POST /api/surveys` - Create new survey (researcher)
- `PUT /api/surveys/:id` - Update survey (researcher)
- `DELETE /api/surveys/:id` - Delete survey (researcher)
- `GET /api/surveys/available/panelist` - Get available surveys for panelists
- `GET /api/surveys/stats/overview` - Survey statistics (researcher)

### Panelists
- `GET /api/panelists/dashboard` - Panelist dashboard
- `GET /api/panelists/profile` - Get panelist profile
- `PUT /api/panelists/profile` - Update panelist profile
- `GET /api/panelists/survey-history` - Survey history
- `GET /api/panelists/stats/:panelistId` - Panelist statistics (researcher)
- `GET /api/panelists/all` - Get all panelists (researcher)
- `GET /api/panelists/demographics` - Panelist demographics (researcher)

## User Roles

### Admin
- Full access to all features
- User management
- System statistics

### Researcher
- Create and manage surveys
- View survey responses
- Access panelist data
- Analytics and reporting

### Panelist
- Complete surveys
- Manage profile
- View available surveys
- Track participation history

## Database Models

### User
- Authentication details
- Profile information
- Role-based permissions
- Preferences and settings

### Survey
- Survey configuration
- Questions and options
- Target audience criteria
- Settings and rewards

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet for additional security headers

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/panel_sam |
| `JWT_SECRET` | JWT signing secret | (required) |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # Database connection
├── controllers/     # Route controllers (future)
├── middleware/      # Custom middleware
│   └── auth.ts      # Authentication middleware
├── models/          # Database models
│   ├── User.ts      # User model
│   └── Survey.ts    # Survey model
├── routes/          # API routes
│   ├── auth.ts      # Authentication routes
│   ├── users.ts     # User management routes
│   ├── surveys.ts   # Survey management routes
│   └── panelists.ts # Panelist-specific routes
├── services/        # Business logic (future)
├── utils/           # Utility functions (future)
└── server.ts        # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 