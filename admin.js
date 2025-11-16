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
const saveConfigBtn = document.getElementById('saveConfigBtn');
const saveMessage = document.getElementById('saveMessage');
const saveError = document.getElementById('saveError');
const resetDataBtn = document.getElementById('resetDataBtn');
const resetMessage = document.getElementById('resetMessage');
const resetError = document.getElementById('resetError');

// Login functionality
loginBtn.addEventListener('click', handleLogin);
adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

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
    
    // Show week start day only for 'week' type
    if (dateType === 'week') {
        weekStartDayGroup.style.display = 'block';
    } else {
        weekStartDayGroup.style.display = 'none';
    }
    
    // Show custom dates only for 'single' type
    if (dateType === 'single') {
        dateRangeGroup.style.display = 'none';
        customDatesGroup.style.display = 'block';
    } else {
        dateRangeGroup.style.display = 'block';
        customDatesGroup.style.display = 'none';
    }
});

// Add family input field
addFamilyBtn.addEventListener('click', () => {
    addFamilyInput();
});

function addFamilyInput(value = '') {
    const familyGroup = document.createElement('div');
    familyGroup.className = 'family-input-group';
    
    familyGroup.innerHTML = `
        <input type="text" class="family-name-input" placeholder="Familie naam" value="${value}">
        <button class="remove-family-btn" type="button">
            <span class="material-icons">delete</span>
        </button>
    `;
    
    familyGroup.querySelector('.remove-family-btn').addEventListener('click', () => {
        familyGroup.remove();
    });
    
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
            
            // Trigger change event to show/hide appropriate fields
            dateTypeSelect.dispatchEvent(new Event('change'));
        } else {
            // Initialize with default values
            appNameInput.value = 'Meijersweekendje';
            appSubtitleInput.value = 'Vind het perfecte weekend voor de familie';
            
            familiesList.innerHTML = '';
            ['Hoorn', 'Limmen', 'IJburg', 'Versailles'].forEach(family => {
                addFamilyInput(family);
            });
            
            dateTypeSelect.value = 'weekends';
            startDateInput.value = new Date().toISOString().split('T')[0];
            endDateInput.value = '2026-12-31';
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
            
            customDates = datesText.split('\n')
                .map(line => line.trim())
                .filter(line => line !== '')
                .filter(line => {
                    // Validate date format YYYY-MM-DD
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(line)) {
                        alert(`Ongeldige datum: ${line}\nGebruik formaat: YYYY-MM-DD`);
                        return false;
                    }
                    return true;
                });
            
            if (customDates.length === 0) {
                alert('Geen geldige datums gevonden');
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
            families: families,
            date_type: dateType,
            week_start_day: parseInt(weekStartDaySelect.value),
            date_range_start: dateType === 'single' ? '' : startDateInput.value,
            date_range_end: dateType === 'single' ? '' : endDateInput.value,
            custom_dates: dateType === 'single' ? customDates : [],
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
        saveError.textContent = 'Fout bij opslaan: ' + error.message;
    }
});

// Reset all availability data
resetDataBtn.addEventListener('click', async () => {
    const confirmed = confirm(
        'WAARSCHUWING: Dit verwijdert ALLE geselecteerde datums van alle families!\n\n' +
        'Deze actie kan NIET ongedaan gemaakt worden.\n\n' +
        'Weet je het zeker?'
    );
    
    if (!confirmed) return;
    
    const doubleCheck = confirm(
        'Ben je ABSOLUUT zeker?\n\n' +
        'Alle data wordt permanent verwijderd!'
    );
    
    if (!doubleCheck) return;
    
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
        resetError.textContent = 'Fout bij verwijderen: ' + error.message;
    }
});

// Initialize with current date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    if (!startDateInput.value) {
        startDateInput.value = today;
    }
});
