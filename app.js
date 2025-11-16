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

// Families
const families = ['Hoorn', 'Limmen', 'IJburg', 'Versailles'];

// DOM Elements
const familySelection = document.getElementById('familySelection');
const weekendView = document.getElementById('weekendView');
const selectedFamilySpan = document.getElementById('selectedFamily');
const weekendGrid = document.getElementById('weekendGrid');
const backBtn = document.getElementById('backBtn');
const showOnlyFullCheckbox = document.getElementById('showOnlyFull');
const loading = document.getElementById('loading');

// No setup needed for Firebase - it's automatic!

// Generate all weekends from now until December 2026
function generateWeekends() {
    const weekends = [];
    const startDate = new Date();
    const endDate = new Date('2026-12-31');
    
    // Find the next Friday
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 5) { // 5 = Friday
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate all Fridays until end date
    while (currentDate <= endDate) {
        const friday = new Date(currentDate);
        const sunday = new Date(currentDate);
        sunday.setDate(sunday.getDate() + 2);
        
        weekends.push({
            id: formatDateId(friday),
            friday: new Date(friday),
            sunday: new Date(sunday),
            label: formatWeekendLabel(friday)
        });
        
        // Move to next Friday
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weekends;
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

function formatDateRange(friday, sunday) {
    const options = { day: 'numeric', month: 'short' };
    return `${friday.toLocaleDateString('nl-NL', options)} - ${sunday.toLocaleDateString('nl-NL', options)}`;
}

// Initialize
async function init() {
    loading.classList.remove('hidden');
    
    weekends = generateWeekends();
    
    // Add event listeners to family buttons
    document.querySelectorAll('.family-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectFamily(btn.dataset.family);
        });
    });
    
    backBtn.addEventListener('click', backToFamilySelection);
    showOnlyFullCheckbox.addEventListener('change', renderWeekends);
    
    loading.classList.add('hidden');
}

// Setup real-time listener
function setupRealtimeListener() {
    const availabilityRef = ref(db, 'availability');
    
    unsubscribe = onValue(availabilityRef, (snapshot) => {
        console.log('Real-time update received');
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
        
        console.log('Total availabilities loaded:', availabilities.length);
        
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
        console.log('Loading availabilities from Firebase Realtime Database...');
        const availabilityRef = ref(db, 'availability');
        const snapshot = await get(availabilityRef);
        
        availabilities = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const availability = data[key];
                console.log('Found availability:', availability);
                availabilities.push({
                    id: key,
                    ...availability
                });
            });
        }
        
        console.log('Total availabilities loaded:', availabilities.length);
        
        if (currentFamily) {
            renderWeekends();
        }
    } catch (error) {
        console.error('Error loading availabilities:', error);
        console.error('Error details:', error.message, error.code);
        
        if (error.code === 'PERMISSION_DENIED') {
            alert('Firebase security rules blokkeren het lezen van data.\n\nGa naar Firebase Console > Realtime Database > Rules en stel de regels in zoals beschreven in FIREBASE_INFO.md');
        } else {
            alert('Er is een fout opgetreden bij het laden: ' + error.message);
        }
    }
}

function getAvailabilityCount(weekendId) {
    return availabilities.filter(a => a.weekend_id === weekendId).length;
}

function isSelectedByFamily(weekendId, family) {
    return availabilities.some(a => 
        a.weekend_id === weekendId && a.family === family
    );
}

function renderWeekends() {
    const showOnlyFull = showOnlyFullCheckbox.checked;
    
    weekendGrid.innerHTML = '';
    
    weekends.forEach(weekend => {
        const count = getAvailabilityCount(weekend.id);
        const isSelected = isSelectedByFamily(weekend.id, currentFamily);
        
        // Filter logic
        if (showOnlyFull && count < 4) {
            return;
        }
        
        const card = document.createElement('div');
        card.className = `weekend-card availability-${count}`;
        if (isSelected) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="weekend-date">${weekend.label}</div>
            <div class="weekend-range">${formatDateRange(weekend.friday, weekend.sunday)}</div>
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
        console.log('Toggling weekend:', weekendId, 'Selected:', isCurrentlySelected);
        
        if (isCurrentlySelected) {
            // Deselect - delete from database
            // Find the record with matching weekend_id and family
            const availabilityRef = ref(db, 'availability');
            const snapshot = await get(availabilityRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(async (key) => {
                    const record = data[key];
                    if (record.weekend_id === weekendId && record.family === currentFamily) {
                        console.log('Deleting record:', key);
                        const recordRef = ref(db, `availability/${key}`);
                        await remove(recordRef);
                    }
                });
            }
        } else {
            // Select - insert into database
            console.log('Adding availability:', { weekend_id: weekendId, family: currentFamily });
            const availabilityRef = ref(db, 'availability');
            const newRecordRef = push(availabilityRef);
            await push(availabilityRef, {
                weekend_id: weekendId,
                family: currentFamily,
                created_at: new Date().toISOString()
            });
            console.log('Record written successfully');
        }
        
        // Real-time listener will handle the update
        
    } catch (error) {
        console.error('Error toggling weekend:', error);
        console.error('Error details:', error.message, error.code);
        
        if (error.code === 'PERMISSION_DENIED') {
            alert('Firebase security rules blokkeren deze actie.\n\nGa naar Firebase Console > Realtime Database > Rules en stel de regels in zoals beschreven in FIREBASE_INFO.md');
        } else {
            alert('Er is een fout opgetreden: ' + error.message + '\n\nZie console voor details.');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
