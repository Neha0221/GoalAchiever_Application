# 🎯 Goal Achiever

A comprehensive goal management and achievement platform with AI-powered tutoring, progress tracking, and automated check-in systems.

## 🌟 Features

### 🎯 Goal Management
- **Smart Goal Creation**: Create goals with categories, complexity levels, and timelines
- **Milestone Tracking**: Break down goals into manageable milestones with dependencies
- **Progress Visualization**: Real-time progress tracking with visual indicators
- **Goal Categories**: Learning, Career, Health, Fitness, Personal, Financial, Creative, Technical
- **Priority Management**: Set priority levels (Low, Medium, High, Urgent)
- **Resource Management**: Attach articles, videos, courses, and tools to goals

### 🤖 AI Avatar Tutor
- **Intelligent Chat Interface**: Powered by OpenRouter's `deepseek-r1` model
- **Context-Aware Responses**: AI understands your goals and provides relevant guidance
- **Practice Problem Generation**: Get custom practice problems for learning goals
- **Learning Recommendations**: Personalized suggestions based on your progress
- **Session Management**: Track your learning sessions and progress
- **Animated Avatar**: Interactive visual feedback during conversations

### 📅 Check-in System
- **Flexible Scheduling**: Daily, weekly, bi-weekly, monthly, or custom frequencies
- **Automated Reminders**: Email and in-app notifications
- **Progress Assessment**: Comprehensive forms to track mood, energy, and motivation
- **Calendar Integration**: Visual calendar view of all check-ins
- **Statistics Dashboard**: Track completion rates and progress trends
- **Recurring Check-ins**: Automatically schedule recurring assessments

### 📊 Progress Tracking
- **Real-time Analytics**: Comprehensive dashboard with goal statistics
- **Visual Progress Indicators**: Charts and graphs for goal completion
- **Milestone Status**: Track individual milestone progress
- **Performance Metrics**: Average progress, completion rates, and trends
- **Goal Filtering**: Filter by status, category, complexity, and more

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: Account verification system
- **Password Reset**: Secure password recovery
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation and sanitization

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Smooth Animations**: Framer Motion powered animations
- **Glassmorphism Design**: Modern, elegant interface
- **Real-time Updates**: Socket.io for live updates

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Authentication, validation, rate limiting
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── server.js            # Main server file
└── package.json
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context for state management
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Main application pages
│   ├── services/        # API service layer
│   ├── styles/          # Global styles and themes
│   └── utils/           # Helper functions
├── public/              # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goalAchiever
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/goalachiever
   
   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # OpenRouter API (for AI features)
   OPENAI_API_KEY=sk-or-v1-your_openrouter_api_key_here
   OPENAI_MODEL=deepseek/deepseek-r1:free
   
   # Email (optional - for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

5. **Start the Application**
   
   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

### Goal Management
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get specific goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/milestones` - Add milestone
- `PUT /api/goals/:id/milestones/:milestoneId` - Update milestone

### Check-in System
- `GET /api/checkin` - Get all check-ins
- `POST /api/checkin` - Create check-in
- `POST /api/checkin/:id/complete` - Complete check-in
- `GET /api/checkin/statistics` - Get check-in statistics
- `GET /api/checkin/calendar` - Get calendar view

### AI Tutor
- `POST /api/ai-tutor/chat` - Send chat message
- `GET /api/ai-tutor/sessions` - Get chat sessions
- `POST /api/ai-tutor/practice-problems` - Generate practice problems
- `GET /api/ai-tutor/recommendations` - Get learning recommendations

For detailed API documentation, see:
- [Check-in API Documentation](backend/CHECKIN_API_DOCUMENTATION.md)
- [AI Tutor Implementation](AI_TUTOR_IMPLEMENTATION.md)

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Node-cron** - Scheduled tasks
- **Nodemailer** - Email notifications
- **OpenRouter API** - AI integration

### Frontend
- **React 19** - UI framework
- **React Router** - Client-side routing
- **Chakra UI** - Component library
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **React Webcam** - Camera integration
- **Date-fns** - Date manipulation

### Development Tools
- **Nodemon** - Development server
- **Jest** - Testing framework
- **Supertest** - API testing
- **ESLint** - Code linting

## 🔧 Configuration

### Rate Limiting
- **AI Chat**: 20 requests per 15 minutes per user
- **Practice Problems**: 5 generations per hour
- **General API**: 100 requests per 15 minutes

### Security Features
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **XSS Protection** - Cross-site scripting prevention
- **Input Sanitization** - Data cleaning
- **MongoDB Injection Protection** - NoSQL injection prevention

## 📱 Features in Detail

### Goal Creation Wizard
1. **Basic Information**: Title, description, category
2. **Timeline Setup**: Target date, estimated duration
3. **Milestone Planning**: Break down into smaller tasks
4. **Resource Addition**: Links to helpful materials
5. **Priority Setting**: Set importance level

### AI Tutor Capabilities
- **Contextual Learning**: Understands your specific goals
- **Adaptive Responses**: Adjusts to your learning style
- **Progress Integration**: References your goal progress
- **Practice Generation**: Creates relevant exercises
- **Recommendation Engine**: Suggests next steps

### Check-in System Features
- **Flexible Scheduling**: Multiple frequency options
- **Comprehensive Assessment**: Mood, energy, motivation tracking
- **Automated Reminders**: Never miss a check-in
- **Progress Correlation**: Links check-ins to goal progress
- **Analytics Dashboard**: Visual progress tracking

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goalachiever
JWT_SECRET=your_strong_jwt_secret
FRONTEND_URL=https://your-domain.com
PORT=5000
```

### Build Commands
```bash
# Backend
cd backend
npm install --production
npm start

# Frontend
cd frontend
npm run build
# Serve the build folder with a web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation files in the project
- Review the API documentation for integration help

## 🔮 Roadmap

### Upcoming Features
- **Video Chat Integration**: WebRTC for face-to-face AI tutoring
- **Voice Recognition**: Speech-to-text for hands-free interaction
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: React Native mobile application
- **Team Collaboration**: Shared goals and team check-ins
- **Integration APIs**: Connect with external productivity tools

### Performance Improvements
- **Caching Layer**: Redis for improved response times
- **CDN Integration**: Faster asset delivery
- **Database Optimization**: Query optimization and indexing
- **Real-time Sync**: Enhanced real-time features

---

**Goal Achiever** - Transform your aspirations into achievements with the power of AI and smart tracking! 🚀
