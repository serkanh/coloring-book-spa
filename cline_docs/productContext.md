# Product Context

## Why This Project Exists

This project exists to provide a service that transforms users' personal photos into a custom coloring book. It allows users to create personalized coloring books from their own photographs, either as digital downloads or physical printed copies.

## Problems It Solves

- Provides a convenient way to transform regular photos into coloring book style images
- Creates personalized gifts or entertainment from existing photos
- Offers both digital and physical coloring book options, catering to different user preferences
- Simplifies the process of creating custom coloring books without requiring graphic design skills

## How It Should Work

1. Users register and log in to the platform
2. Users upload 8-24 photos through a drag-and-drop interface
3. The system processes these photos using the OpenAI Image API to convert them to coloring book style
4. Users select their preferred order type (Digital Download or Physical Copy)
5. For physical copies, users provide shipping information and select paper type
6. Users complete payment for their order
7. The system generates a PDF of the processed images
8. Digital Download users receive the PDF via email, while Physical Copy orders are sent for printing and shipping
9. All original photos and final PDFs are stored securely in AWS S3 buckets
