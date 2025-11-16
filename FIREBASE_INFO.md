# Firebase Realtime Database Setup

## Setup Stappen

De app gebruikt Firebase Realtime Database voor real-time synchronisatie tussen alle gezinnen.

### 1. Maak een Realtime Database aan

1. Ga naar https://console.firebase.google.com/project/meijersweekendje/database
2. Klik op **"Create Database"** onder Realtime Database (NIET Firestore!)
3. Kies locatie: **europe-west1** (voor Europa)
4. Start in **"test mode"** (voor nu)
5. Klik op **"Enable"**

### 2. Configureer Security Rules

Ga naar de **Rules** tab en vervang de regels met:

```json
{
  "rules": {
    "availability": {
      ".read": true,
      ".write": true,
      "$record": {
        ".validate": "newData.hasChildren(['weekend_id', 'family', 'created_at'])"
      }
    }
  }
}
```

Klik op **"Publish"**

## Database Structuur

De database heeft een `availability` node met records in dit formaat:

```json
{
  "availability": {
    "-NXxxx...": {
      "weekend_id": "2025-11-22",
      "family": "Hoorn",
      "created_at": "2025-11-16T14:30:00.000Z"
    },
    "-NXyyy...": {
      "weekend_id": "2025-11-22",
      "family": "Limmen",
      "created_at": "2025-11-16T14:35:00.000Z"
    }
  }
}
```

- **Key**: Auto-generated Firebase ID
- **weekend_id**: Datum van de vrijdag (YYYY-MM-DD)
- **family**: Naam van het gezin
- **created_at**: ISO timestamp

## Real-time Updates

De app gebruikt Firebase's `onValue()` listener voor automatische real-time updates. Wanneer één gezin een weekend selecteert, zien alle andere open browsers direct de update zonder te hoeven verversen! ⚡

## Firebase Configuratie

De Firebase config in `app.js` bevat:
- **Database URL**: https://meijersweekendje-default-rtdb.europe-west1.firebasedatabase.app
- **Project ID**: meijersweekendje
- **Region**: europe-west1

## Testen

1. Open `index.html` in meerdere browser tabs
2. Selecteer verschillende gezinnen
3. Klik op weekenden
4. Zie de updates real-time verschijnen in alle tabs! 🚀

## Troubleshooting

- **PERMISSION_DENIED**: Controleer of de security rules correct zijn ingesteld
- **Database URL niet gevonden**: Zorg dat je een Realtime Database hebt aangemaakt (niet Firestore)
- **Geen updates**: Controleer de browser console (F12) voor errors
