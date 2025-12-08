# TELEGRAM QUIZ BOT WITH CRM
## Product Requirements Document (PRD)

**Версия**: 1.0  
**Дата**: December 2025  
**Статус**: Development Specification  
**Язык разработки**: Node.js + React  

---

## 📋 ОГЛАВЛЕНИЕ

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура системы](#архитектура-системы)
3. [Telegram Bot - Функциональность](#telegram-bot---функциональность)
4. [CRM Backend API](#crm-backend-api)
5. [CRM Web Interface](#crm-web-interface)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Security](#authentication--security)
9. [File Storage](#file-storage)
10. [Error Handling](#error-handling)
11. [Deployment](#deployment)

---

## 1. ОБЗОР ПРОЕКТА

### 1.1 Описание
Telegram бот для проведения интерактивных квизов с выбором персонажа. Каждый персонаж имеет уникальный набор вопросов, типы ответов, медиа-контент и связанные PDF файлы.

### 1.2 Основные компоненты
- **Telegram Bot** (Node.js) — интерактивный бот для пользователей
- **Backend API** (Node.js + Express) — управление данными и логика
- **CRM Web Interface** (React) — админ-панель для редактирования контента
- **Database** (MongoDB) — хранение всех данных
- **File Storage** (локальное или S3) — хранение изображений и PDF

### 1.3 Целевые пользователи
- **End Users**: Люди, проходящие квизы в Telegram
- **Admins**: Люди с конкретным Telegram ID, редактирующие квизы в CRM

---

## 2. АРХИТЕКТУРА СИСТЕМЫ

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    TELEGRAM USERS                             │
│                  (End Users - No Auth)                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
         ┌───────────────▼────────────────┐
         │   TELEGRAM BOT (Node.js)       │
         │  ├─ Polling/Webhook from TG   │
         │  ├─ Session Management        │
         │  ├─ Quiz Logic                │
         │  └─ Message/Media Handling    │
         └───────────────┬────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │   BACKEND API (Express)          │
         │  ├─ Character CRUD              │
         │  ├─ Question CRUD               │
         │  ├─ Quiz Flow                   │
         │  ├─ Authentication (Telegram)   │
         │  └─ File Management             │
         └───────────────┬──────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │   MONGODB DATABASE               │
         │  ├─ Characters                  │
         │  ├─ Questions                   │
         │  ├─ Users Progress              │
         │  ├─ Admins (Telegram IDs)       │
         │  └─ Analytics                   │
         └──────────────────────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │   FILE STORAGE                   │
         │  ├─ /uploads/images/            │
         │  ├─ /uploads/pdfs/              │
         │  └─ /uploads/memes/             │
         └──────────────────────────────────┘
                         ▲
         ┌───────────────┴──────────────────┐
         │   CRM WEB INTERFACE (React)      │
         │  ├─ Admin Panel                 │
         │  ├─ Character Management        │
         │  ├─ Quiz Builder                │
         │  ├─ Analytics Dashboard         │
         │  └─ File Upload                 │
         └──────────────────────────────────┘
                         ▲
         ┌───────────────┴──────────────────┐
         │   ADMIN USERS (Telegram ID Auth) │
         │   (Only specific Telegram IDs)   │
         └──────────────────────────────────┘
```

### 2.2 Technology Stack

```
Backend:
- Node.js (v18+)
- Express.js (API server)
- node-telegram-bot-api (Telegram integration)
- Mongoose (MongoDB ODM)
- dotenv (Configuration)
- cors (Cross-origin requests)
- bcryptjs (Password/token hashing - optional)
- jsonwebtoken (JWT for API sessions)
- multer (File uploads)

Frontend (CRM):
- React 18+
- TypeScript (recommended)
- Axios (HTTP client)
- React Router v6
- TailwindCSS or Material-UI (styling)
- React Hook Form (form management)
- React Query or SWR (data fetching)
- React-Dropzone (file uploads)

Database:
- MongoDB 5.0+
- Mongoose 7.0+

File Storage:
- Local filesystem (/uploads) for development
- AWS S3 or similar for production (optional)

Deployment:
- Docker (containerization)
- Railway, DigitalOcean, or Render (hosting)
- GitHub Actions (CI/CD)

Development:
- nodemon (auto-reload)
- eslint + prettier (code quality)
- Jest (testing - optional)
```

---

## 3. TELEGRAM BOT - ФУНКЦИОНАЛЬНОСТЬ

### 3.1 User Flow

#### 3.1.1 Start Command
```
/start
  ↓
Display welcome message with character selection inline buttons
```

**Сообщение:**
```
Привет! 👋 Добро пожаловать в Quiz Bot!

Выбери персонажа и пройди квиз:
```

**Inline Buttons:**
- Кнопка на каждого персонажа (callback_data: `char_<characterId>`)
- Максимум 10 кнопок (по числу персонажей)

#### 3.1.2 Character Selection
```
User clicks character button → Store in session → Load first question
```

**Действия:**
1. Сохранить `characterId` в `userSessions` Map
2. Инициализировать `currentQuestionIndex = 0`
3. Инициализировать `answers = []`
4. Загрузить первый вопрос из Character.questions[0]

#### 3.1.3 Question Display

**Структура вопроса:**

```javascript
{
  "_id": ObjectId,
  "questionText": "Какой ответ правильный?",
  "type": "single" | "multiple",
  "image": "https://cdn.../question_image.jpg", // Optional
  "answers": [
    { "id": "ans_1", "text": "Ответ 1", "isCorrect": true },
    { "id": "ans_2", "text": "Ответ 2", "isCorrect": false },
    { "id": "ans_3", "text": "Ответ 3", "isCorrect": false }
  ],
  "correctAnswerIds": ["ans_1"], // Array of IDs that are correct
  "feedbackImage": "https://cdn.../correct_feedback.jpg" // Shows on correct
}
```

**Отправка в Telegram:**

```
1. Если есть image вопроса:
   - Отправить Photo с caption = questionText
   - Attach inline buttons для ответов

2. Если нет image:
   - Отправить обычное сообщение
   - Attach inline buttons для ответов
```

**Buttons Format:**

```
Для single choice:
- Row 1: [Button 1]
- Row 2: [Button 2]
- Row 3: [Button 3]

Для multiple choice:
- Row 1: [Button 1] [Button 2]
- Row 2: [Button 3] [Button 4]
- Row 3: [Confirm ✅] [Cancel ❌]

callback_data format: "answer_<questionId>_<answerId>"
```

### 3.2 Answer Handling

#### 3.2.1 Single Choice Answer

```javascript
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const session = userSessions.get(userId);
  const [action, questionId, answerId] = query.data.split('_');
  
  // Get current question from database
  const character = await Character.findById(session.currentCharacterId);
  const currentQuestion = character.questions[session.currentQuestionIndex];
  
  // Check if answer is correct
  const isCorrect = currentQuestion.correctAnswerIds.includes(answerId);
  
  if (isCorrect) {
    // CORRECT ANSWER
    session.answers.push({
      questionId: currentQuestion._id,
      userAnswers: [answerId],
      isCorrect: true,
      timestamp: new Date()
    });
    
    // Send feedback image
    await bot.sendPhoto(userId, currentQuestion.feedbackImage);
    
    // Move to next question
    session.currentQuestionIndex++;
    
    if (session.currentQuestionIndex < character.questions.length) {
      // Load next question
      await sendQuestion(userId, session);
    } else {
      // Quiz completed
      await completeQuiz(userId, session);
    }
  } else {
    // WRONG ANSWER
    session.answers.push({
      questionId: currentQuestion._id,
      userAnswers: [answerId],
      isCorrect: false,
      timestamp: new Date()
    });
    
    // Send fail message
    await bot.sendMessage(userId, '❌ Упал мкс, попробуйте еще раз');
    
    // Send character's fail meme
    const character = await Character.findById(session.currentCharacterId);
    await bot.sendPhoto(userId, character.failMeme);
    
    // DO NOT MOVE TO NEXT QUESTION - user stays on same question
  }
  
  // Answer callback_query
  await bot.answerCallbackQuery(query.id);
});
```

#### 3.2.2 Multiple Choice Answer

```javascript
// User selects multiple answers - they accumulate in session
// When user clicks "Confirm" button:

const selectedAnswers = session.multipleChoiceSelection || [];
const isAllCorrect = selectedAnswers.length === currentQuestion.correctAnswerIds.length &&
  selectedAnswers.every(id => currentQuestion.correctAnswerIds.includes(id));

if (isAllCorrect) {
  // All correct
  session.answers.push({
    questionId: currentQuestion._id,
    userAnswers: selectedAnswers,
    isCorrect: true,
    timestamp: new Date()
  });
  
  await bot.sendPhoto(userId, currentQuestion.feedbackImage);
  session.currentQuestionIndex++;
  
  if (session.currentQuestionIndex < character.questions.length) {
    await sendQuestion(userId, session);
  } else {
    await completeQuiz(userId, session);
  }
} else {
  // Not all correct or wrong selections
  session.answers.push({
    questionId: currentQuestion._id,
    userAnswers: selectedAnswers,
    isCorrect: false,
    timestamp: new Date()
  });
  
  await bot.sendMessage(userId, '❌ Упал мкс, попробуйте еще раз');
  const character = await Character.findById(session.currentCharacterId);
  await bot.sendPhoto(userId, character.failMeme);
  
  // Reset multiple choice selections
  session.multipleChoiceSelection = [];
}
```

### 3.3 Quiz Completion

#### 3.3.1 All Answers Correct

```javascript
async function completeQuiz(userId, session) {
  const character = await Character.findById(session.currentCharacterId);
  
  // Check if all answers are correct
  const allCorrect = session.answers.every(a => a.isCorrect);
  
  if (allCorrect) {
    // Send success meme
    await bot.sendPhoto(userId, character.successMeme, {
      caption: '🎉 Поздравляем! Все ответы правильные!'
    });
    
    // Send PDF file
    const pdfPath = character.pdfFilePath; // e.g., "/uploads/pdfs/character_123.pdf"
    const pdfStream = fs.createReadStream(pdfPath);
    
    await bot.sendDocument(userId, pdfStream, {
      filename: `${character.name}_certificate.pdf`
    });
    
    // Save progress to database
    await UserProgress.create({
      userId: userId,
      characterId: character._id,
      completedAt: new Date(),
      answersCorrect: true,
      totalQuestions: session.answers.length,
      timeSpent: Date.now() - session.startTime
    });
    
    // Send final message
    await bot.sendMessage(userId, 
      'Благодарим за прохождение квиза! 📚\n\n' +
      'Начать заново: /start'
    );
  } else {
    // Some answers were wrong - show which ones
    const correctCount = session.answers.filter(a => a.isCorrect).length;
    const totalCount = session.answers.length;
    
    await bot.sendMessage(userId, 
      `❌ К сожалению, вы не прошли квиз.\n\n` +
      `Правильно: ${correctCount}/${totalCount}\n\n` +
      `Попробуйте еще раз: /start`
    );
    
    // Save progress but mark as incomplete
    await UserProgress.create({
      userId: userId,
      characterId: character._id,
      completedAt: new Date(),
      answersCorrect: false,
      totalQuestions: session.answers.length,
      correctAnswers: correctCount,
      timeSpent: Date.now() - session.startTime
    });
  }
  
  // Clear session
  userSessions.delete(userId);
}
```

### 3.4 Session Management

```javascript
// In-memory session storage (for development/small scale)
// For production, use Redis

const userSessions = new Map();

class UserSession {
  constructor(userId) {
    this.userId = userId;
    this.currentCharacterId = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.multipleChoiceSelection = []; // For multiple choice tracking
    this.startTime = Date.now();
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min timeout
  }
  
  isExpired() {
    return Date.now() > this.expiresAt.getTime();
  }
}

// Session cleanup (every 5 minutes)
setInterval(() => {
  for (const [userId, session] of userSessions.entries()) {
    if (session.isExpired()) {
      userSessions.delete(userId);
    }
  }
}, 5 * 60 * 1000);
```

### 3.5 Error Handling for Bot

**Scenarios:**

1. **Character not found**
   ```
   Message: "❌ Ошибка: персонаж не найден"
   Action: Clear session, go to /start
   ```

2. **Database error**
   ```
   Message: "❌ Ошибка сервера. Попробуйте позже"
   Action: Log error, continue session
   ```

3. **File not found (PDF/image)**
   ```
   Message: "❌ Ошибка при загрузке файла"
   Action: Log error, try alternative or skip
   ```

4. **Session expired**
   ```
   Message: "⏰ Сеанс истёк. Начните заново: /start"
   Action: Clear session
   ```

### 3.6 Bot Commands

```
/start - Начать квиз, выбрать персонажа
/help - Справка по боту
/stats - Показать свою статистику (опционально)
/cancel - Отменить текущий квиз
```

---

## 4. CRM BACKEND API

### 4.1 Technology & Setup

**Framework**: Express.js  
**Port**: 5000 (or from env)  
**Base URL**: `http://localhost:5000/api`

**Middleware:**
- CORS (для фронтенда)
- Body parser (JSON)
- Auth middleware (Telegram ID validation)
- Error handling middleware

### 4.2 Authentication

**Тип**: Telegram ID based (NO password)

**Механизм:**
1. Admin отправляет свой Telegram ID через форму в CRM фронтенде
2. Backend проверяет, есть ли этот ID в whitelist (админы БД)
3. Если есть → генерируется JWT токен с Telegram ID
4. Токен отправляется в cookies или localStorage
5. Все последующие запросы отправляют этот токен
6. Backend верифицирует JWT перед доступом

**Whitelist Storage (MongoDB):**
```javascript
{
  "_id": ObjectId,
  "telegramId": 123456789,
  "name": "Администратор 1",
  "role": "admin",
  "createdAt": ISODate,
  "isActive": true
}
```

**JWT Token Payload:**
```javascript
{
  "telegramId": 123456789,
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234654290 // 24 hours expiry
}
```

**Auth Middleware:**
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify Telegram ID is in admin list
    const admin = await Admin.findOne({ telegramId: decoded.telegramId, isActive: true });
    if (!admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    req.admin = admin;
    req.telegramId = decoded.telegramId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 4.3 Error Response Format

**All errors return standard format:**

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

**Error Codes:**
- `INVALID_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - No token/invalid token
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource already exists
- `SERVER_ERROR` - Internal server error
- `FILE_ERROR` - File upload error

---

## 5. CRM WEB INTERFACE

### 5.1 Tech Stack

- React 18+
- TypeScript
- React Router v6
- Axios
- React Hook Form
- Material-UI or TailwindCSS
- React Dropzone (file upload)
- React Query or SWR (data sync)

### 5.2 Authentication Flow

**Login Screen:**
1. Admin enters Telegram ID
2. Click "Send Code to Telegram" (optional: generate 6-digit code, send via bot)
3. Or directly click "Login with Telegram ID"
4. Backend generates JWT token
5. Token stored in localStorage/sessionStorage
6. Redirect to dashboard

**Alternative (simpler):**
1. Input Telegram ID
2. Submit
3. Get JWT token immediately
4. Proceed

### 5.3 UI Pages

#### 5.3.1 Dashboard
- Statistics:
  - Total characters
  - Total questions
  - Total users completed quizzes
  - Completion rate
  - Time period filters

#### 5.3.2 Characters Management
- **List View:**
  - Table with all characters
  - Columns: Name, Questions Count, Success Meme, Fail Meme, PDF File, Actions
  - Search bar
  - Add New Character button
  - Edit/Delete buttons per row

- **Create/Edit Character:**
  - Form fields:
    - Name (text)
    - Description (textarea)
    - Success Meme (image upload)
    - Fail Meme (image upload)
    - PDF File (file upload - PDF only)
  - Save/Cancel buttons
  - Delete button (with confirmation)

#### 5.3.3 Quiz Builder
- **Select Character:** Dropdown to choose character
- **Questions List:**
  - List of all questions for selected character
  - Each row: Question preview, Type (Single/Multiple), Edit, Delete, Reorder buttons
  - Add New Question button

- **Create/Edit Question:**
  - Question text (textarea)
  - Question image (optional, file upload)
  - Question type: Dropdown (Single / Multiple)
  - Feedback image (optional, file upload)
  - Answers section:
    - For each answer: Text field, Checkbox "Is Correct"
    - Add Answer button (limit: 4-5 max)
    - Remove Answer button
  - Save/Cancel buttons
  - Preview button (shows how it looks in Telegram)

#### 5.3.4 File Management
- **Images:**
  - List of all uploaded images
  - Thumbnail preview
  - Filename
  - Upload date
  - Delete button

- **PDF Files:**
  - List of all PDFs
  - Filename
  - File size
  - Associated character
  - Upload date
  - Delete button

- **Upload Area:**
  - Drag-and-drop zone
  - File input button
  - Progress bar

#### 5.3.5 Analytics Dashboard
- **User Stats:**
  - Total users
  - Users by character
  - Completion rates per character
  - Average time spent
  - Charts (pie, bar, line)

- **Quiz Performance:**
  - Per-character completion rates
  - Average scores
  - Most difficult questions

### 5.4 UI Components (Detailed)

**Character Form:**
```jsx
<Form>
  <TextInput 
    label="Character Name"
    name="name"
    required
    maxLength={50}
  />
  
  <TextArea 
    label="Description"
    name="description"
    rows={4}
    maxLength={500}
  />
  
  <FileUpload 
    label="Success Meme (JPG, PNG)"
    name="successMeme"
    accept=".jpg,.jpeg,.png"
    maxSize={5} // MB
    required
  />
  
  <FileUpload 
    label="Fail Meme (JPG, PNG)"
    name="failMeme"
    accept=".jpg,.jpeg,.png"
    maxSize={5}
    required
  />
  
  <FileUpload 
    label="PDF File"
    name="pdfFile"
    accept=".pdf"
    maxSize={20}
    required
  />
  
  <ButtonGroup>
    <Button type="submit">Save Character</Button>
    <Button type="button" variant="secondary">Cancel</Button>
    {isEditing && (
      <Button type="button" variant="danger" onClick={handleDelete}>
        Delete Character
      </Button>
    )}
  </ButtonGroup>
</Form>
```

**Question Form:**
```jsx
<Form>
  <TextArea 
    label="Question Text"
    name="questionText"
    required
    rows={3}
  />
  
  <FileUpload 
    label="Question Image (Optional)"
    name="questionImage"
    accept=".jpg,.jpeg,.png"
    maxSize={5}
  />
  
  <Select 
    label="Question Type"
    name="questionType"
    options={[
      { value: 'single', label: 'Single Choice' },
      { value: 'multiple', label: 'Multiple Choice' }
    ]}
    required
  />
  
  <FileUpload 
    label="Feedback/Correct Answer Image (Optional)"
    name="feedbackImage"
    accept=".jpg,.jpeg,.png"
    maxSize={5}
  />
  
  <AnswerBuilder
    answers={formData.answers}
    onAdd={() => addAnswer()}
    onRemove={(index) => removeAnswer(index)}
    onUpdate={(index, field, value) => updateAnswer(index, field, value)}
  />
  
  <ButtonGroup>
    <Button type="submit">Save Question</Button>
    <Button type="button" variant="secondary">Preview in Telegram</Button>
    <Button type="button" variant="secondary">Cancel</Button>
  </ButtonGroup>
</Form>
```

**Answer Builder Component:**
```jsx
<div className="answers-section">
  {answers.map((answer, index) => (
    <div key={index} className="answer-row">
      <TextInput 
        label={`Answer ${index + 1}`}
        value={answer.text}
        onChange={(value) => onUpdate(index, 'text', value)}
        maxLength={100}
      />
      
      <Checkbox 
        label="Correct Answer"
        checked={answer.isCorrect}
        onChange={(checked) => onUpdate(index, 'isCorrect', checked)}
      />
      
      <Button 
        type="button" 
        variant="danger"
        size="sm"
        onClick={() => onRemove(index)}
      >
        Remove
      </Button>
    </div>
  ))}
  
  <Button 
    type="button" 
    variant="secondary"
    onClick={onAdd}
    disabled={answers.length >= 5}
  >
    + Add Answer
  </Button>
</div>
```

---

## 6. DATABASE SCHEMA

### 6.1 Collections

#### 6.1.1 Characters Collection

```javascript
{
  "_id": ObjectId,
  "name": "Персонаж 1",
  "description": "Описание персонажа",
  "successMeme": "https://cdn.example.com/success_1.jpg",
  "failMeme": "https://cdn.example.com/fail_1.jpg",
  "pdfFilePath": "/uploads/pdfs/character_1.pdf",
  "questions": [ObjectId], // References to Question documents
  "createdAt": ISODate("2025-12-05T10:00:00Z"),
  "updatedAt": ISODate("2025-12-05T10:00:00Z"),
  "createdBy": ObjectId, // Reference to Admin
  "isActive": true
}
```

#### 6.1.2 Questions Collection

```javascript
{
  "_id": ObjectId,
  "characterId": ObjectId, // Reference to Character
  "questionText": "Какой ответ правильный?",
  "type": "single", // or "multiple"
  "image": "https://cdn.example.com/question_image.jpg", // Optional
  "feedbackImage": "https://cdn.example.com/feedback_image.jpg", // Optional
  "answers": [
    {
      "id": "ans_001",
      "text": "Ответ 1",
      "isCorrect": true
    },
    {
      "id": "ans_002",
      "text": "Ответ 2",
      "isCorrect": false
    },
    {
      "id": "ans_003",
      "text": "Ответ 3",
      "isCorrect": false
    }
  ],
  "correctAnswerIds": ["ans_001"], // Array of correct answer IDs
  "order": 1, // Question order within character
  "createdAt": ISODate("2025-12-05T10:00:00Z"),
  "updatedAt": ISODate("2025-12-05T10:00:00Z"),
  "createdBy": ObjectId
}
```

#### 6.1.3 UserProgress Collection

```javascript
{
  "_id": ObjectId,
  "telegramUserId": 123456789,
  "characterId": ObjectId,
  "completedAt": ISODate("2025-12-05T10:30:00Z"),
  "answersCorrect": true,
  "totalQuestions": 10,
  "correctAnswers": 10,
  "timeSpent": 300000, // milliseconds
  "answers": [
    {
      "questionId": ObjectId,
      "userAnswers": ["ans_001"],
      "correctAnswerIds": ["ans_001"],
      "isCorrect": true,
      "timeSpent": 30000
    }
  ],
  "score": 100, // Percentage
  "createdAt": ISODate("2025-12-05T10:00:00Z")
}
```

#### 6.1.4 Admins Collection

```javascript
{
  "_id": ObjectId,
  "telegramId": 123456789, // Unique identifier
  "name": "Admin Name",
  "role": "admin", // Could be "admin", "moderator", etc.
  "isActive": true,
  "createdAt": ISODate("2025-12-05T10:00:00Z"),
  "lastLogin": ISODate("2025-12-05T10:30:00Z"),
  "permissions": ["create_character", "edit_character", "delete_character", "view_analytics"]
}
```

#### 6.1.5 Sessions Collection (Optional - for JWT tracking)

```javascript
{
  "_id": ObjectId,
  "telegramId": 123456789,
  "tokenHash": "hash_of_jwt_token",
  "createdAt": ISODate("2025-12-05T10:00:00Z"),
  "expiresAt": ISODate("2025-12-06T10:00:00Z"), // 24 hours
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### 6.2 Indexes

```javascript
// Characters
db.characters.createIndex({ "name": 1 });
db.characters.createIndex({ "createdBy": 1 });
db.characters.createIndex({ "isActive": 1 });

// Questions
db.questions.createIndex({ "characterId": 1, "order": 1 });
db.questions.createIndex({ "createdBy": 1 });

// UserProgress
db.userprogress.createIndex({ "telegramUserId": 1, "characterId": 1 });
db.userprogress.createIndex({ "completedAt": 1 });
db.userprogress.createIndex({ "characterId": 1 });

// Admins
db.admins.createIndex({ "telegramId": 1 }, { unique: true });
db.admins.createIndex({ "isActive": 1 });

// Sessions
db.sessions.createIndex({ "telegramId": 1 });
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
```

---

## 7. API ENDPOINTS

### 7.1 Authentication Endpoints

#### POST `/api/auth/login`
**Description**: Authenticate admin with Telegram ID  
**Auth**: None  
**Request Body:**
```json
{
  "telegramId": 123456789
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "telegramId": 123456789,
    "name": "Admin Name",
    "role": "admin"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Telegram ID not authorized",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

---

#### POST `/api/auth/logout`
**Description**: Invalidate current session  
**Auth**: JWT required  
**Request Body:** Empty  

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET `/api/auth/me`
**Description**: Get current admin info  
**Auth**: JWT required  

**Response (200 OK):**
```json
{
  "success": true,
  "admin": {
    "telegramId": 123456789,
    "name": "Admin Name",
    "role": "admin",
    "permissions": ["create_character", "edit_character", ...]
  }
}
```

---

### 7.2 Characters Endpoints

#### GET `/api/characters`
**Description**: List all characters  
**Auth**: JWT required  
**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)
- `search` (string, optional)
- `isActive` (boolean, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Персонаж 1",
      "description": "Описание",
      "questionsCount": 10,
      "successMeme": "https://cdn.../success_1.jpg",
      "failMeme": "https://cdn.../fail_1.jpg",
      "pdfFile": "character_1.pdf",
      "createdAt": "2025-12-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

---

#### GET `/api/characters/:id`
**Description**: Get character details  
**Auth**: JWT required  
**Path Parameters:**
- `id` (ObjectId, required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Персонаж 1",
    "description": "Описание",
    "successMeme": "https://cdn.../success_1.jpg",
    "failMeme": "https://cdn.../fail_1.jpg",
    "pdfFilePath": "/uploads/pdfs/character_1.pdf",
    "questions": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "questionText": "Вопрос 1?",
        "type": "single",
        "order": 1
      }
    ],
    "createdAt": "2025-12-05T10:00:00Z",
    "updatedAt": "2025-12-05T10:00:00Z"
  }
}
```

---

#### POST `/api/characters`
**Description**: Create new character  
**Auth**: JWT required  
**Content-Type**: `multipart/form-data`  
**Request Body (Form Data):**
- `name` (string, required, max: 50)
- `description` (string, optional, max: 500)
- `successMeme` (file, required, image)
- `failMeme` (file, required, image)
- `pdfFile` (file, required, PDF only)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Персонаж 1",
    "description": "Описание",
    "successMeme": "https://cdn.../success_1.jpg",
    "failMeme": "https://cdn.../fail_1.jpg",
    "pdfFilePath": "/uploads/pdfs/character_1.pdf",
    "createdAt": "2025-12-05T10:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: name, successMeme, failMeme, pdfFile",
  "code": "INVALID_INPUT",
  "statusCode": 400
}
```

---

#### PUT `/api/characters/:id`
**Description**: Update character  
**Auth**: JWT required  
**Content-Type**: `multipart/form-data`  
**Path Parameters:**
- `id` (ObjectId, required)

**Request Body (Form Data):**
- `name` (string, optional)
- `description` (string, optional)
- `successMeme` (file, optional)
- `failMeme` (file, optional)
- `pdfFile` (file, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Персонаж 1 (Updated)",
    "description": "Updated description",
    "successMeme": "https://cdn.../success_1_new.jpg",
    "failMeme": "https://cdn.../fail_1_new.jpg",
    "pdfFilePath": "/uploads/pdfs/character_1.pdf",
    "updatedAt": "2025-12-05T11:00:00Z"
  }
}
```

---

#### DELETE `/api/characters/:id`
**Description**: Delete character and associated questions  
**Auth**: JWT required  
**Path Parameters:**
- `id` (ObjectId, required)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Character deleted successfully",
  "deletedCharacter": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Персонаж 1"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Character not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

---

### 7.3 Questions Endpoints

#### GET `/api/characters/:characterId/questions`
**Description**: List all questions for a character  
**Auth**: JWT required  
**Path Parameters:**
- `characterId` (ObjectId, required)

**Query Parameters:**
- `sortBy` (string, default: "order")

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "questionText": "Вопрос 1?",
      "type": "single",
      "image": "https://cdn.../question_1.jpg",
      "answers": [
        { "id": "ans_001", "text": "Ответ 1", "isCorrect": true },
        { "id": "ans_002", "text": "Ответ 2", "isCorrect": false }
      ],
      "order": 1
    }
  ]
}
```

---

#### GET `/api/questions/:id`
**Description**: Get question details  
**Auth**: JWT required  
**Path Parameters:**
- `id` (ObjectId, required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "characterId": "507f1f77bcf86cd799439011",
    "questionText": "Вопрос 1?",
    "type": "single",
    "image": "https://cdn.../question_1.jpg",
    "feedbackImage": "https://cdn.../feedback_1.jpg",
    "answers": [
      { "id": "ans_001", "text": "Ответ 1", "isCorrect": true },
      { "id": "ans_002", "text": "Ответ 2", "isCorrect": false },
      { "id": "ans_003", "text": "Ответ 3", "isCorrect": false }
    ],
    "correctAnswerIds": ["ans_001"],
    "order": 1,
    "createdAt": "2025-12-05T10:00:00Z"
  }
}
```

---

#### POST `/api/characters/:characterId/questions`
**Description**: Create new question for character  
**Auth**: JWT required  
**Content-Type**: `multipart/form-data`  
**Path Parameters:**
- `characterId` (ObjectId, required)

**Request Body (Form Data):**
- `questionText` (string, required, max: 500)
- `type` (string, required, enum: ["single", "multiple"])
- `image` (file, optional, image)
- `feedbackImage` (file, optional, image)
- `answers` (JSON string, required)
  ```json
  [
    { "id": "ans_001", "text": "Ответ 1", "isCorrect": true },
    { "id": "ans_002", "text": "Ответ 2", "isCorrect": false }
  ]
  ```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "characterId": "507f1f77bcf86cd799439011",
    "questionText": "Вопрос 1?",
    "type": "single",
    "image": "https://cdn.../question_1.jpg",
    "answers": [
      { "id": "ans_001", "text": "Ответ 1", "isCorrect": true },
      { "id": "ans_002", "text": "Ответ 2", "isCorrect": false }
    ],
    "order": 1,
    "createdAt": "2025-12-05T10:00:00Z"
  }
}
```

---

#### PUT `/api/questions/:id`
**Description**: Update question  
**Auth**: JWT required  
**Content-Type**: `multipart/form-data`  
**Path Parameters:**
- `id` (ObjectId, required)

**Request Body (Form Data):**
- `questionText` (string, optional)
- `type` (string, optional)
- `image` (file, optional)
- `feedbackImage` (file, optional)
- `answers` (JSON string, optional)
- `order` (integer, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "characterId": "507f1f77bcf86cd799439011",
    "questionText": "Updated question?",
    "type": "multiple",
    "image": "https://cdn.../question_1_new.jpg",
    "answers": [
      { "id": "ans_001", "text": "Ответ 1", "isCorrect": true },
      { "id": "ans_002", "text": "Ответ 2", "isCorrect": true },
      { "id": "ans_003", "text": "Ответ 3", "isCorrect": false }
    ],
    "order": 1,
    "updatedAt": "2025-12-05T11:00:00Z"
  }
}
```

---

#### DELETE `/api/questions/:id`
**Description**: Delete question  
**Auth**: JWT required  
**Path Parameters:**
- `id` (ObjectId, required)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

#### POST `/api/questions/:id/reorder`
**Description**: Reorder questions within character  
**Auth**: JWT required  
**Request Body:**
```json
{
  "newOrder": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question reordered successfully"
}
```

---

### 7.4 Files Endpoints

#### POST `/api/upload`
**Description**: Upload file (image or PDF)  
**Auth**: JWT required  
**Content-Type**: `multipart/form-data`  
**Request Body (Form Data):**
- `file` (file, required)
- `type` (string, required, enum: ["image", "pdf"])

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "filename": "image_507f1f77bcf86cd799439011.jpg",
    "url": "https://cdn.example.com/uploads/images/image_507f1f77bcf86cd799439011.jpg",
    "size": 52481,
    "type": "image"
  }
}
```

---

#### GET `/api/files`
**Description**: List all uploaded files  
**Auth**: JWT required  
**Query Parameters:**
- `type` (string, optional, enum: ["image", "pdf"])
- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "filename": "image_507f1f77bcf86cd799439011.jpg",
      "url": "https://cdn.example.com/uploads/images/image_507f1f77bcf86cd799439011.jpg",
      "size": 52481,
      "type": "image",
      "uploadedAt": "2025-12-05T10:00:00Z"
    }
  ]
}
```

