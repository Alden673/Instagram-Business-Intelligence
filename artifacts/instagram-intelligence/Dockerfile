FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
ARG PORT=8080
ENV PORT=${PORT}
ENV BASE_PATH=/
RUN pnpm --filter @workspace/instagram-intelligence run build

FROM nginx:alpine
COPY --from=build /app/artifacts/instagram-intelligence/dist/public /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]