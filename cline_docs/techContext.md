# Technical Context

## Technologies Used

### Frontend

- React for UI components and application logic
- TailwindCSS for styling
- React Router for client-side routing
- React Hook Form for form handling
- Axios for API requests
- Clerk SDK for authentication
- Dropzone for file uploads
- Base64 image encoding for direct preview rendering

### Backend

- Node.js (Express) for API server
- TypeScript for type safety
- AWS SDK for cloud service integration
- Multer for file handling
- JWT for API authentication
- OpenAI API for image transformation
- Base64 encoding for efficient image transfer
- PDFKit or similar for PDF generation (planned)

### Cloud Services

- AWS S3 for file storage (3 buckets: uploads, processed, final-pdfs)
- AWS Lambda for serverless image processing (planned)
- AWS CloudFront (optional) for CDN delivery of PDFs (planned)
- OpenAI API for image transformation to coloring book style

### Infrastructure & DevOps

- Terraform for infrastructure as code
- Docker for containerization
- Docker Compose for local development
- GitHub Actions or similar for CI/CD (optional)

## Development Setup

### Prerequisites

- Node.js (v16+)
- OpenAI API key
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose
- Terraform CLI

### Environment Variables

Frontend (.env.local):

```
VITE_API_URL=http://localhost:8000/api
VITE_CLERK_FRONTEND_API=your_clerk_frontend_api
```

Backend (.env):

```
DATABASE_URL=postgresql://user:password@localhost:5432/coloringbook
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-west-2
S3_UPLOAD_BUCKET=coloringbook-uploads
S3_PROCESSED_BUCKET=coloringbook-processed
S3_FINAL_BUCKET=coloringbook-final-pdfs
OPENAI_API_KEY=your_openai_api_key
CLERK_API_KEY=your_clerk_api_key
```

### Local Development

1. Clone repository
2. Install dependencies:
   - Frontend: `npm install` or `yarn install`
   - Backend: `npm install`
3. Start services with Docker Compose: `docker-compose up`
4. Access frontend at <http://localhost:5173>
5. Backend API available at <http://localhost:8000/api>

## Image Processing Pipeline

### Technical Implementation

1. User uploads image via React Dropzone component
2. Frontend sends image to backend API
3. Backend:
   - Receives file via Multer middleware
   - Generates a processing job ID
   - Stores temporary file in disk
   - Calls OpenAI API with image and prompt
   - Receives base64-encoded processed image
   - Returns base64 data to frontend for immediate display
   - Optionally stores in S3 when confirmed
4. Frontend displays base64 data directly in img tag

This approach solves cross-container file access issues by using base64 data transfer instead of relying on filesystem paths.

## Technical Constraints

### Security Requirements

- No exposure of AWS or OpenAI API keys to frontend
- Use signed S3 URLs for upload/download operations
- Sanitize and validate all uploaded files:
  - Only accept JPG, PNG formats
  - Implement reasonable size limits
  - Encrypt sensitive data at rest and in transit

### Performance Considerations

- Optimize image uploads for large files
- Use asynchronous processing for image transformation
- Implement proper caching strategies
- Consider CDN for delivering final PDFs
- Balance between base64 and URL-based approaches for optimal network usage

### Scalability Requirements

- Design for horizontal scaling of backend services
- Use serverless functions for CPU-intensive tasks
- Implement database connection pooling
- Design with stateless architecture principles

### Browser Compatibility

- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure mobile responsiveness
- Implement accessible UI components
- Test on multiple device sizes
