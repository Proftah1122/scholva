FROM node:18-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-utils/package.json packages/shared-utils/package.json
RUN npm ci --include=dev

FROM deps AS build
COPY . .
RUN npm run build -w @scholva/shared-types
RUN npm run build -w @scholva/shared-utils
RUN npm run build -w @scholva/api

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
CMD ["node", "apps/api/dist/index.js"]