---

#### DELETE `/api/files/:filename`
**Description**: Delete file  
**Auth**: JWT required  
**Path Parameters:**
- `filename` (string, required)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 7.5 Analytics Endpoints

#### GET `/api/analytics/overview`
**Description**: Get general analytics  
**Auth**: JWT required  
**Query Parameters:**
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 250,
    "totalCharacters": 10,
    "totalQuestions": 85,
    "totalCompletions": 320,
    "completionRate": 85.5,
    "averageTimeSpent": 245000,
    "charsByPopularity": [
      { "_id": "507f1f77bcf86cd799439011", "name": "Персонаж 1", "completions": 50 }
    ]
  }
}
```

---

#### GET `/api/analytics/characters/:characterId`
**Description**: Get analytics for specific character  
**Auth**: JWT required  
**Path Parameters:**
- `characterId` (ObjectId, required)

**Query Parameters:**
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "characterName": "Персонаж 1",
    "totalAttempts": 120,
    "completions": 102,
    "completionRate": 85.0,
    "averageTimeSpent": 240000,
    "questionStats": [
      {
        "questionId": "507f1f77bcf86cd799439012",
        "questionText": "Вопрос 1?",
        "correctCount": 95,
        "incorrectCount": 25,
        "accuracy": 79.2
      }
    ]
  }
}
```

