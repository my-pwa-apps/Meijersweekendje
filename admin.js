// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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

// Admin password
const ADMIN_PASSWORD = '5790';

// State
let isLoggedIn = false;

// DOM Elements
const passwordScreen = document.getElementById('passwordScreen');
const configScreen = document.getElementById('configScreen');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const passwordError = document.getElementById('passwordError');
const logoutBtn = document.getElementById('logoutBtn');
const loading = document.getElementById('loading');

// Config form elements
const appNameInput = document.getElementById('appName');
const appSubtitleInput = document.getElementById('appSubtitle');
const accessCodeInput = document.getElementById('accessCode');
const familiesList = document.getElementById('familiesList');
const addFamilyBtn = document.getElementById('addFamilyBtn');
const dateTypeSelect = document.getElementById('dateType');
const weekStartDaySelect = document.getElementById('weekStartDay');
const weekStartDayGroup = document.getElementById('weekStartDayGroup');
const dateRangeGroup = document.getElementById('dateRangeGroup');
const customDatesGroup = document.getElementById('customDatesGroup');
const customDatesTextarea = document.getElementById('customDates');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const manualSelectionGroup = document.getElementById('manualSelectionGroup');
const calendarDays = document.getElementById('calendarDays');
const calendarMonthYear = document.getElementById('calendarMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDatesItems = document.getElementById('selectedDatesItems');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const saveMessage = document.getElementById('saveMessage');
const saveError = document.getElementById('saveError');
const resetDataBtn = document.getElementById('resetDataBtn');
const resetMessage = document.getElementById('resetMessage');
const resetError = document.getElementById('resetError');

// Calendar state
let currentCalendarDate = new Date();
let selectedManualDates = [];

// Login functionality
loginBtn.addEventListener('click', handleLogin);
adminPassword.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());

function handleLogin() {
    const password = adminPassword.value.trim();
    
    if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        passwordError.classList.add('hidden');
        passwordScreen.classList.add('hidden');
        configScreen.classList.remove('hidden');
        loadConfig();
    } else {
        passwordError.classList.remove('hidden');
        adminPassword.value = '';
        adminPassword.focus();
    }
}

logoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    configScreen.classList.add('hidden');
    passwordScreen.classList.remove('hidden');
    adminPassword.value = '';
});

// Toggle field visibility based on date type
dateTypeSelect.addEventListener('change', () => {
    const dateType = dateTypeSelect.value;
    const isWeekType = dateType === 'week';
    const isSingleType = dateType === 'single';
    
    weekStartDayGroup.style.display = isWeekType ? 'block' : 'none';
    dateRangeGroup.style.display = isSingleType ? 'none' : 'block';
    customDatesGroup.style.display = isSingleType ? 'block' : 'none';
    manualSelectionGroup.style.display = isSingleType ? 'none' : 'block';
    
    // Re-render calendar when type changes
    if (!isSingleType) {
        renderCalendar();
    }
});

// Add family input field
addFamilyBtn.addEventListener('click', () => addFamilyInput());

// Calendar navigation
prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

// Render calendar
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                        'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    let days = '';
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
        days += `<div class="calendar-day other-month empty">${prevLastDate - i + 1}</div>`;
    }
    
    // Current month days
    const today = new Date();
    const dateType = dateTypeSelect.value;
    
    for (let day = 1; day <= lastDate; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateForCalendar(date);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = selectedManualDates.includes(dateStr);
        const dayOfWeek = date.getDay();
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        
        // Highlight weekend starts (Friday) for weekend type
        if (dateType === 'weekends' && dayOfWeek === 5) {
            classes += ' weekend-start';
        }
        // Highlight Monday for midweek/week types
        if ((dateType === 'midweek' || dateType === 'week') && dayOfWeek === 1) {
            classes += ' weekend-start';
        }
        
        days += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }
    
    // Next month days
    const totalCells = days.split('calendar-day').length - 1;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        days += `<div class="calendar-day other-month empty">${i}</div>`;
    }
    
    calendarDays.innerHTML = days;
    
    // Add click handlers
    document.querySelectorAll('.calendar-day:not(.empty):not(.other-month)').forEach(dayEl => {
        dayEl.addEventListener('click', () => toggleDateSelection(dayEl.dataset.date));
    });
    
    updateSelectedDatesList();
}

