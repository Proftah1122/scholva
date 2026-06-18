FROM node:18-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --include=dev

FROM deps AS build
COPY . .
RUN npm run build -w @scholva/shared-types
RUN npm run build -w @scholva/worker

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/worker/dist /app/apps/worker/dist
CMD ["node", "apps/worker/dist/index.js"]