---

### 7.6 Bot Endpoints (Utility for bot integration)

#### POST `/api/bot/characters`
**Description**: Get all characters for bot display  
**Auth**: None (public for bot)  

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Персонаж 1",
      "description": "Описание"
    }
  ]
}
```

---

#### POST `/api/bot/character/:id/quiz`
**Description**: Get full quiz for specific character  
**Auth**: None (public for bot)  
**Path Parameters:**
- `id` (ObjectId, required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Персонаж 1",
    "questions": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "questionText": "Вопрос 1?",
        "type": "single",
        "image": "https://cdn.../question_1.jpg",
        "feedbackImage": "https://cdn.../feedback_1.jpg",
        "answers": [
          { "id": "ans_001", "text": "Ответ 1" },
          { "id": "ans_002", "text": "Ответ 2" }
        ],
        "correctAnswerIds": ["ans_001"]
      }
    ],
    "successMeme": "https://cdn.../success_1.jpg",
    "failMeme": "https://cdn.../fail_1.jpg",
    "pdfFilePath": "/uploads/pdfs/character_1.pdf"
  }
}
```

---

## 8. AUTHENTICATION & SECURITY

### 8.1 Telegram ID Authentication Flow

**Step 1: User visits CRM**
```
User opens CRM web interface
→ Checks for JWT token in localStorage
→ If no token: Shows login screen
```