function formatDateForCalendar(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toggleDateSelection(dateStr) {
    const index = selectedManualDates.indexOf(dateStr);
    if (index > -1) {
        selectedManualDates.splice(index, 1);
    } else {
        selectedManualDates.push(dateStr);
    }
    selectedManualDates.sort();
    renderCalendar();
}

function updateSelectedDatesList() {
    if (selectedManualDates.length === 0) {
        selectedDatesItems.innerHTML = '<em>Geen datums geselecteerd</em>';
        return;
    }
    
    const dateType = dateTypeSelect.value;
    selectedDatesItems.innerHTML = selectedManualDates.map(dateStr => {
        const date = new Date(dateStr + 'T12:00:00');
        const formatted = formatSelectedDate(date, dateType);
        return `
            <div class="selected-date-chip">
                <span>${formatted}</span>
                <button type="button" onclick="removeManualDate('${dateStr}')" aria-label="Verwijder">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
    }).join('');
}

function formatSelectedDate(date, dateType) {
    const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    
    if (dateType === 'weekends') {
        const sunday = new Date(date);
        sunday.setDate(sunday.getDate() + 2);
        return `${date.getDate()}-${sunday.getDate()} ${months[date.getMonth()]}`;
    } else if (dateType === 'midweek') {
        const friday = new Date(date);
        friday.setDate(friday.getDate() + 4);
        return `${date.getDate()}-${friday.getDate()} ${months[date.getMonth()]}`;
    } else if (dateType === 'week') {
        const end = new Date(date);
        end.setDate(end.getDate() + 6);
        return `${date.getDate()}-${end.getDate()} ${months[date.getMonth()]}`;
    } else {
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    }
}

// Global function for removing dates (called from HTML)
window.removeManualDate = function(dateStr) {
    const index = selectedManualDates.indexOf(dateStr);
    if (index > -1) {
        selectedManualDates.splice(index, 1);
    }
    renderCalendar();
};

function addFamilyInput(value = '') {
    const familyGroup = document.createElement('div');
    familyGroup.className = 'family-input-group';
    familyGroup.innerHTML = `
        <input type="text" class="family-name-input" placeholder="Familie naam" value="${value}" maxlength="30">
        <button class="remove-family-btn" type="button" aria-label="Verwijder familie">
            <span class="material-icons">delete</span>
        </button>
    `;
    
    familyGroup.querySelector('.remove-family-btn').addEventListener('click', () => familyGroup.remove());
    familiesList.appendChild(familyGroup);
}

// Load configuration from Firebase
async function loadConfig() {
    try {
        loading.classList.remove('hidden');
        
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        
        if (snapshot.exists()) {
            const config = snapshot.val();
            
            // Load app info
            appNameInput.value = config.app_name || 'Meijersweekendje';
            appSubtitleInput.value = config.app_subtitle || 'Vind het perfecte weekend voor de familie';
            accessCodeInput.value = config.access_code || '';
            
            // Load families
            familiesList.innerHTML = '';
            const families = config.families || ['Hoorn', 'Limmen', 'IJburg', 'Versailles'];
            families.forEach(family => {
                addFamilyInput(family);
            });
            
            // Load date settings
            dateTypeSelect.value = config.date_type || 'weekends';
            weekStartDaySelect.value = config.week_start_day || '1';
            startDateInput.value = config.date_range_start || new Date().toISOString().split('T')[0];
            endDateInput.value = config.date_range_end || '2026-12-31';
            customDatesTextarea.value = config.custom_dates ? config.custom_dates.join('\n') : '';
            
            // Load manually selected dates
            selectedManualDates = config.selected_manual_dates || [];
            
            // Trigger change event to show/hide appropriate fields
            dateTypeSelect.dispatchEvent(new Event('change'));
            
            // Render calendar
            renderCalendar();
        } else {
            // Initialize with default values
            appNameInput.value = 'Meijersweekendje';
            appSubtitleInput.value = 'Vind het perfecte weekend voor de familie';
            accessCodeInput.value = '';
            
            familiesList.innerHTML = '';
            ['Hoorn', 'Limmen', 'IJburg', 'Versailles'].forEach(family => {
                addFamilyInput(family);
            });
            
            dateTypeSelect.value = 'weekends';
            startDateInput.value = new Date().toISOString().split('T')[0];
            endDateInput.value = '2026-12-31';
            selectedManualDates = [];
            
            renderCalendar();
        }
        
        loading.classList.add('hidden');
    } catch (error) {
        console.error('Error loading config:', error);
        loading.classList.add('hidden');
        alert('Fout bij laden van configuratie: ' + error.message);
    }
}

// Save configuration to Firebase
saveConfigBtn.addEventListener('click', async () => {
    try {
        loading.classList.remove('hidden');
        saveMessage.classList.add('hidden');
        saveError.classList.add('hidden');
        
        // Gather family names
        const familyInputs = document.querySelectorAll('.family-name-input');
        const families = Array.from(familyInputs)
            .map(input => input.value.trim())
            .filter(name => name !== '');
        
        if (families.length === 0) {
            alert('Voeg minimaal één familie/deelnemer toe');
            loading.classList.add('hidden');
            return;
        }
        
        const dateType = dateTypeSelect.value;
        let customDates = [];
        
        // Validate based on date type
        if (dateType === 'single') {
            // Parse custom dates
            const datesText = customDatesTextarea.value.trim();
            if (!datesText) {
                alert('Voeg minimaal één datum toe voor losse dagen');
                loading.classList.add('hidden');
                return;
            }
            
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            customDates = datesText.split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');
            
            const invalidDate = customDates.find(line => !dateRegex.test(line));
            if (invalidDate) {
                alert(`Ongeldige datum: ${invalidDate}\nGebruik formaat: YYYY-MM-DD`);
                loading.classList.add('hidden');
                return;
            }

        } else {
            // Validate date range
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            if (!startDate || !endDate) {
                alert('Vul beide datums in');
                loading.classList.add('hidden');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('Start datum moet voor eind datum liggen');
                loading.classList.add('hidden');
                return;
            }
        }
        
        // Create config object
        const config = {
            app_name: appNameInput.value.trim() || 'Datumprikker',
            app_subtitle: appSubtitleInput.value.trim() || 'Vind de perfecte datum',
            access_code: accessCodeInput.value.trim().toUpperCase() || '',
            families: families,
            date_type: dateType,
            week_start_day: parseInt(weekStartDaySelect.value),
            date_range_start: dateType === 'single' ? '' : startDateInput.value,
            date_range_end: dateType === 'single' ? '' : endDateInput.value,
            custom_dates: dateType === 'single' ? customDates : [],
            selected_manual_dates: selectedManualDates,
            updated_at: new Date().toISOString()
        };
        
        // Save to Firebase
        const configRef = ref(db, 'config');
        await set(configRef, config);
        
        loading.classList.add('hidden');
        saveMessage.classList.remove('hidden');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            saveMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error saving config:', error);
        loading.classList.add('hidden');
        saveError.classList.remove('hidden');
        saveError.textContent = 'Fout bij opslaan van configuratie.';
    }
});

// Reset all availability data
resetDataBtn.addEventListener('click', async () => {
    if (!confirm('WAARSCHUWING: Dit verwijdert ALLE geselecteerde datums van alle families!\n\nDeze actie kan NIET ongedaan gemaakt worden.\n\nWeet je het zeker?')) {
        return;
    }
    
    if (!confirm('Ben je ABSOLUUT zeker? Alle data wordt permanent verwijderd!')) {
        return;
    }
    
    try {
        loading.classList.remove('hidden');
        resetMessage.classList.add('hidden');
        resetError.classList.add('hidden');
        
        // Delete the entire availability node
        const availabilityRef = ref(db, 'availability');
        await set(availabilityRef, null);
        
        loading.classList.add('hidden');
        resetMessage.classList.remove('hidden');
        
        setTimeout(() => {
            resetMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error resetting data:', error);
        loading.classList.add('hidden');
        resetError.classList.remove('hidden');
        resetError.textContent = 'Fout bij verwijderen van data.';
    }
});

// Initialize with current date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    if (!startDateInput.value) {
        startDateInput.value = today;
    }
});
