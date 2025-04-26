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

### Backend

- FastAPI (Python) or Node.js (Express) for API server
- PostgreSQL for database
- AWS SDK for cloud service integration
- JWT for API authentication
- PDFKit or similar for PDF generation

### Cloud Services

- AWS S3 for file storage (3 buckets: uploads, processed, final-pdfs)
- AWS Lambda for serverless image processing
- AWS CloudFront (optional) for CDN delivery of PDFs
- OpenAI API for image transformation

### Infrastructure & DevOps

- Terraform for infrastructure as code
- Docker for containerization
- Docker Compose for local development
- GitHub Actions or similar for CI/CD (optional)

## Development Setup

### Prerequisites

- Node.js (v16+)
- Python (v3.9+) if using FastAPI
- PostgreSQL
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose
- Terraform CLI

### Environment Variables

Frontend (.env.local):

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_CLERK_FRONTEND_API=your_clerk_frontend_api
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
   - Backend: `pip install -r requirements.txt` or `npm install`
3. Start services with Docker Compose: `docker-compose up`
4. Access frontend at <http://localhost:3000>
5. Backend API available at <http://localhost:8000/api>

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
