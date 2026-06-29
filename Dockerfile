# JVision 포트폴리오 허브 — Node 서버 이미지
# HWP→PDF 변환을 위해 LibreOffice + 한글 폰트를 포함한다.
FROM node:22-bookworm-slim

# LibreOffice(HWP 임포트 필터 포함) + 한글 폰트(CJK/나눔)
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer libreoffice-core \
      fonts-noto-cjk fonts-nanum \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 (dev 포함 — 빌드에 필요)
COPY package*.json ./
RUN npm ci

# 소스 복사 후 prisma client 생성 + 프로덕션 빌드
COPY . .
RUN npx prisma generate && npm run build

# 런타임 환경 — 데이터는 영구 볼륨(/data)에 저장
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/prod.db \
    UPLOAD_DIR=/data/uploads

EXPOSE 3000

# 시작 시 DB 마이그레이션 적용 후 서버 기동
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p 3000 -H 0.0.0.0"]
