# Revathi Enterprises Frontend

A modern React TypeScript frontend for the Revathi Enterprises application.

## Features

- **Authentication**: Login/Register with JWT tokens
- **User Management**: CRUD operations for users
- **Profile Management**: User profile updates
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Form Validation**: Client-side validation with React Hook Form and Zod
- **State Management**: React Query for server state management
- **Modern UI**: Clean, professional interface with Lucide React icons

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **React Query** for server state management
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd revathi-enterprises-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API URL:

   ```env
   VITE_API_URL=http://localhost:3001
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Button component
│   ├── Input.tsx       # Input component
│   ├── Modal.tsx       # Modal component
│   ├── Layout.tsx      # Main layout component
│   └── ProtectedRoute.tsx  # Route protection
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Dashboard.tsx   # Dashboard page
│   ├── Users.tsx       # User management page
│   └── Profile.tsx     # User profile page
├── services/           # API services
│   ├── api.ts          # Axios configuration
│   ├── authService.ts  # Authentication API
│   └── userService.ts  # User management API
├── context/            # React context
│   └── AuthContext.tsx # Authentication context
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
└── utils/              # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend is designed to work with the NestJS backend. Make sure the backend is running on `http://localhost:3001` or update the `VITE_API_URL` in your `.env` file.

### API Endpoints Used

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get current user profile
- `GET /users` - Get all users
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Authentication

The application uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests via Axios interceptors.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