**Step 2: User enters Telegram ID**
```
Input: Telegram ID number
→ Submit to POST /api/auth/login
```

**Step 3: Backend validates**
```
Check if Telegram ID exists in Admins collection
If yes:
  - Generate JWT token (24hr expiry)
  - Return token to frontend
If no:
  - Return 401 Unauthorized
```

**Step 4: Frontend stores token**
```
localStorage.setItem('authToken', token);
OR
Set as HTTP-only cookie
```

**Step 5: Subsequent requests**
```
Every API request sends: Authorization: Bearer <token>
Backend verifies JWT signature and Telegram ID
```

### 8.2 JWT Configuration

```javascript
// .env
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRY=24h
```

**Token Generation:**
```javascript
const token = jwt.sign(
  {
    telegramId: admin.telegramId,
    role: admin.role,
    adminId: admin._id
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY }
);
```

**Token Verification:**
```javascript
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Token valid
} catch (error) {
  // Token expired or invalid
  return res.status(401).json({ error: 'Invalid token' });
}
```

### 8.3 Admin Whitelist Management

**Superadmin first setup:**
1. Direct database insert of first admin:
   ```javascript
   db.admins.insertOne({
     telegramId: YOUR_TELEGRAM_ID,
     name: "Super Admin",
     role: "super_admin",
     isActive: true,
     createdAt: new Date()
   });
   ```

