# --- GIAI ĐOẠN 1: BUILD ---
FROM node:18-alpine AS builder

WORKDIR /app

# Sao chép package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Sao chép source code
COPY tsconfig.json ./
COPY src ./src

# Biên dịch TypeScript thành JavaScript
RUN npm run build

# --- GIAI ĐOẠN 2: RUN ---
FROM node:18-alpine

WORKDIR /app

# Cài đặt dumb-init để quản lý process signals
RUN apk add --no-cache dumb-init

# Tạo user không phải root (bảo mật)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Sao chép package files
COPY package*.json ./

# Cài đặt chỉ production dependencies (bỏ dev dependencies)
RUN npm ci --only=production && \
    npm cache clean --force

# Chỉ lấy file được biên dịch từ builder (GIAI ĐOẠN 1)
COPY --from=builder /app/dist ./dist

# Thay đổi quyền sở hữu file
RUN chown -R nodejs:nodejs /app

# Chuyển sang user không phải root
USER nodejs

# Mở cổng
EXPOSE 5000

# Health check - kiểm tra sức khỏe ứng dụng
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Lệnh "bật công tắc" để chạy ứng dụng
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
