# Meijersweekendje - Datumprikker PWA

Een volledig configureerbare datumprikker Progressive Web App (PWA) voor het plannen van weekenden, midweeks, hele weken of losse dagen met familie of vrienden.

## Features

- ✅ **PWA Support**: Installeerbaar op alle apparaten, werkt offline
- 🔄 **Real-time Synchronisatie**: Firebase Realtime Database
- 📱 **Responsive Design**: Mobiel, tablet en desktop
- 🎨 **Modern UI**: Material Design met Poppins font
- ⚙️ **Admin Panel**: Volledige configuratie via admin pagina
- 🔒 **Wachtwoord Beveiliging**: Admin toegang met wachtwoord (5790)
- 🎯 **Configureerbaar**:
  - App naam en ondertitel
  - Families/deelnemers (dynamisch toevoegen/verwijderen)
  - Datum types: weekenden, midweek, hele weken, of losse dagen
  - Datum bereik of custom datums
  - Startdag voor hele weken configureerbaar

## Installatie

1. Clone de repository
2. Configureer Firebase Realtime Database (zie FIREBASE_INFO.md)
3. Start een lokale webserver: `python -m http.server 8000`
4. Open http://localhost:8000

## Admin Configuratie

1. Ga naar http://localhost:8000/admin.html
2. Login met wachtwoord: **5790**
3. Configureer de app naar wens
4. Klik "Configuratie Opslaan"

## Firebase Setup

Zie `FIREBASE_INFO.md` voor volledige Firebase setup instructies.

## PWA Installatie

De app kan geïnstalleerd worden als Progressive Web App:
- **Desktop**: Klik op het install icoon in de adresbalk
- **Mobile**: Klik "Add to Home Screen" in het browser menu

## Technologie Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6
- **Database**: Firebase Realtime Database
- **Design**: Material Design, Poppins Font
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Material Icons

## Browser Support

- Chrome/Edge (volledig)
- Firefox (volledig)
- Safari (volledig)
- Opera (volledig)

## License

ISC