2. This user can then add more admins via CRM (optional feature)

### 8.4 CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., http://localhost:3000
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 8.5 Input Validation

**All inputs must be validated:**

```javascript
// Example: Character creation
const Joi = require('joi');

const characterSchema = Joi.object({
  name: Joi.string().max(50).required(),
  description: Joi.string().max(500),
  // Files validated separately in multer middleware
});

// In route:
const { error, value } = characterSchema.validate(req.body);
if (error) {
  return res.status(400).json({ 
    error: error.details[0].message,
    code: 'INVALID_INPUT'
  });
}
```

### 8.6 File Upload Security

```javascript
// Multer configuration
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.mimetype.startsWith('image/') 
      ? './uploads/images' 
      : './uploads/pdfs';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    
    cb(null, true);
  }
});
```

---

## 9. FILE STORAGE

### 9.1 Local File Structure

```
project-root/
├── uploads/
│   ├── images/
│   │   ├── 1701757200000_character_1_success.jpg
│   │   ├── 1701757200001_character_1_fail.jpg
│   │   ├── 1701757200002_question_1.jpg
│   │   └── ...
│   ├── pdfs/
│   │   ├── character_1.pdf
│   │   ├── character_2.pdf
│   │   └── ...
│   └── temp/
│       └── (temporary files during processing)
├── src/
│   ├── bot.js
│   ├── api/
│   ├── middleware/
│   └── models/
├── .env
├── .gitignore
└── package.json
```

