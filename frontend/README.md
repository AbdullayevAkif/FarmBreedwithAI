# FarmBreedwithAI Frontend

A modern React frontend for the FarmBreedwithAI application - an AI-powered farm animal breeding assistant.

## Features

- **Dashboard**: Overview of farm statistics and recent activities
- **Animals Management**: Add, view, edit, and manage farm animals
- **Breeding Management**: Find optimal breeding pairs and manage breeding programs
- **Breeding Box**: AI-powered photo analysis for breeding recommendations
- **AI Advisor**: Interactive chat with AI for breeding advice and questions
- **Schedule Management**: Track breeding tasks and farm activities
- **User Profile**: Manage account settings and farm information

## Tech Stack

- React 18
- React Router DOM
- React Query for data fetching
- React Hook Form for form management
- Lucide React for icons
- Axios for API calls
- React Hot Toast for notifications
- Framer Motion for animations

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 8123

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8123/api
```

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ProtectedRoute.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Animals.js
│   │   ├── Breeding.js
│   │   ├── BreedingBox.js
│   │   ├── AIAdvisor.js
│   │   ├── Schedule.js
│   │   ├── Profile.js
│   │   ├── Login.js
│   │   └── Register.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## API Integration

The frontend integrates with the following backend endpoints:

- **Authentication**: `/api/auth/*`
- **Animals**: `/api/animals/*`
- **Breeding**: `/api/breeding/*`
- **Breeding Box**: `/api/breeding-box/*`
- **AI Advisor**: `/api/ai-advisor/*`
- **Schedule**: `/api/schedule/*`
- **File Upload**: `/api/upload/*`
- **Health Check**: `/api/health/*`

## Features Overview

### Dashboard
- Real-time farm statistics
- Recent animals overview
- Upcoming tasks
- Quick action buttons

### Animals Management
- Grid view of all animals
- Search and filter functionality
- Animal details modal
- Photo upload and analysis
- Breeding score visualization

### Breeding Management
- Animal selection interface
- AI-powered breeding recommendations
- Compatibility scoring
- Breeding pair suggestions

### Breeding Box
- Drag-and-drop photo upload
- Batch photo analysis
- AI breeding recommendations
- Session management
- Analysis results visualization

### AI Advisor
- Interactive chat interface
- Voice command support
- Quick question suggestions
- Breeding tips and advice
- AI capabilities overview

### Schedule Management
- Task creation and management
- Status tracking
- Priority management
- Calendar integration

### User Profile
- Account information management
- Farm statistics
- Security settings
- Account preferences

## Styling

The application uses a farm-themed design with:
- Natural color palette (greens, browns, earth tones)
- Modern, responsive layout
- Smooth animations and transitions
- Mobile-first design approach
- Accessible UI components

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- Functional components with hooks
- ES6+ JavaScript
- CSS custom properties for theming
- Responsive design patterns
- Component-based architecture

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the FarmBreedwithAI application.



