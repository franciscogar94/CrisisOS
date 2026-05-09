FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/bff/package.json ./apps/bff/
RUN npm ci -w bff --include=dev --ignore-scripts
COPY apps/bff ./apps/bff
RUN npm run build -w bff

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4010
COPY package.json package-lock.json ./
COPY apps/bff/package.json ./apps/bff/
RUN npm ci -w bff --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/apps/bff/dist ./apps/bff/dist
EXPOSE 4010
CMD ["node", "apps/bff/dist/server.js"]
