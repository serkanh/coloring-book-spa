# Coloring Book SPA

A full-stack web application that turns your photos into customized coloring books. Users can upload photos, select between digital downloads or physical copies, and complete the ordering process.

## Features

- User authentication with Clerk
- Drag and drop photo upload (8-24 photos)
- Photo transformation to coloring book style using OpenAI Image API
- Base64 image processing for seamless previews
- Choice between digital download and physical print
- Paper type selection for physical copies
- Shipping information collection
- Order processing and confirmation
- S3 integration for file storage
- Responsive, mobile-friendly design

## Technologies Used

### Frontend

- React with TypeScript
- TailwindCSS for styling
- React Router for navigation
- React Dropzone for file uploads
- React Hook Form for form management
- Base64 image encoding for direct display

### Backend

- Node.js with Express
- TypeScript
- OpenAI API for image processing
- AWS SDK for S3 integration
- Multer for file handling

### Infrastructure

- Docker and Docker Compose for local development
- LocalStack for simulating AWS services locally
- PostgreSQL for database

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development outside of Docker)
- Git
- OpenAI API key

### Running the Application

#### Backend Services Only

1. Start the backend services with Docker Compose:

   ```
   docker-compose up
   ```

2. Access the backend services:
   - Backend API: <http://localhost:8000/api>
   - LocalStack (AWS services): <http://localhost:4566>
   - PostgreSQL: localhost:5432

#### Frontend (Local Development)

Due to some compatibility issues with TailwindCSS in Docker, it's recommended to run the frontend locally:

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Access the frontend at:
   - <http://localhost:5173>

## Project Structure

```
coloring-book-spa/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API services
│   ├── public/               # Static files
│   └── Dockerfile            # Frontend Docker configuration
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── models/           # Data models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   └── Dockerfile            # Backend Docker configuration
│
├── localstack/               # LocalStack initialization scripts
└── docker-compose.yml        # Docker Compose configuration
```

## API Endpoints

### Authentication

- Authentication is handled by Clerk. The backend uses a simple middleware to validate authentication tokens.

### Uploads

- `POST /api/uploads/image`: Upload images
- `GET /api/uploads/status/:uploadId`: Get upload processing status
- `GET /api/uploads/presigned-url`: Get pre-signed URL for direct S3 upload
- `POST /api/uploads/process`: Process an image with OpenAI
- `GET /api/uploads/process/status/:jobId`: Get processing status, includes base64 image data when complete
- `GET /api/uploads/process/image/:jobId`: Get the processed image (fallback for non-base64 approach)
- `POST /api/uploads/process/confirm/:jobId`: Confirm processed image and upload to S3
- `DELETE /api/uploads/process/cancel/:jobId`: Cancel a processing job

### S3 Debugging Endpoints

The following endpoints are available for debugging S3 connections in local development:

- `GET /api/uploads/debug/list-buckets`: List all S3 buckets in LocalStack
- `GET /api/uploads/debug/list-files/{bucket-name}`: List all files in a specific bucket
- `POST /api/uploads/debug/upload-test`: Upload a test file to verify S3 functionality

These endpoints don't require authentication, making it easy to test S3 integration directly.

### Orders

- `POST /api/orders`: Create a new order
- `GET /api/orders`: Get user's orders
- `GET /api/orders/:orderId`: Get order details
- `PATCH /api/orders/:orderId/status`: Update order status
- `POST /api/orders/:orderId/payment`: Process payment

### Users

- `POST /api/users/profile`: Create user profile
- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `GET /api/users/downloads/:orderId`: Get download URL for completed orders

## Image Processing

The application uses the OpenAI Image API to convert photos to coloring book style. The process works as follows:

1. User uploads an image
2. Backend sends the image to OpenAI API
3. API returns the processed image as base64-encoded data
4. Backend returns this data directly to the frontend for immediate display
5. When confirmed, the image is stored in S3 for permanent storage
6. The base64 approach eliminates cross-container file access issues in Docker

## Next Steps for Production

This application is nearly complete for image processing but still needs work in other areas. In a production environment, you would need to:

1. ✅ Implement actual integration with the OpenAI Image API for photo transformation
2. Set up real AWS resources for S3 storage
3. Implement a real payment processing system
4. Configure Clerk with your own API keys
5. Implement PDF generation from processed images
6. Complete the database integration for order storage
