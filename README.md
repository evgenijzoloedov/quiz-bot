# Telegram Quiz Bot with CRM

Telegram бот для проведения интерактивных квизов с выбором персонажа + CRM панель для управления контентом.

## 🏗 Архитектура

- **Backend**: Node.js + Express + MongoDB
- **Telegram Bot**: node-telegram-bot-api
- **Frontend CRM**: React + TypeScript + TailwindCSS
- **Database**: MongoDB

## 📋 Требования

- Node.js 18+
- MongoDB 6.0+
- Docker & Docker Compose (для production)

## 🚀 Быстрый старт (Development)

### 1. Клонируйте репозиторий

```bash
git clone <repo-url>
cd team_bot_quiz
```

### 2. Запустите MongoDB

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Настройте Backend

```bash
cd backend
cp .env.example .env
# Отредактируйте .env и укажите:
# - TELEGRAM_BOT_TOKEN (получите у @BotFather)
# - JWT_SECRET (минимум 32 символа)
# - ADMIN_TELEGRAM_ID (ваш Telegram ID)
```

### 4. Установите зависимости и запустите Backend

```bash
npm install
npm run seed  # Создаст первого админа
npm run dev
```

### 5. Настройте Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 6. Откройте CRM

- CRM: http://localhost:5173
- API: http://localhost:5000/api
- Health: http://localhost:5000/health

## 🐳 Production (Docker)

### 1. Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```env
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=your_secure_password

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# JWT
JWT_SECRET=your_super_secret_key_minimum_32_characters

# URLs
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://crm.yourdomain.com

# Admin
ADMIN_TELEGRAM_ID=your_telegram_id
```

### 2. Запустите контейнеры

```bash
docker-compose up -d --build
```

### 3. Создайте первого админа

```bash
docker exec -it quiz-backend npm run seed
```

## 📁 Структура проекта

```
team_bot_quiz/
├── backend/
│   ├── src/
│   │   ├── bot/           # Telegram bot логика
│   │   ├── config/        # Конфигурация
│   │   ├── controllers/   # API контроллеры
│   │   ├── middleware/    # Middleware
│   │   ├── models/        # MongoDB модели
│   │   ├── routes/        # API роуты
│   │   └── utils/         # Утилиты
│   ├── uploads/           # Загруженные файлы
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API клиент
│   │   ├── components/    # React компоненты
│   │   ├── context/       # React контексты
│   │   ├── pages/         # Страницы
│   │   ├── types/         # TypeScript типы
│   │   └── utils/         # Утилиты
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔐 Авторизация

1. Добавьте ваш Telegram ID в базу админов
2. Откройте CRM и введите ваш Telegram ID
3. Получите JWT токен и доступ к панели

## 🎮 Функционал бота

- `/start` - Начать квиз, выбрать персонажа
- `/help` - Справка
- `/cancel` - Отменить текущий квиз

## 📊 API Endpoints

### Auth
- `POST /api/auth/login` - Авторизация
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

### Characters
- `GET /api/characters` - Список персонажей
- `POST /api/characters` - Создать персонажа
- `PUT /api/characters/:id` - Обновить
- `DELETE /api/characters/:id` - Удалить

### Questions
- `GET /api/characters/:id/questions` - Вопросы персонажа
- `POST /api/characters/:id/questions` - Создать вопрос
- `PUT /api/questions/:id` - Обновить
- `DELETE /api/questions/:id` - Удалить

### Analytics
- `GET /api/analytics/overview` - Общая статистика
- `GET /api/analytics/characters/:id` - Статистика персонажа

## 🛠 Разработка

### Backend

```bash
cd backend
npm run dev    # Запуск с nodemon
npm run lint   # Проверка кода
npm run seed   # Создать админа
```

### Frontend

```bash
cd frontend
npm run dev    # Запуск dev сервера
npm run build  # Сборка production
npm run lint   # Проверка кода
```

## 📝 Лицензия

MIT

