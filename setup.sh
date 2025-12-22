#!/bin/bash

echo "Setting up PyMC Model Builder..."

# 環境変数ファイルをコピー
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file"
fi

# Dockerコンテナをビルド・起動
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo ""
echo "Setup complete!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose down"
