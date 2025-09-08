// Global variables
const API_BASE_URL = 'http://localhost:8080/api';
let animals = [];
let currentSection = 'dashboard';
let currentUser = null;
let authToken = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    setupAuthEventListeners();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showMainApp();
    } else {
        showAuthModal();
    }
}

// Show authentication modal
function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
}

// Show main application
function showMainApp() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.querySelector('.navbar').style.display = 'block';
    
    // Update navbar with user info
    updateNavbarWithUser();
    
    // Initialize app data
    initializeApp();
    loadDashboardData();
}

// Update navbar with user information
function updateNavbarWithUser() {
    const navContainer = document.querySelector('.nav-container');
    const existingUserInfo = document.querySelector('.user-info');
    
    if (existingUserInfo) {
        existingUserInfo.remove();
    }
    
    if (currentUser) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="user-avatar">${currentUser.firstName ? currentUser.firstName[0].toUpperCase() : 'U'}</div>
            <span class="user-name">${currentUser.firstName || 'User'}</span>
            <button class="logout-btn" onclick="logout()" title="Logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        navContainer.appendChild(userInfo);
    }
}

// Setup authentication event listeners
function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form-element');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Password confirmation validation
    const confirmPassword = document.getElementById('register-confirm-password');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
}

// Initialize application
function initializeApp() {
    // Set up navigation
    setupNavigation();
    
    // Load initial data
    loadAnimals();
    loadSchedule();
    
    // Set up form handlers
    setupFormHandlers();
    
    console.log('🐄 Farm Breed AI Application initialized!');
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Photo upload
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoInput = document.getElementById('photo-input');
    
    if (photoUploadArea && photoInput) {
        photoUploadArea.addEventListener('click', () => photoInput.click());
        photoUploadArea.addEventListener('dragover', handleDragOver);
        photoUploadArea.addEventListener('drop', handleDrop);
        photoInput.addEventListener('change', handlePhotoSelect);
    }
    
    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Animal filters
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-animals');
    
    if (typeFilter) typeFilter.addEventListener('change', filterAnimals);
    if (statusFilter) statusFilter.addEventListener('change', filterAnimals);
    if (searchInput) searchInput.addEventListener('input', filterAnimals);
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Add active class to corresponding nav link
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load section-specific data
        loadSectionData(sectionName);
    }
}

// Load section-specific data
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'animals':
            loadAnimals();
            break;
        case 'breeding':
            loadBreedingData();
            break;
        case 'ai-advisor':
            // AI advisor is ready by default
            break;
        case 'schedule':
            loadSchedule();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load animals for stats
        const animalsResponse = await fetch(`${API_BASE_URL}/animals`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const animalsData = await animalsResponse.json();
        
        // Calculate stats
        const totalAnimals = animalsData.length;
        const readyForBreeding = animalsData.filter(animal => animal.breedingStatus === 'READY').length;
        const pregnant = animalsData.filter(animal => animal.breedingStatus === 'PREGNANT').length;
        const avgScore = animalsData.reduce((sum, animal) => sum + (animal.breedingScore || 0), 0) / totalAnimals || 0;
        
        // Update dashboard stats
        updateDashboardStats({
            totalAnimals,
            readyForBreeding,
            pregnant,
            avgScore: avgScore.toFixed(1)
        });
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

// Load recent activity from backend
async function loadRecentActivity() {
    try {
        const [scheduleResponse, breedingResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/schedule/upcoming`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE_URL}/breeding-box/sessions`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        const scheduleData = await scheduleResponse.json();
        const breedingData = await breedingResponse.json();
        
        updateRecentActivity(scheduleData, breedingData);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        updateRecentActivity([], []);
    }
}

// Update recent activity display
function updateRecentActivity(scheduleData = [], breedingData = []) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const activities = [];
    
    // Add schedule activities
    scheduleData.slice(0, 2).forEach(item => {
        activities.push({
            icon: '📅',
            text: `Scheduled: ${item.notes || 'Breeding activity'} for ${item.animal?.name || 'Animal'}`,
            time: formatTimeAgo(item.createdAt)
        });
    });
    
    // Add breeding activities
    breedingData.slice(0, 2).forEach(item => {
        activities.push({
            icon: '🧬',
            text: `Breeding analysis: ${item.sessionName}`,
            time: formatTimeAgo(item.createdAt)
        });
    });
    
    // Add default activities if none
    if (activities.length === 0) {
        activities.push(
            {
                icon: '🐄',
                text: 'Welcome to your farm management system!',
                time: 'Just now'
            },
            {
                icon: '💡',
                text: 'Start by adding your first animal',
                time: 'Get started'
            }
        );
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    const elements = {
        'total-animals': stats.totalAnimals,
        'ready-breeding': stats.readyForBreeding,
        'pregnant': stats.pregnant,
        'avg-score': stats.avgScore
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            animateNumber(element, 0, value, 1000);
        }
    });
}

