// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, remove, onValue, get, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDd5kIISBmRYkBkNiBiTPqh9EcGP2mg4C8",
    authDomain: "meijersweekendje.firebaseapp.com",
    databaseURL: "https://meijersweekendje-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "meijersweekendje",
    storageBucket: "meijersweekendje.firebasestorage.app",
    messagingSenderId: "661843920890",
    appId: "1:661843920890:web:bec46152e5cddea4ac8643",
    measurementId: "G-GPHW42EY5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// State
let currentFamily = null;
let weekends = [];
let availabilities = [];
let unsubscribe = null;
let config = null;

// Families (will be loaded from config)
let families = ['Hoorn', 'Limmen', 'IJburg', 'Versailles'];

// DOM Elements
const accessCodeScreen = document.getElementById('accessCodeScreen');
const familyAccessCode = document.getElementById('familyAccessCode');
const accessLoginBtn = document.getElementById('accessLoginBtn');
const accessCodeError = document.getElementById('accessCodeError');
const familySelection = document.getElementById('familySelection');
const weekendView = document.getElementById('weekendView');
const selectedFamilySpan = document.getElementById('selectedFamily');
const weekendGrid = document.getElementById('weekendGrid');
const backBtn = document.getElementById('backBtn');
const showOnlyFullCheckbox = document.getElementById('showOnlyFull');
const loading = document.getElementById('loading');
const celebration = document.getElementById('celebration');
const closeCelebrationBtn = document.getElementById('closeCelebration');

// Access control
let isAccessGranted = false;

// No setup needed for Firebase - it's automatic!

