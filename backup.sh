#!/bin/bash
# backup.sh - Скрипт для бэкапа MongoDB и файлов

set -e  # Остановка при ошибке

BACKUP_DIR="./backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="quiz-bot"

# Создаем директорию для backup
mkdir -p $BACKUP_DIR

echo "📦 Создание бэкапа MongoDB..."

# Проверяем, запущен ли Docker контейнер
if docker ps | grep -q "quiz-mongo-dev\|quiz-mongo"; then
    # Определяем имя контейнера
    if docker ps | grep -q "quiz-mongo-dev"; then
        CONTAINER_NAME="quiz-mongo-dev"
    else
        CONTAINER_NAME="quiz-mongo"
    fi
    
    echo "   Используется Docker контейнер: $CONTAINER_NAME"
    
    # Создаем backup через Docker
    docker exec $CONTAINER_NAME mongodump --out=/data/backup --db=$DB_NAME --quiet
    docker cp $CONTAINER_NAME:/data/backup $BACKUP_DIR/mongodb_$DATE
    
    echo "   ✅ MongoDB backup создан через Docker"
    
elif command -v mongodump &> /dev/null; then
    # Используем локальный mongodump
    echo "   Используется локальный mongodump"
    
    # Пытаемся получить URI из .env или используем дефолтный
    if [ -f .env ] || [ -f backend/.env ]; then
        ENV_FILE=$([ -f .env ] && echo ".env" || echo "backend/.env")
        MONGODB_URI=$(grep MONGODB_URI $ENV_FILE | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    else
        MONGODB_URI="mongodb://localhost:27017/$DB_NAME"
    fi
    
    # Создаем backup локально
    mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR/mongodb_$DATE --quiet
    
    echo "   ✅ MongoDB backup создан локально"
else
    echo "   ⚠️  Не найден ни Docker контейнер, ни mongodump. Пропускаем MongoDB backup."
fi

# Backup файлов uploads
if [ -d "backend/uploads" ]; then
    echo "📁 Создание бэкапа файлов..."
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C backend uploads/ 2>/dev/null || true
    echo "   ✅ Backup файлов создан"
fi

# Показываем размер и список файлов
echo ""
echo "✅ Бэкап создан в $BACKUP_DIR/"
echo "📊 Размер backup:"
du -sh $BACKUP_DIR/mongodb_$DATE 2>/dev/null || echo "   MongoDB backup не создан"
du -sh $BACKUP_DIR/uploads_$DATE.tar.gz 2>/dev/null || echo "   Файлы backup не создан"
echo ""
echo "📋 Список файлов:"
ls -lh $BACKUP_DIR/ | tail -n +2
