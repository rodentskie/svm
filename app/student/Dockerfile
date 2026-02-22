ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} 

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"


COPY --chown=node:node ./public ./public
COPY --chown=node:node ./.next/standalone/node_modules ./node_modules
COPY --chown=node:node ./.next/standalone/app/app ./
COPY --chown=node:node ./.next/static ./.next/static

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]