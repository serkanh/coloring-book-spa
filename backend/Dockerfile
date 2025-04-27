FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies, OpenAI, and Sharp
RUN npm install && npm install openai sharp

# Copy project files
COPY . .

# Expose port
EXPOSE 8000

# Start the development server
CMD ["npm", "run", "dev"]
