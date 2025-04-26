FROM node:18-alpine as build

WORKDIR /app

# Copy necessary config files first
COPY package.json package-lock.json ./
COPY postcss.config.js tailwind.config.js tsconfig.json vite.config.ts ./

# Install dependencies
RUN npm install

# Copy remaining project files
COPY . .

# For development, start with environment variable to skip the browser opening
ENV BROWSER=none
CMD ["npm", "run", "dev"]