// Generate dates based on config
function generateWeekends() {
    const dates = [];
    const manualDates = new Set(); // Track manually selected dates
    const dateType = config?.date_type || 'weekends';
    const startDate = config?.date_range_start ? new Date(config.date_range_start) : new Date();
    const endDate = config?.date_range_end ? new Date(config.date_range_end) : new Date('2026-12-31');
    
    // First, add manually selected dates
    if (config?.selected_manual_dates && config.selected_manual_dates.length > 0) {
        config.selected_manual_dates.forEach(dateStr => {
            const date = new Date(dateStr + 'T12:00:00');
            manualDates.add(formatDateId(date));
            
            if (dateType === 'weekends') {
                const friday = new Date(date);
                const sunday = new Date(date);
                sunday.setDate(sunday.getDate() + 2);
                dates.push({
                    id: formatDateId(friday),
                    friday: new Date(friday),
                    sunday: new Date(sunday),
                    label: formatWeekendLabel(friday),
                    manual: true
                });
            } else if (dateType === 'midweek') {
                const monday = new Date(date);
                const friday = new Date(date);
                friday.setDate(friday.getDate() + 4);
                dates.push({
                    id: formatDateId(monday),
                    friday: new Date(monday),
                    sunday: new Date(friday),
                    label: formatMidweekLabel(monday),
                    manual: true
                });
            } else if (dateType === 'week') {
                const weekStart = new Date(date);
                const weekEnd = new Date(date);
                weekEnd.setDate(weekEnd.getDate() + 6);
                dates.push({
                    id: formatDateId(weekStart),
                    friday: new Date(weekStart),
                    sunday: new Date(weekEnd),
                    label: formatWeekLabel(weekStart),
                    manual: true
                });
            } else {
                dates.push({
                    id: formatDateId(date),
                    friday: new Date(date),
                    sunday: new Date(date),
                    label: formatSingleDayLabel(date),
                    manual: true
                });
            }
        });
    }
    
    // Then add dates from range (skip if already manually selected)
    if (dateType === 'weekends') {
        // Find the next Friday
        let currentDate = new Date(startDate);
        while (currentDate.getDay() !== 5) { // 5 = Friday
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Generate all Fridays until end date
        while (currentDate <= endDate) {
            const friday = new Date(currentDate);
            const dateId = formatDateId(friday);
            
            if (!manualDates.has(dateId)) {
                const sunday = new Date(currentDate);
                sunday.setDate(sunday.getDate() + 2);
                
                dates.push({
                    id: dateId,
                    friday: new Date(friday),
                    sunday: new Date(sunday),
                    label: formatWeekendLabel(friday)
                });
            }
            
            // Move to next Friday
            currentDate.setDate(currentDate.getDate() + 7);
        }
    } else if (dateType === 'midweek') {
        // Find the next Monday
        let currentDate = new Date(startDate);
        while (currentDate.getDay() !== 1) { // 1 = Monday
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Generate all Mondays until end date (Monday to Friday = 4 days)
        while (currentDate <= endDate) {
            const monday = new Date(currentDate);
            const dateId = formatDateId(monday);
            
            if (!manualDates.has(dateId)) {
                const friday = new Date(currentDate);
                friday.setDate(friday.getDate() + 4);
                
                dates.push({
                    id: dateId,
                    friday: new Date(monday),
                    sunday: new Date(friday),
                    label: formatMidweekLabel(monday)
                });
            }
            
            // Move to next Monday
            currentDate.setDate(currentDate.getDate() + 7);
        }
    } else if (dateType === 'week') {
        // Use configured start day (default Monday)
        const weekStartDay = config?.week_start_day || 1;
        let currentDate = new Date(startDate);
        while (currentDate.getDay() !== weekStartDay) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Generate all weeks until end date
        while (currentDate <= endDate) {
            const weekStart = new Date(currentDate);
            const dateId = formatDateId(weekStart);
            
            if (!manualDates.has(dateId)) {
                const weekEnd = new Date(currentDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                dates.push({
                    id: dateId,
                    friday: new Date(weekStart),
                    sunday: new Date(weekEnd),
                    label: formatWeekLabel(weekStart)
                });
            }
            
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
        }
    } else {
        // Generate custom single days
        const customDates = config?.custom_dates || [];
        if (customDates.length > 0) {
            customDates.forEach(dateStr => {
                const date = new Date(dateStr);
                const dateId = formatDateId(date);
                
                if (!manualDates.has(dateId)) {
                    dates.push({
                        id: dateId,
                        friday: new Date(date),
                        sunday: new Date(date),
                        label: formatSingleDayLabel(date)
                    });
                }
            });
        } else {
            // Fallback: generate all days in range
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateId = formatDateId(currentDate);
                
                if (!manualDates.has(dateId)) {
                    dates.push({
                        id: dateId,
                        friday: new Date(currentDate),
                        sunday: new Date(currentDate),
                        label: formatSingleDayLabel(currentDate)
                    });
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }
    
    // Sort all dates chronologically
    dates.sort((a, b) => a.friday - b.friday);
    
    return dates;
}

function formatDateId(date) {
    return date.toISOString().split('T')[0];
}

function formatWeekendLabel(friday) {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 
                   'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const sunday = new Date(friday);
    sunday.setDate(sunday.getDate() + 2);
    
    return `${friday.getDate()}-${sunday.getDate()} ${months[friday.getMonth()]}`;
}

function formatSingleDayLabel(date) {
    const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 
                   'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatMidweekLabel(monday) {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 
                   'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    
    return `${monday.getDate()}-${friday.getDate()} ${months[monday.getMonth()]}`;
}

function formatWeekLabel(monday) {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 
                   'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return `${monday.getDate()}-${sunday.getDate()} ${months[monday.getMonth()]}`;
}

function formatDateRange(friday, sunday) {
    const options = { day: 'numeric', month: 'short' };
    return `${friday.toLocaleDateString('nl-NL', options)} - ${sunday.toLocaleDateString('nl-NL', options)}`;
}

// Check access code from localStorage
function checkStoredAccess() {
    const storedCode = localStorage.getItem('datumprikker_access');
    if (storedCode && config && storedCode === config.access_code) {
        isAccessGranted = true;
        return true;
    }
    return false;
}

// Handle access code login
function handleAccessLogin() {
    const enteredCode = familyAccessCode.value.trim().toUpperCase();
    
    if (!config || !config.access_code) {
        // No access code configured, grant access
        isAccessGranted = true;
        showFamilySelection();
        return;
    }
    
    if (enteredCode === config.access_code) {
        isAccessGranted = true;
        localStorage.setItem('datumprikker_access', enteredCode);
        accessCodeError.classList.add('hidden');
        showFamilySelection();
    } else {
        accessCodeError.classList.remove('hidden');
        familyAccessCode.value = '';
        familyAccessCode.focus();
    }
}

function showFamilySelection() {
    accessCodeScreen.classList.add('hidden');
    familySelection.classList.remove('hidden');
}

// Load configuration from Firebase
async function loadConfig() {
    try {
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        
        if (snapshot.exists()) {
            config = snapshot.val();
            families = config.families || ['Hoorn', 'Limmen', 'IJburg', 'Versailles'];
            
            // Update page title
            document.querySelector('header h1').textContent = config.app_name || 'Meijersweekendje';
            document.querySelector('.subtitle').textContent = config.app_subtitle || 'Vind het perfecte weekend voor de familie';
            document.title = config.app_name || 'Meijersweekendje';
        } else {
            console.log('No config found, using defaults');
        }
    } catch (error) {
        console.error('Error loading config:', error);
        // Use defaults if config fails to load
    }
    
    // Check if access code is required and valid
    if (!config || !config.access_code || checkStoredAccess()) {
        isAccessGranted = true;
        accessCodeScreen.classList.add('hidden');
        familySelection.classList.remove('hidden');
    } else {
        // Show access code screen
        accessCodeScreen.classList.remove('hidden');
        familySelection.classList.add('hidden');
    }
    
    // Always update family buttons (even with default families)
    const familyButtonsContainer = document.querySelector('.family-buttons');
    if (familyButtonsContainer) {
        familyButtonsContainer.innerHTML = '';
        families.forEach(family => {
            const btn = document.createElement('button');
            btn.className = 'family-btn';
            btn.dataset.family = family;
            btn.innerHTML = `
                <span class="material-icons">home</span>
                <span>${family}</span>
            `;
            btn.addEventListener('click', () => selectFamily(family));
            familyButtonsContainer.appendChild(btn);
        });
    }
}

// Initialize
async function init() {
    loading.classList.remove('hidden');
    
    await loadConfig();
    weekends = generateWeekends();
    
    // Access code event listeners
    accessLoginBtn.addEventListener('click', handleAccessLogin);
    familyAccessCode.addEventListener('keypress', (e) => e.key === 'Enter' && handleAccessLogin());
    
    backBtn.addEventListener('click', backToFamilySelection);
    showOnlyFullCheckbox.addEventListener('change', renderWeekends);
    closeCelebrationBtn.addEventListener('click', () => {
        celebration.classList.add('hidden');
    });
    
    loading.classList.add('hidden');
}

// Setup real-time listener
function setupRealtimeListener() {
    const availabilityRef = ref(db, 'availability');
    
    unsubscribe = onValue(availabilityRef, (snapshot) => {
        const data = snapshot.val();
        
        availabilities = [];
        if (data) {
            Object.keys(data).forEach(key => {
                availabilities.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        if (currentFamily) {
            renderWeekends();
        }
    });
}

async function selectFamily(family) {
    currentFamily = family;
    selectedFamilySpan.textContent = family;
    
    familySelection.classList.add('hidden');
    loading.classList.remove('hidden');
    
    await loadAvailabilities();
    setupRealtimeListener();
    
    loading.classList.add('hidden');
    weekendView.classList.remove('hidden');
    
    renderWeekends();
}

function backToFamilySelection() {
    currentFamily = null;
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    weekendView.classList.add('hidden');
    familySelection.classList.remove('hidden');
}

async function loadAvailabilities() {
    try {
        const availabilityRef = ref(db, 'availability');
        const snapshot = await get(availabilityRef);
        
        availabilities = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                availabilities.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        if (currentFamily) {
            renderWeekends();
        }
    } catch (error) {
        console.error('Error loading availabilities:', error);
        
        if (error.code === 'PERMISSION_DENIED') {
            alert('Firebase toegang geweigerd. Controleer de beveiligingsregels.');
        } else {
            alert('Er is een fout opgetreden bij het laden.');
        }
    }
}

function getAvailabilityCount(weekendId) {
    return availabilities.filter(a => a.weekend_id === weekendId).length;
}

function getAvailableFamilies(weekendId) {
    return availabilities
        .filter(a => a.weekend_id === weekendId)
        .map(a => a.family);
}

function isSelectedByFamily(weekendId, family) {
    return availabilities.some(a => 
        a.weekend_id === weekendId && a.family === family
    );
}

function checkForCelebration() {
    const fullWeekends = weekends.filter(weekend => {
        return getAvailabilityCount(weekend.id) === 4;
    });
    
    if (fullWeekends.length > 0) {
        const fullWeekendsList = document.getElementById('fullWeekendsList');
        fullWeekendsList.innerHTML = fullWeekends.map(weekend => {
            return `<div class="full-weekend-item">
                        <strong>${weekend.label}</strong>
                        <span>${formatDateRange(weekend.friday, weekend.sunday)}</span>
                    </div>`;
        }).join('');
        celebration.classList.remove('hidden');
    }
}

function renderWeekends() {
    const showOnlyFull = showOnlyFullCheckbox.checked;
    
    weekendGrid.innerHTML = '';
    
    // Check if there's a weekend with all 4 families
    checkForCelebration();
    
    weekends.forEach(weekend => {
        const count = getAvailabilityCount(weekend.id);
        const isSelected = isSelectedByFamily(weekend.id, currentFamily);
        
        // Filter logic
        if (showOnlyFull && count < 3) {
            return;
        }
        
        const availableFamilies = getAvailableFamilies(weekend.id);
        
        const card = document.createElement('div');
        card.className = `weekend-card availability-${count}`;
        if (isSelected) {
            card.classList.add('selected');
        }
        
        const familyCheckmarks = families.map(family => {
            const isAvailable = availableFamilies.includes(family);
            return `<span class="family-check ${isAvailable ? 'available' : ''}">${family} ${isAvailable ? '✓' : ''}</span>`;
        }).join('');
        
        card.innerHTML = `
            <div class="weekend-date">${formatDateRange(weekend.friday, weekend.sunday)}</div>
            <div class="family-availability">
                ${familyCheckmarks}
            </div>
            <div class="weekend-status">
                <span class="status-count count-${count}">${count}/4 gezinnen</span>
                <span class="checkmark">✓</span>
            </div>
        `;
        
        card.addEventListener('click', () => toggleWeekend(weekend.id, isSelected));
        
        weekendGrid.appendChild(card);
    });
    
    if (weekendGrid.children.length === 0) {
        weekendGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">Geen weekenden gevonden.</p>';
    }
}

async function toggleWeekend(weekendId, isCurrentlySelected) {
    try {
        if (isCurrentlySelected) {
            // Deselect - delete from database
            // Find the record with matching weekend_id and family
            const availabilityRef = ref(db, 'availability');
            const snapshot = await get(availabilityRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                const deletePromises = Object.keys(data)
                    .filter(key => {
                        const record = data[key];
                        return record.weekend_id === weekendId && record.family === currentFamily;
                    })
                    .map(key => remove(ref(db, `availability/${key}`)));
                await Promise.all(deletePromises);
            }
        } else {
            // Select - insert into database
            const availabilityRef = ref(db, 'availability');
            await push(availabilityRef, {
                weekend_id: weekendId,
                family: currentFamily,
                created_at: new Date().toISOString()
            });
        }
        
        // Real-time listener will handle the update
        
    } catch (error) {
        console.error('Error toggling weekend:', error);
        
        if (error.code === 'PERMISSION_DENIED') {
            alert('Firebase toegang geweigerd. Controleer de beveiligingsregels.');
        } else {
            alert('Er is een fout opgetreden. Probeer het opnieuw.');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
