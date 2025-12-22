FROM node:20-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