### 9.2 File Upload Process

**Image Upload (Character Memes, Question Images):**
1. File uploaded via `/api/upload` endpoint
2. Multer validates file type and size
3. File saved to `/uploads/images/`
4. Filename saved in database
5. URL returned to frontend: `/api/files/images/filename.jpg`

**PDF Upload (Character certificates):**
1. File uploaded via character creation
2. Multer validates file type (PDF only)
3. File saved to `/uploads/pdfs/`
4. Filename saved in Character document
5. In bot: file read from disk and sent to user

### 9.3 File Serving

```javascript
// Express static files
app.use('/uploads/images', express.static('./uploads/images'));
app.use('/uploads/pdfs', express.static('./uploads/pdfs'));

// In bot, read and send PDF:
const fs = require('fs');

const pdfPath = path.join('./uploads/pdfs', character.pdfFile);
const pdfStream = fs.createReadStream(pdfPath);

await bot.sendDocument(userId, pdfStream, {
  filename: `${character.name}_certificate.pdf`,
  caption: 'Ваш сертификат'
});
```

### 9.4 File Cleanup

**On character deletion:**
```javascript
// Delete associated files
fs.unlinkSync(path.join('./uploads/images', character.successMeme));
fs.unlinkSync(path.join('./uploads/images', character.failMeme));
fs.unlinkSync(path.join('./uploads/pdfs', character.pdfFile));

// Delete character from DB
await Character.findByIdAndDelete(characterId);
```

