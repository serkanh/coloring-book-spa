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

### Environment Files

Before running the application, you need to set up the environment files:

#### Backend Environment (.env)

Create a `backend/.env` file with the following variables:

```
PORT=8000
NODE_ENV=development

# Database configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/coloringbook

# AWS configuration
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1

# S3 bucket names
S3_UPLOAD_BUCKET=coloringbook-uploads
S3_PROCESSED_BUCKET=coloringbook-processed
S3_FINAL_BUCKET=coloringbook-final-pdfs

# OpenAI API key for image processing
OPENAI_API_KEY=your_openai_api_key

# Toggle to use mock processing instead of real OpenAI API
USE_MOCK_OPENAI=false

# Minimum number of images required for creating a coloring book
MIN_IMAGES_REQUIRED=2

# Clerk authentication
CLERK_API_KEY=your_clerk_api_key
```

#### Frontend Environment (.env.local)

Create a `frontend/.env.local` file with the following variables:

```
VITE_API_URL=http://localhost:8000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Minimum number of images required for creating a coloring book
VITE_MIN_IMAGES_REQUIRED=2
```

### Running the Application

#### Full Stack (Docker Compose)

Run the entire application (backend, PostgreSQL, and LocalStack) with Docker Compose:

```
docker compose up -d
```

Access the application:

- Backend API: <http://localhost:8000/api>
- LocalStack (AWS services): <http://localhost:4566>
- PostgreSQL: localhost:5432

To view logs:

```
docker compose logs -f
```

To stop the application:

```
docker compose down
```

#### Frontend Only (Local Development)

If you want to run just the frontend locally while using the dockerized backend:

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

### PDF Generation

- `POST /api/pdfs/generate`: Generate a PDF from a list of processed image URLs
- `GET /api/pdfs/status/:jobId`: Check the status of a PDF generation job
- `GET /api/pdfs/list`: List all PDFs generated by the current user

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

## PDF Generation

The application generates PDF coloring books from the processed images:

1. User selects processed images and clicks "Create Coloring Book"
2. Frontend sends the list of image URLs to the backend
3. Backend retrieves images directly from S3 (not via HTTP)
4. PDFKit library is used to create a professional-quality PDF with:
   - Cover page including the book title
   - Page numbers
   - Properly sized and centered images
   - Instructions for coloring
5. The generated PDF is stored in S3
6. User receives a download link to the final PDF

The S3-direct approach ensures that images can be accessed reliably within Docker containers without relying on external HTTP URLs that might not resolve correctly in a containerized environment.

## Next Steps for Production

This application is nearly complete for image processing and PDF generation but still needs work in other areas. In a production environment, you would need to:

1. ✅ Implement actual integration with the OpenAI Image API for photo transformation
2. ✅ Implement PDF generation from processed images
3. Set up real AWS resources for S3 storage
4. Implement a real payment processing system
5. Configure Clerk with your own API keys
6. Complete the database integration for order storage
