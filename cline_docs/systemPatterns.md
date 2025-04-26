# System Patterns

This document outlines the key architectural and design patterns used in the Coloring Book SPA.

## Architecture Overview

The application follows a modern full-stack architecture:

```
Client <--> Backend API <--> External Services
   |           |
   |           v
   |       Database
   |
   v
User's Browser
```

### Frontend Architecture

The frontend uses a component-based architecture with React:

- **Component Structure**: Follows atomic design principles with reusable UI components
- **State Management**: Uses React hooks and context for state management
- **Routing**: React Router for navigation and route protection
- **Authentication**: Clerk for user authentication
- **API Communication**: Axios for backend API requests
- **Form Handling**: React Hook Form for form validation

### Backend Architecture

The backend follows a layered architecture pattern:

- **Routes Layer**: Express routes to define API endpoints
- **Controller Layer**: Business logic separated by resource type
- **Service Layer**: Interfaces with external services (S3, OpenAI, etc.)
- **Utility Layer**: Shared utilities including middleware

### Authentication & Authorization

- **Authentication**: Implemented using Clerk
- **Frontend**: User sessions managed by Clerk components
- **Backend**: JWT validation through middleware
- **Development Mode**: Auto-authentication for easier local development

### File Upload Pipeline

```
Frontend Upload -> Backend API -> S3 Storage -> Processing Queue -> PDF Generation
```

1. User uploads photos via drag-and-drop
2. Files are sent to backend API
3. Backend uploads to S3 (LocalStack locally, AWS in production)
4. Image processing is triggered (simulated now, will use OpenAI API)
5. Final PDFs are stored in S3 and linked to user's order

### Debugging Infrastructure

- **S3 Debugging Endpoints**: Custom endpoints for verifying S3 functionality:
  - `/api/uploads/debug/list-buckets`
  - `/api/uploads/debug/list-files/{bucket-name}`
  - `/api/uploads/debug/upload-test`

- **LocalStack**: Used to simulate AWS S3 locally without requiring actual AWS credentials

### Database Schema (Planned)

```
Users
  |
  |--> Orders
         |
         |--> OrderItems
         |
         |--> OrderStatus
```

## Key Design Patterns

1. **Repository Pattern**: For database operations (planned for implementation)
2. **Middleware Pattern**: For cross-cutting concerns like authentication and logging
3. **Facade Pattern**: Backend controllers provide a simplified interface to complex subsystems
4. **Strategy Pattern**: Different processing strategies based on order type (digital vs. physical)
5. **Observer Pattern**: Status updates for long-running processes

## Environment-Specific Behaviors

- **Development**:
  - Mock authentication
  - LocalStack for S3
  - Debug endpoints enabled
  - In-memory storage where applicable

- **Production** (Planned):
  - Real Clerk authentication
  - AWS S3 storage
  - OpenAI API integration
  - PostgreSQL persistent storage