---

## 10. ERROR HANDLING

### 10.1 Bot Error Handling

```javascript
// Try-catch for all bot handlers
bot.on('callback_query', async (query) => {
  try {
    // Handler logic
  } catch (error) {
    console.error(`Error in callback_query: ${error.message}`);
    
    try {
      await bot.sendMessage(query.from.id, 
        '❌ Ошибка при обработке вашего ответа. Попробуйте еще раз.'
      );
    } catch (sendError) {
      console.error(`Failed to send error message: ${sendError}`);
    }
  }
});

// Global error handler
bot.on('polling_error', (error) => {
  console.error(`Telegram polling error: ${error.message}`);
});
```

### 10.2 API Error Handling

```javascript
// Express global error handler
app.use((error, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error:`, error);
  
  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: 'File too large (max 20MB)',
        code: 'FILE_ERROR',
        statusCode: 400
      });
    }
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'UNAUTHORIZED',
      statusCode: 401
    });
  }
  
  // Default server error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR',
    statusCode: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});
```

### 10.3 Database Error Handling

```javascript
// Mongoose connection errors
mongoose.connection.on('error', (error) => {
  console.error(`MongoDB connection error: ${error.message}`);
  // Attempt reconnection
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI).catch(err => {
      console.error(`Reconnection failed: ${err.message}`);
    });
  }, 5000);
});

