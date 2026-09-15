FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /app/videos

ENV NODE_ENV=production
ENV VIDEO_STORAGE_PATH=/app/videos
EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
