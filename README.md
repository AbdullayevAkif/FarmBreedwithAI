# 🐄 Farm Breed with AI - Frontend

A modern, responsive web application for AI-powered farm animal breeding management. This frontend provides an intuitive interface for managing animals, analyzing breeding compatibility, and getting AI-powered recommendations.

## ✨ Features

### 🏠 Dashboard
- **Real-time Statistics**: Total animals, breeding-ready count, pregnant animals, and average breeding scores
- **Quick Actions**: Easy access to add animals, find matches, ask AI advisor, and analyze photos
- **Recent Activity**: Live feed of farm activities and updates
- **Beautiful Animations**: Smooth transitions and engaging visual effects

### 🐮 Animal Management
- **Animal Gallery**: Visual grid display of all farm animals with photos
- **Advanced Filtering**: Filter by type, breeding status, and search by name/breed
- **Add New Animals**: Comprehensive form with photo upload capability
- **Animal Details**: View and edit individual animal information
- **Status Tracking**: Visual indicators for breeding status and health

### 💕 Breeding Management
- **Breeding Box Analysis**: AI-powered compatibility analysis between animals
- **Match Recommendations**: Get intelligent suggestions for optimal breeding pairs
- **Compatibility Scoring**: Visual compatibility scores with detailed analysis
- **Risk Assessment**: Breeding risk evaluation and recommendations

### 🤖 AI Advisor
- **Interactive Chat**: Real-time chat interface with AI breeding expert
- **Voice Commands**: Support for voice input (coming soon)
- **Expert Advice**: Get recommendations on breeding, health, and farm management
- **Contextual Help**: AI understands your specific farm situation

### 📅 Schedule Management
- **Weekly View**: See all upcoming breeding tasks and activities
- **Task Management**: Mark tasks as complete and track progress
- **Automated Reminders**: Never miss important breeding windows
- **Calendar Integration**: Plan breeding activities efficiently

## 🎨 Design Features

### Visual Design
- **Farm Theme**: Beautiful farm-inspired color scheme with animal emojis
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Accessibility**: High contrast, readable fonts, and keyboard navigation

### Animations
- **Floating Icons**: Animal emojis with gentle floating animations
- **Hover Effects**: Interactive elements with smooth hover transitions
- **Loading States**: Beautiful loading spinners and progress indicators
- **Page Transitions**: Smooth section switching with fade effects

### Color Scheme
- **Primary**: Gradient from purple (#667eea) to violet (#764ba2)
- **Background**: Gradient background with glassmorphism effects
- **Cards**: Semi-transparent white cards with subtle shadows
- **Accents**: Farm-themed colors for different animal types

## 🚀 Getting Started

### Prerequisites
- Your Spring Boot backend running on `http://localhost:8080`
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required!

### Installation
1. **Clone or download** the frontend files to your desired directory
2. **Ensure your backend is running** on port 8080
3. **Open `index.html`** in your web browser
4. **Start using the application!**

### File Structure
```
frontend/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and animations
├── script.js           # JavaScript functionality and API integration
└── README.md          # This documentation
```

## 🔧 Configuration

### API Endpoints
The frontend is configured to work with your Spring Boot backend endpoints:

- **Animals**: `/api/animals`
- **Breeding**: `/api/breeding`
- **AI Advisor**: `/api/ai-advisor`
- **Schedule**: `/api/schedule`
- **Breeding Box**: `/api/breeding-box`
- **Photo Analysis**: `/api/animals/analyze-photo`

### Customization
To modify the API base URL, update the `API_BASE_URL` constant in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:

- **Touch-friendly**: Large buttons and touch targets
- **Mobile Navigation**: Hamburger menu for easy navigation
- **Responsive Grid**: Animal cards adapt to screen size
- **Mobile Forms**: Optimized form layouts for mobile input

## 🎯 Usage Guide

### Adding Animals
1. Click "Add New Animal" on the dashboard or animals page
2. Fill in the animal details (name, type, breed, gender, etc.)
3. Upload a photo (optional but recommended)
4. Click "Add Animal" to save

### Analyzing Breeding Compatibility
1. Go to the Breeding section
2. Select two animals from the dropdowns
3. Click "Analyze Compatibility"
4. View the detailed compatibility analysis and recommendations

### Using AI Advisor
1. Navigate to the AI Advisor section
2. Type your question in the chat input
3. Press Enter or click the send button
4. Get instant AI-powered advice

### Managing Schedule
1. Go to the Schedule section
2. View upcoming tasks and activities
3. Mark tasks as complete when finished
4. Add new schedule items as needed

## 🔍 Troubleshooting

### Common Issues

**Backend Connection Error**
- Ensure your Spring Boot backend is running on port 8080
- Check that CORS is enabled in your backend configuration
- Verify the API endpoints are accessible

**Photo Upload Issues**
- Ensure photos are in supported formats (JPG, PNG, WebP)
- Check file size limits (max 10MB)
- Verify backend photo upload endpoint is working

**Mobile Display Issues**
- Clear browser cache and reload
- Ensure you're using a modern mobile browser
- Check that viewport meta tag is present

### Browser Compatibility
- **Chrome**: 80+ ✅
- **Firefox**: 75+ ✅
- **Safari**: 13+ ✅
- **Edge**: 80+ ✅

## 🎨 Customization

### Adding New Animal Types
To add support for new animal types, update the `getAnimalEmoji()` function in `script.js`:

```javascript
function getAnimalEmoji(type) {
    const emojis = {
        'cow': '🐄',
        'sheep': '🐑',
        'goat': '🐐',
        'pig': '🐷',
        'horse': '🐴',
        'chicken': '🐔',
        'duck': '🦆',
        'your-new-type': '🦓'  // Add your new type here
    };
    return emojis[type.toLowerCase()] || '🐾';
}
```

### Modifying Colors
Update the CSS custom properties in `styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --warning-color: #ed8936;
    --error-color: #f56565;
}
```

## 🤝 Contributing

This frontend is designed to work seamlessly with your Spring Boot backend. To contribute:

1. **Test thoroughly** with your backend API
2. **Maintain responsive design** across all devices
3. **Keep animations smooth** and performance optimized
4. **Follow the existing code style** and structure

## 📄 License

This frontend application is part of the Farm Breed with AI project. Use it in conjunction with your Spring Boot backend for a complete farm management solution.

## 🆘 Support

If you encounter any issues:

1. **Check the browser console** for JavaScript errors
2. **Verify backend connectivity** and API responses
3. **Test with different browsers** to isolate issues
4. **Review the network tab** for failed API calls

---

**Happy Farming! 🐄🌾**

*Built with ❤️ for modern farm management*

