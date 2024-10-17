# Sử dụng Node.js làm base image
FROM node:20-alpine AS build

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ source code
COPY . .

# Build ứng dụng
RUN npm run build

# Sử dụng Nginx để phục vụ ứng dụng đã build
FROM nginx:alpine

# Sao chép các file đã build từ stage trước vào thư mục serve của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8008
EXPOSE 8008

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]
