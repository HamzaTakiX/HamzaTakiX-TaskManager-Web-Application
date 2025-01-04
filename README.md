# TaskManager Web Application

A modern, full-stack task management application built with Next.js and Node.js, featuring real-time updates, AI integration, and a beautiful UI.

![TaskManager Banner](https://your-banner-image-url.png)

## Features

### User Management
- **Authentication**
  - Secure login and registration system
  - JWT-based authentication
  - Password encryption using bcrypt
  - Remember me functionality
  - Password reset capability

- **Profile Management**
  - Customizable user profiles
  - Profile image upload and management
  - Banner image customization
  - Skills and languages section
  - About me section
  - Contact information management

### Task Management
- **Task Operations**
  - Create, read, update, and delete tasks
  - Task categorization and prioritization
  - Due date management
  - Task status tracking
  - File attachments support
  - Task validation and approval workflow
  - Bulk task operations

- **Task Organization**
  - Drag-and-drop task reordering
  - Task filtering and sorting
  - Category-based organization
  - Priority levels (High, Medium, Low)
  - Progress tracking
  - Custom task views (List, Board, Timeline)
  - Task dependencies tracking

### AI Assistant
- **Smart Task Management**
  - AI-powered task suggestions
  - Natural language task creation
  - Intelligent task categorization
  - Priority recommendations
  - Automated task scheduling

- **Conversation Features**
  - Chat-based task creation
  - Context-aware responses
  - Task-related queries and answers
  - Custom folder organization
  - Conversation history

### Dashboard
- **Analytics & Insights**
  - Task completion metrics
  - Productivity analytics
  - Time tracking statistics
  - Category distribution charts
  - Priority breakdown
  - Team performance metrics
  - Custom dashboard widgets

- **Notification Center**
  - Real-time task updates
  - Due date reminders
  - Assignment notifications
  - Custom notification settings
  - Email notifications
  - In-app notification center

### User Interface
- **Modern Design**
  - Responsive layout for all devices
  - Dark/Light mode support
  - Smooth animations and transitions
  - Interactive components
  - Toast notifications for actions

- **Dashboard**
  - Task overview and statistics
  - Recent activity feed
  - Progress charts
  - Quick action buttons
  - Customizable widgets

### Additional Features
- **Real-time Updates**
  - Live task status changes
  - Instant notifications
  - Collaborative features
  - Real-time chat
  - Activity feed updates

- **Settings & Customization**
  - Notification preferences
  - Language settings
  - Theme customization
  - Dashboard layout customization
  - Task view preferences
  - Email notification frequency

- **Data Export**
  - Export user data in JSON format
  - Task history export
  - Activity logs

- **Security**
  - Secure file upload system
  - Rate limiting
  - Input validation
  - XSS protection
  - CSRF protection

## Technologies Used

### Frontend
- **Next.js 13+**
- **React 18**
- **Tailwind CSS**
- **Framer Motion** (for animations)
- **Axios** (API calls)
- **React Icons**
- **Context API** (state management)
- **Socket.io-client** (real-time updates)
- **Chart.js** (analytics visualization)
- **React Beautiful DND** (drag and drop)

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (with Mongoose)
- **JWT** (authentication)
- **Multer** (file uploads)
- **Bcrypt** (password hashing)
- **Socket.io** (WebSocket server)
- **OpenAI API** (AI assistant integration)
- **Nodemailer** (email notifications)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ayman-gassi/TaskManager-Web-Application.git
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd taskManager-client
npm install

# Install server dependencies
cd ../taskManager-server
npm install
```

3. Set up environment variables:

Create a `.env` file in the server directory:
```env
PORT=9000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Start the development servers:

For the client:
```bash
cd taskManager-client
npm run dev
```

For the server:
```bash
cd taskManager-server
npm start
```

## API Endpoints

### User Routes
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-images` - Upload profile/banner images
- `GET /api/users/export-data` - Export user data

### Task Routes
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/categories` - Get task categories
- `POST /api/tasks/bulk` - Bulk task operations
- `GET /api/tasks/analytics` - Get task analytics
- `POST /api/tasks/validate` - Validate task completion

### AI Assistant Routes
- `POST /api/ai/chat` - Send message to AI assistant
- `GET /api/ai/conversations` - Get conversation history
- `POST /api/ai/folders` - Create conversation folder
- `GET /api/ai/suggestions` - Get AI task suggestions

### Notification Routes
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/settings` - Update notification settings
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/preferences` - Get notification preferences

## UI Components

- Custom modals for various actions
- Toast notifications for success/error messages
- Loading spinners and skeletons
- Responsive navigation
- Interactive forms with validation
- Drag-and-drop interfaces
- Progress indicators
- Custom buttons and inputs
- AI chat interface
- Analytics charts and graphs
- Custom dashboard widgets
- Notification center
- Task validation modals

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Hamza Taki**
- GitHub: [@HamzaTakiX](https://github.com/HamzaTakiX)


## Acknowledgments

- Thanks to all contributors who have helped this project grow
- Special thanks to the open-source community for their amazing tools and libraries

---

Made with ❤️ by Hamza Taki
