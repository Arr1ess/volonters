FROM node:20-alpine AS builder
WORKDIR /app

# Копируем только package files для кэширования
COPY package*.json ./

# Устанавливаем зависимости с оптимизацией
RUN npm install --prefer-offline --no-audit --no-fund --progress=false

# Копируем исходники
COPY . .

# Собираем
RUN npm run build

# Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