// Validation errors
schema.post('save', (error, doc, next) => {
  if (error.name === 'ValidationError') {
    next(new Error('Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ')));
  } else {
    next(error);
  }
});
```

### 10.4 Logging Strategy

```javascript
// Simple logging
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
};

// Use in code:
logger.info('Bot started');
logger.error('Character not found', error);
```

---

## 11. DEPLOYMENT

### 11.1 Environment Variables

**`.env` file:**
```
# Node
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiz-bot

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIjklmNOpqrSTUvwXYZ

# JWT
JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_EXPIRY=24h

# API
BACKEND_URL=https://api.example.com
FRONTEND_URL=https://crm.example.com

# File Storage
FILE_UPLOAD_DIR=./uploads
MAX_FILE_SIZE=20971520

# Development
DEBUG=false
```

### 11.2 Docker Setup

**`Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
```

**`docker-compose.yml`:**
```yaml
version: '3.8'

services:
  bot:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/quiz-bot
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### 11.3 Deployment to Railway

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Set environment variables in Railway dashboard
4. Set start command: `npm start`
5. Railway auto-deploys on push

### 11.4 GitHub Actions CI/CD

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Railway
        run: npm run deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 11.5 Monitoring & Logging

```javascript
// Log all requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Monitor bot health
setInterval(async () => {
  try {
    const me = await bot.getMe();
    logger.info(`Bot is healthy: @${me.username}`);
  } catch (error) {
    logger.error('Bot health check failed', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

---

## 12. IMPLEMENTATION CHECKLIST

### Phase 1: Setup & Database
- [ ] Initialize Node.js project with Express
- [ ] Setup MongoDB schemas (Characters, Questions, Users, Admins)
- [ ] Create indexes
- [ ] Setup environment configuration
- [ ] Create basic file structure

### Phase 2: Bot Core
- [ ] Initialize Telegram bot with node-telegram-bot-api
- [ ] Implement /start command with character selection
- [ ] Implement question display (single & multiple choice)
- [ ] Implement answer validation
- [ ] Implement quiz completion flow
- [ ] Implement session management
- [ ] Setup file serving (images, PDF)

### Phase 3: API Backend
- [ ] Setup Express server with CORS
- [ ] Implement authentication endpoints
- [ ] Implement Character CRUD
- [ ] Implement Question CRUD
- [ ] Implement file upload endpoints
- [ ] Implement analytics endpoints
- [ ] Setup error handling middleware

### Phase 4: CRM Frontend
- [ ] Setup React project structure
- [ ] Implement login page
- [ ] Implement Characters management page
- [ ] Implement Quiz builder
- [ ] Implement Analytics dashboard
- [ ] Setup API client (Axios)
- [ ] Implement file upload UI

### Phase 5: Testing & Polish
- [ ] Test bot with multiple users
- [ ] Test CRM CRUD operations
- [ ] Test file uploads
- [ ] Test authentication
- [ ] Performance optimization
- [ ] Security review

### Phase 6: Deployment
- [ ] Setup Docker
- [ ] Setup GitHub Actions
- [ ] Deploy to Railway/DigitalOcean
- [ ] Setup monitoring
- [ ] Documentation

---

## 13. ADDITIONAL NOTES

### Performance Considerations
- Cache character data in-memory or Redis for faster bot responses
- Implement pagination for all list endpoints
- Optimize database queries with indexes
- Compress images before storage

### Scalability
- For large user base, migrate from in-memory sessions to Redis
- Use CDN for image serving
- Implement rate limiting on API endpoints
- Use background jobs (Bull/RabbitMQ) for analytics

### Future Features
- User statistics per user (/stats command)
- Leaderboard of quiz completers
- Multiple languages support
- Quiz scheduling
- Email notifications
- Integration with other services

---

**Document Version**: 1.0  
**Last Updated**: December 5, 2025  
**Status**: Ready for Development