// Animate number counting
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const isDecimal = end.toString().includes('.');
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * progress;
        element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Update recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const activities = [
        { icon: '🐄', text: 'New animal "Bella" added to the farm', time: '2 hours ago' },
        { icon: '💕', text: 'Breeding recommendation generated for "Max"', time: '4 hours ago' },
        { icon: '🤰', text: 'Animal "Luna" is now pregnant', time: '1 day ago' },
        { icon: '📊', text: 'Weekly breeding report generated', time: '2 days ago' }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// Load animals
async function loadAnimals() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/animals`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        animals = await response.json();
        displayAnimals(animals);
        populateAnimalSelects();
    } catch (error) {
        console.error('Error loading animals:', error);
        showNotification('Error loading animals', 'error');
    } finally {
        showLoading(false);
    }
}

// Display animals in grid
function displayAnimals(animalsToShow) {
    const animalsGrid = document.getElementById('animals-grid');
    if (!animalsGrid) return;
    
    if (animalsToShow.length === 0) {
        animalsGrid.innerHTML = `
            <div class="no-animals">
                <div class="no-animals-icon">🐄</div>
                <h3>No animals found</h3>
                <p>Add your first animal to get started!</p>
                <button class="btn-primary" onclick="openAddAnimalModal()">
                    <i class="fas fa-plus"></i> Add Animal
                </button>
            </div>
        `;
        return;
    }
    
    animalsGrid.innerHTML = animalsToShow.map(animal => `
        <div class="animal-card" data-animal-id="${animal.id}">
            <img src="${animal.photoUrl || 'https://via.placeholder.com/300x200?text=No+Photo'}" 
                 alt="${animal.name}" class="animal-photo" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Photo'">
            <div class="animal-info">
                <h3>${animal.name}</h3>
                <div class="animal-details">
                    <div class="animal-detail">
                        <span>${getAnimalEmoji(animal.type)}</span>
                        <span>${animal.type}</span>
                    </div>
                    <div class="animal-detail">
                        <span>${animal.gender === 'MALE' ? '♂️' : '♀️'}</span>
                        <span>${animal.gender}</span>
                    </div>
                    <div class="animal-detail">
                        <span>🏷️</span>
                        <span>${animal.breed}</span>
                    </div>
                    <div class="animal-detail">
                        <span>⚖️</span>
                        <span>${animal.weight || 'N/A'} kg</span>
                    </div>
                </div>
                <div class="animal-status">
                    <span class="status-badge status-${animal.breedingStatus.toLowerCase().replace('_', '-')}">
                        ${animal.breedingStatus.replace('_', ' ')}
                    </span>
                    ${animal.breedingScore ? `<span class="breeding-score">Score: ${animal.breedingScore}</span>` : ''}
                </div>
                <div class="animal-actions">
                    <button class="btn-primary" onclick="viewAnimalDetails(${animal.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-secondary" onclick="editAnimal(${animal.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get animal emoji based on type
function getAnimalEmoji(type) {
    const emojis = {
        'cow': '🐄',
        'sheep': '🐑',
        'goat': '🐐',
        'pig': '🐷',
        'horse': '🐴',
        'chicken': '🐔',
        'duck': '🦆'
    };
    return emojis[type.toLowerCase()] || '🐾';
}

// Filter animals
function filterAnimals() {
    const typeFilter = document.getElementById('type-filter')?.value;
    const statusFilter = document.getElementById('status-filter')?.value;
    const searchInput = document.getElementById('search-animals')?.value.toLowerCase();
    
    let filteredAnimals = animals;
    
    if (typeFilter) {
        filteredAnimals = filteredAnimals.filter(animal => animal.type.toLowerCase() === typeFilter);
    }
    
    if (statusFilter) {
        filteredAnimals = filteredAnimals.filter(animal => animal.breedingStatus === statusFilter);
    }
    
    if (searchInput) {
        filteredAnimals = filteredAnimals.filter(animal => 
            animal.name.toLowerCase().includes(searchInput) ||
            animal.breed.toLowerCase().includes(searchInput)
        );
    }
    
    displayAnimals(filteredAnimals);
}

// Populate animal selects for breeding
function populateAnimalSelects() {
    const animal1Select = document.getElementById('animal1-select');
    const animal2Select = document.getElementById('animal2-select');
    
    if (animal1Select && animal2Select) {
        const options = animals.map(animal => 
            `<option value="${animal.id}">${animal.name} (${animal.type} - ${animal.gender})</option>`
        ).join('');
        
        animal1Select.innerHTML = '<option value="">Choose an animal...</option>' + options;
        animal2Select.innerHTML = '<option value="">Choose an animal...</option>' + options;
    }
}

// Load breeding data
async function loadBreedingData() {
    // This will be populated when animals are loaded
    console.log('Breeding data loaded');
}

// Analyze breeding box
async function analyzeBreedingBox() {
    const animal1Id = document.getElementById('animal1-select')?.value;
    const animal2Id = document.getElementById('animal2-select')?.value;
    
    if (!animal1Id || !animal2Id) {
        showNotification('Please select both animals', 'warning');
        return;
    }
    
    if (animal1Id === animal2Id) {
        showNotification('Please select different animals', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // Get animal photos for analysis
        const animal1 = animals.find(a => a.id == animal1Id);
        const animal2 = animals.find(a => a.id == animal2Id);
        
        const request = {
            sessionName: `Breeding Analysis: ${animal1.name} & ${animal2.name}`,
            animalPhotos: [
                {
                    photoBase64: animal1.photoUrl ? await imageToBase64(animal1.photoUrl) : '',
                    animalName: animal1.name,
                    notes: `Type: ${animal1.type}, Breed: ${animal1.breed}`
                },
                {
                    photoBase64: animal2.photoUrl ? await imageToBase64(animal2.photoUrl) : '',
                    animalName: animal2.name,
                    notes: `Type: ${animal2.type}, Breed: ${animal2.breed}`
                }
            ]
        };
        
        const response = await fetch(`${API_BASE_URL}/breeding-box/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(request)
        });
        
        if (response.ok) {
            const result = await response.json();
            displayBreedingAnalysis(result);
        } else {
            throw new Error('Failed to analyze breeding compatibility');
        }
        
    } catch (error) {
        console.error('Error analyzing breeding box:', error);
        showNotification('Error analyzing breeding compatibility', 'error');
    } finally {
        showLoading(false);
    }
}

// Convert image URL to base64
async function imageToBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return '';
    }
}

// Display breeding analysis results
function displayBreedingAnalysis(result) {
    const recommendationsList = document.getElementById('recommendations-list');
    if (!recommendationsList) return;
    
    const overallScore = result.overallDiversityScore || 85;
    const breedingPairs = result.breedingPairs || [];
    const animalAnalysis = result.animalAnalysis || [];
    
    recommendationsList.innerHTML = `
        <div class="breeding-analysis">
            <h3>🧬 Breeding Box Analysis</h3>
            <div class="session-info">
                <h4>📋 Session: ${result.sessionName}</h4>
                <p>Box ID: ${result.boxId}</p>
            </div>
            
            <div class="compatibility-score">
                <div class="score-circle">
                    <span class="score-number">${overallScore}%</span>
                    <span class="score-label">Diversity Score</span>
                </div>
            </div>
            
            ${animalAnalysis.length > 0 ? `
            <div class="animal-analysis">
                <h4>🐄 Animal Analysis:</h4>
                <div class="analysis-grid">
                    ${animalAnalysis.map(animal => `
                        <div class="animal-analysis-card">
                            <h5>${animal.animalType || 'Unknown'} - ${animal.breed || 'Unknown Breed'}</h5>
                            <div class="analysis-details">
                                <p><strong>Age:</strong> ${animal.estimatedAge || 'Unknown'}</p>
                                <p><strong>Health:</strong> ${animal.healthStatus || 'Unknown'}</p>
                                <p><strong>Breeding Score:</strong> ${animal.breedingScore || 0}/100</p>
                                <p><strong>Readiness:</strong> ${animal.breedingReadiness || 'Unknown'}</p>
                                <p><strong>Traits:</strong> ${animal.traits || 'No traits identified'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${breedingPairs.length > 0 ? `
            <div class="breeding-pairs">
                <h4>💕 Recommended Breeding Pairs:</h4>
                <div class="pairs-grid">
                    ${breedingPairs.map(pair => `
                        <div class="pair-card">
                            <div class="pair-animals">
                                <span class="animal-name">${pair.animal1Name}</span>
                                <span class="pair-connector">💕</span>
                                <span class="animal-name">${pair.animal2Name}</span>
                            </div>
                            <div class="pair-score">
                                <span class="score">${pair.compatibilityScore}%</span>
                                <span class="score-label">Compatibility</span>
                            </div>
                            <div class="pair-details">
                                <p><strong>Reasoning:</strong> ${pair.reasoning || 'No reasoning provided'}</p>
                                <p><strong>Predicted Traits:</strong> ${pair.predictedTraits || 'Unknown'}</p>
                                <p><strong>Risk Factors:</strong> ${pair.riskFactors || 'Low risk'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${result.unsuitableAnimals && result.unsuitableAnimals.length > 0 ? `
            <div class="unsuitable-animals">
                <h4>⚠️ Unsuitable for Breeding:</h4>
                <ul>
                    ${result.unsuitableAnimals.map(animal => `<li>${animal}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="general-recommendations">
                <h4>💡 General Recommendations:</h4>
                <p>${result.generalRecommendations || 'Based on the analysis, consider the recommended breeding pairs for optimal genetic diversity and health.'}</p>
            </div>
        </div>
    `;
}

// Send message to AI advisor
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/ai-advisor/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(message)
        });
        
        if (response.ok) {
            const aiResponse = await response.text();
            addMessageToChat(aiResponse, 'ai');
        } else {
            throw new Error('Failed to get AI response');
        }
        
    } catch (error) {
        console.error('Error sending message to AI:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
        showLoading(false);
    }
}

// Send voice command to AI advisor
async function sendVoiceCommand(voiceInput) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/ai-advisor/voice-command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(voiceInput)
        });
        
        if (response.ok) {
            const aiResponse = await response.text();
            addMessageToChat(`Voice Command: ${voiceInput}`, 'user');
            addMessageToChat(aiResponse, 'ai');
        } else {
            throw new Error('Failed to process voice command');
        }
        
    } catch (error) {
        console.error('Error processing voice command:', error);
        addMessageToChat('Sorry, I couldn\'t process your voice command. Please try again.', 'ai');
    } finally {
        showLoading(false);
    }
}

// Submit question answers for specific animal
async function submitQuestionAnswers(animalId, question, answer) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/ai-advisor/questions/${animalId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                question: question,
                answer: answer
            })
        });
        
        if (response.ok) {
            const aiResponse = await response.text();
            addMessageToChat(`Q: ${question}\nA: ${answer}`, 'user');
            addMessageToChat(aiResponse, 'ai');
        } else {
            throw new Error('Failed to submit question answers');
        }
        
    } catch (error) {
        console.error('Error submitting question answers:', error);
        addMessageToChat('Sorry, I couldn\'t process your answers. Please try again.', 'ai');
    } finally {
        showLoading(false);
    }
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🤖' : '👤';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load schedule
async function loadSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/week`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const schedule = await response.json();
        displaySchedule(schedule);
    } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Error loading schedule', 'error');
    }
}

// Load upcoming tasks
async function loadUpcomingTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/upcoming`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const tasks = await response.json();
        return tasks;
    } catch (error) {
        console.error('Error loading upcoming tasks:', error);
        return [];
    }
}

// Create new schedule item
async function createScheduleItem(scheduleData) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(scheduleData)
        });
        
        if (response.ok) {
            const newSchedule = await response.json();
            showNotification('Schedule item created successfully!', 'success');
            loadSchedule();
            return newSchedule;
        } else {
            throw new Error('Failed to create schedule item');
        }
    } catch (error) {
        console.error('Error creating schedule item:', error);
        showNotification('Error creating schedule item', 'error');
    }
}

// Display schedule
function displaySchedule(scheduleItems) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;
    
    if (scheduleItems.length === 0) {
        scheduleList.innerHTML = `
            <div class="no-schedule">
                <div class="no-schedule-icon">📅</div>
                <h3>No upcoming tasks</h3>
                <p>Your schedule is clear for this week!</p>
            </div>
        `;
        return;
    }
    
    scheduleList.innerHTML = scheduleItems.map(item => `
        <div class="schedule-item ${item.completed ? 'completed' : ''}">
            <div class="schedule-header">
                <h4>${item.notes || 'Breeding Task'}</h4>
                <span class="schedule-date">${formatDate(item.scheduledDate)}</span>
            </div>
            <div class="schedule-details">
                <p><strong>Animal:</strong> ${item.animal?.name || 'Unknown'}</p>
                <p><strong>Type:</strong> ${item.animal?.type || 'Unknown'}</p>
                <p><strong>Reminder:</strong> ${item.reminderType || 'None'}</p>
            </div>
            <div class="schedule-actions">
                ${!item.completed ? `
                    <button class="btn-primary" onclick="markTaskComplete(${item.id})">
                        <i class="fas fa-check"></i> Mark Complete
                    </button>
                ` : `
                    <span class="completed-badge">
                        <i class="fas fa-check-circle"></i> Completed
                    </span>
                `}
            </div>
        </div>
    `).join('');
}

// Mark task as complete
async function markTaskComplete(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/${taskId}/complete`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showNotification('Task marked as complete!', 'success');
            loadSchedule();
        } else {
            throw new Error('Failed to mark task as complete');
        }
    } catch (error) {
        console.error('Error marking task complete:', error);
        showNotification('Error marking task as complete', 'error');
    }
}

// Load breeding recommendations for an animal
async function loadBreedingRecommendations(animalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/breeding/recommendations/${animalId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const recommendations = await response.json();
            return recommendations;
        } else {
            throw new Error('Failed to load breeding recommendations');
        }
    } catch (error) {
        console.error('Error loading breeding recommendations:', error);
        return [];
    }
}

// Load breeding history for an animal
async function loadBreedingHistory(animalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/breeding/history/${animalId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const history = await response.json();
            return history;
        } else {
            throw new Error('Failed to load breeding history');
        }
    } catch (error) {
        console.error('Error loading breeding history:', error);
        return [];
    }
}

// Schedule breeding
async function scheduleBreeding(animal1Id, animal2Id, breedingDate) {
    try {
        const response = await fetch(`${API_BASE_URL}/breeding/schedule?animal1Id=${animal1Id}&animal2Id=${animal2Id}&breedingDate=${breedingDate}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const record = await response.json();
            showNotification('Breeding scheduled successfully!', 'success');
            return record;
        } else {
            throw new Error('Failed to schedule breeding');
        }
    } catch (error) {
        console.error('Error scheduling breeding:', error);
        showNotification('Error scheduling breeding', 'error');
    }
}

// Setup form handlers
function setupFormHandlers() {
    const addAnimalForm = document.getElementById('add-animal-form');
    if (addAnimalForm) {
        addAnimalForm.addEventListener('submit', handleAddAnimal);
    }
}

// Handle add animal form submission
async function handleAddAnimal(e) {
    e.preventDefault();
    
    const animalData = {
        name: document.getElementById('animal-name').value,
        type: document.getElementById('animal-type').value,
        breed: document.getElementById('animal-breed').value,
        gender: document.getElementById('animal-gender').value,
        birthDate: document.getElementById('animal-birth-date').value,
        weight: parseFloat(document.getElementById('animal-weight').value) || null,
        healthStatus: 'GOOD',
        breedingStatus: 'NOT_READY',
        breedingScore: 0,
        geneticsTraits: '',
        temperament: '',
        offSpringCount: 0
    };
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/animals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(animalData)
        });
        
        if (response.ok) {
            const newAnimal = await response.json();
            showNotification('Animal added successfully!', 'success');
            closeModal('add-animal-modal');
            loadAnimals();
            resetAddAnimalForm();
            
            // If photo was uploaded, analyze it
            const photoFile = document.getElementById('animal-photo').files[0];
            if (photoFile) {
                await analyzeAndSavePhoto(newAnimal.id, photoFile);
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add animal');
        }
        
    } catch (error) {
        console.error('Error adding animal:', error);
        showNotification('Error adding animal: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Analyze and save photo for animal
async function analyzeAndSavePhoto(animalId, photoFile) {
    try {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('animalName', document.getElementById('animal-name').value);
        
        const response = await fetch(`${API_BASE_URL}/upload/analyze-and-save/${animalId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showNotification(`Photo analyzed! Breeding score: ${analysis.breedingScore}`, 'success');
            loadAnimals(); // Refresh to show updated data
        }
    } catch (error) {
        console.error('Error analyzing photo:', error);
        showNotification('Photo uploaded but analysis failed', 'warning');
    }
}

// Reset add animal form
function resetAddAnimalForm() {
    document.getElementById('add-animal-form').reset();
}

// Modal functions
function openAddAnimalModal() {
    document.getElementById('add-animal-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openScheduleModal() {
    showNotification('Schedule modal coming soon!', 'info');
}

// Photo analysis
function analyzePhoto() {
    document.getElementById('photo-analysis-modal').style.display = 'block';
}

// Handle photo upload
function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processPhoto(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
        processPhoto(file);
    }
}

async function processPhoto(file) {
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('animalName', 'Unknown Animal');
        
        const response = await fetch(`${API_BASE_URL}/upload/analyze-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            displayPhotoAnalysis(result);
        } else {
            throw new Error('Failed to analyze photo');
        }
        
    } catch (error) {
        console.error('Error analyzing photo:', error);
        showNotification('Error analyzing photo', 'error');
    } finally {
        showLoading(false);
    }
}

function displayPhotoAnalysis(result) {
    const analysisResult = document.getElementById('analysis-result');
    if (!analysisResult) return;
    
    analysisResult.style.display = 'block';
    analysisResult.innerHTML = `
        <h3>📸 AI Photo Analysis Results</h3>
        <div class="analysis-summary">
            <div class="analysis-score">
                <div class="score-circle">
                    <span class="score-number">${result.breedingScore || 0}</span>
                    <span class="score-label">Breeding Score</span>
                </div>
            </div>
        </div>
        
        <div class="analysis-details">
            <h4>🔍 Analysis Details:</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <strong>Animal Type:</strong> ${result.animalType || 'Unknown'}
                </div>
                <div class="detail-item">
                    <strong>Breed:</strong> ${result.breed || 'Unknown'}
                </div>
                <div class="detail-item">
                    <strong>Estimated Age:</strong> ${result.estimatedAge || 'Unknown'} years
                </div>
                <div class="detail-item">
                    <strong>Physical Condition:</strong> ${result.physicalCondition || 'Unknown'}
                </div>
                <div class="detail-item">
                    <strong>Health Status:</strong> ${result.healthStatus || 'Unknown'}
                </div>
                <div class="detail-item">
                    <strong>Breeding Readiness:</strong> ${result.breedingReadiness || 'Unknown'}
                </div>
                <div class="detail-item">
                    <strong>Confidence:</strong> ${Math.round((result.confidence || 0.85) * 100)}%
                </div>
            </div>
        </div>
        
        ${result.traits ? `
        <div class="traits-section">
            <h4>🧬 Identified Traits:</h4>
            <p>${result.traits}</p>
        </div>
        ` : ''}
        
        <div class="analysis-recommendations">
            <h4>💡 AI Recommendations:</h4>
            <p>${result.recommendations || 'Based on the photo analysis, this animal appears to be in good health and may be ready for breeding in the near future.'}</p>
        </div>
        
        <div class="analysis-actions">
            <button class="btn-primary" onclick="saveAnalysisToAnimal()">
                <i class="fas fa-save"></i> Save to Animal Record
            </button>
            <button class="btn-secondary" onclick="closeModal('photo-analysis-modal')">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
}

// Utility functions
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'block' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 4000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

function getNotificationColor(type) {
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        warning: '#ed8936',
        info: '#4299e1'
    };
    return colors[type] || '#4299e1';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
}

// Save analysis to animal record
function saveAnalysisToAnimal() {
    showNotification('Analysis saved to animal record!', 'success');
    closeModal('photo-analysis-modal');
}

// Open schedule modal
function openScheduleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'schedule-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📅 Add Schedule Item</h2>
                <span class="close" onclick="closeModal('schedule-modal')">&times;</span>
            </div>
            <form id="schedule-form" class="modal-body">
                <div class="form-group">
                    <label>Animal:</label>
                    <select id="schedule-animal" required>
                        <option value="">Select an animal...</option>
                        ${animals.map(animal => `<option value="${animal.id}">${animal.name} (${animal.type})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="schedule-date" required>
                </div>
                <div class="form-group">
                    <label>Notes:</label>
                    <textarea id="schedule-notes" placeholder="Enter schedule notes..."></textarea>
                </div>
                <div class="form-group">
                    <label>Reminder Type:</label>
                    <select id="schedule-reminder">
                        <option value="none">None</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push Notification</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('schedule-modal')">Cancel</button>
                    <button type="submit" class="btn-primary">Create Schedule</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('schedule-date').value = tomorrow.toISOString().split('T')[0];
    
    // Handle form submission
    document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const scheduleData = {
            animal: { id: parseInt(document.getElementById('schedule-animal').value) },
            scheduledDate: document.getElementById('schedule-date').value,
            notes: document.getElementById('schedule-notes').value,
            reminderType: document.getElementById('schedule-reminder').value,
            completed: false
        };
        
        await createScheduleItem(scheduleData);
        closeModal('schedule-modal');
    });
}

// Animal management functions
function viewAnimalDetails(animalId) {
    const animal = animals.find(a => a.id === animalId);
    if (animal) {
        showNotification(`Viewing details for ${animal.name}`, 'info');
        // Implement detailed view modal
    }
}

function editAnimal(animalId) {
    const animal = animals.find(a => a.id === animalId);
    if (animal) {
        showNotification(`Editing ${animal.name}`, 'info');
        // Implement edit functionality
    }
}

function markTaskComplete(taskId) {
    showNotification('Task marked as complete!', 'success');
    loadSchedule();
}

// Authentication Functions
function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
}

function showRegister() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const confirmInput = document.getElementById('register-confirm-password');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmInput.setCustomValidity('Passwords do not match');
        confirmInput.style.borderColor = '#f56565';
    } else {
        confirmInput.setCustomValidity('');
        confirmInput.style.borderColor = '#e2e8f0';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                rememberMe: rememberMe
            })
        });
        
        if (response.ok) {
            const authResponse = await response.json();
            
            currentUser = {
                id: authResponse.id,
                firstName: authResponse.firstName,
                lastName: authResponse.lastName,
                email: authResponse.email,
                farmName: authResponse.farmName,
                role: authResponse.role
            };
            authToken = authResponse.token;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification(`Welcome back to your farm, ${currentUser.firstName}! 🐄`, 'success');
            showMainApp();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Invalid email or password. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const farmName = document.getElementById('register-farm').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const acceptTerms = document.getElementById('accept-terms').checked;
    
    // Validate password match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (!acceptTerms) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                farmName: farmName,
                acceptTerms: acceptTerms
            })
        });
        
        if (response.ok) {
            const authResponse = await response.json();
            
            currentUser = {
                id: authResponse.id,
                firstName: authResponse.firstName,
                lastName: authResponse.lastName,
                email: authResponse.email,
                farmName: authResponse.farmName,
                role: authResponse.role
            };
            authToken = authResponse.token;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification(`Welcome to Farm Breed AI, ${firstName}! 🌾`, 'success');
            showMainApp();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function loginAsDemo() {
    currentUser = {
        id: 'demo',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@farm.com',
        farmName: 'Demo Farm'
    };
    authToken = 'demo-token-' + Date.now();
    
    // Store in localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showNotification('Welcome to Demo Mode! 🎮', 'success');
    showMainApp();
}

function logout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Reset variables
    currentUser = null;
    authToken = null;
    
    // Show auth modal
    showAuthModal();
    
    // Clear forms
    document.getElementById('login-form-element').reset();
    document.getElementById('register-form-element').reset();
    
    showNotification('You have been logged out. See you soon! 👋', 'info');
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-icon {
        font-size: 1.2rem;
    }
    
    .no-animals, .no-schedule {
        text-align: center;
        padding: 40px;
        color: #718096;
    }
    
    .no-animals-icon, .no-schedule-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .animal-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .animal-actions .btn-primary,
    .animal-actions .btn-secondary {
        flex: 1;
        padding: 8px 12px;
        font-size: 0.9rem;
    }
    
    .breeding-score {
        background: #e6fffa;
        color: #234e52;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.8rem;
        margin-left: 10px;
    }
    
    .compatibility-score {
        text-align: center;
        margin: 20px 0;
    }
    
    .score-circle {
        display: inline-block;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
    }
    
    .score-number {
        font-size: 2rem;
        font-weight: bold;
    }
    
    .score-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .analysis-details ul {
        list-style: none;
        padding: 0;
    }
    
    .analysis-details li {
        padding: 5px 0;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .drag-over {
        border-color: #667eea !important;
        background: rgba(102, 126, 234, 0.1) !important;
    }
`;
document.head.appendChild(style);
