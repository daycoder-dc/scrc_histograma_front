FROM node:24.14-slim AS build

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build --configuration=production

FROM nginx:stable

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/sakai-ng/browser /usr/share/nginx/html

EXPOSE 80
