# JVision 포트폴리오 허브 — 경량 Node 이미지 (DB·파일은 Supabase 사용)
# 무료 호스팅(예: Render)에 맞춘 슬림 이미지. HWP→PDF 변환(LibreOffice)은 미포함.
# 큰 서버에서 HWP 미리보기를 켜려면 LibreOffice 설치 + ENABLE_HWP_CONVERT=1 설정.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# 시작 시 DB 마이그레이션 적용 후 서버 기동
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p 3000 -H 0.0.0.0"]
