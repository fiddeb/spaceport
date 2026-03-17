FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
ARG VITE_SPACEPORT_ENV=docker
ENV VITE_SPACEPORT_ENV=$VITE_SPACEPORT_ENV
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY <<'CONF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /otlp/ {
        proxy_pass http://otel-collector.k8s.test/;
        proxy_set_header Host otel-collector.k8s.test;
    }

    location /chaos/ {
        proxy_pass http://pricing-service:8000/;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://api:8080/api/;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
CONF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
