#!/bin/bash
# backup.sh - Скрипт для бэкапа данных

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Создание бэкапа MongoDB..."
docker exec quiz-mongo-dev mongodump --out=/data/backup --db=quiz-bot
docker cp quiz-mongo-dev:/data/backup $BACKUP_DIR/mongodb_$DATE

echo "📁 Создание бэкапа файлов..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

echo "✅ Бэкап создан в $BACKUP_DIR/"
ls -lh $BACKUP_DIR/