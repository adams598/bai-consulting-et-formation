# 💻 Exemples de code - Intégration calendrier

## Frontend - React

### Utiliser le hook useCalendarIntegration

```typescript
import { useCalendarIntegration } from '../hooks/useCalendarIntegration';

function MyCalendarComponent() {
  const {
    integrations,
    loading,
    error,
    success,
    connectGoogle,
    connectOutlook,
    disconnect,
    syncGoogle,
    isConnected,
    clearMessages
  } = useCalendarIntegration({
    autoLoad: true,
    refreshInterval: 5 * 60 * 1000 // Refresh toutes les 5 min
  });

  const handleGoogleConnect = async () => {
    try {
      await connectGoogle();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {isConnected('GOOGLE') ? (
        <button onClick={() => disconnect(integrations.find(i => i.type === 'GOOGLE')?.id)}>
          Déconnecter Google
        </button>
      ) : (
        <button onClick={handleGoogleConnect} disabled={loading}>
          Connecter Google
        </button>
      )}

      {isConnected('GOOGLE') && (
        <button onClick={syncGoogle} disabled={loading}>
          Synchroniser
        </button>
      )}
    </div>
  );
}
```

### Composant d'affichage des intégrations

```typescript
import GoogleIntegration from '../components/GoogleIntegration';
import OutlookIntegration from '../components/OutlookIntegration';

function CalendarPage() {
  const handleIntegrationChange = (integrations: CalendarIntegration[]) => {
    console.log('Intégrations mises à jour:', integrations);
    // Mettre à jour le state local ou faire un appel API
  };

  return (
    <div className="calendar-page">
      <h1>Calendriers connectés</h1>
      
      <section>
        <h2>Google Calendar</h2>
        <GoogleIntegration onIntegrationChange={handleIntegrationChange} />
      </section>

      <section>
        <h2>Outlook Calendar</h2>
        <OutlookIntegration onIntegrationChange={handleIntegrationChange} />
      </section>
    </div>
  );
}
```

### Créer un événement avec CalendarService

```typescript
import { CalendarService } from '../services/calendarService';

async function createFormationEvent(formationId: string) {
  try {
    const event = await CalendarService.createEvent({
      title: 'Formation: React Avancé',
      description: 'Formation complète sur React',
      startDate: '2024-02-20T09:00:00Z',
      endDate: '2024-02-20T12:00:00Z',
      type: 'FORMATION',
      formationId: formationId,
      location: 'Salle 101',
      attendees: ['participant1@example.com', 'participant2@example.com'],
      reminders: [15, 60], // Rappels à 15 et 60 minutes avant
      isRecurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10'
    });

    console.log('Événement créé:', event.id);
    return event;
  } catch (error) {
    console.error('Erreur création événement:', error);
    throw error;
  }
}
```

### Synchroniser les événements

```typescript
import { CalendarService } from '../services/calendarService';

async function syncAllCalendars() {
  try {
    console.log('Synchronisation en cours...');

    // Obtenir les intégrations
    const integrations = await CalendarService.getIntegrations();

    // Synchroniser Google
    const googleIntegration = integrations.find(i => i.type === 'GOOGLE');
    if (googleIntegration?.isConnected) {
      const googleResult = await CalendarService.syncGoogleCalendar();
      console.log(`Google: ${googleResult.imported} événements synchronisés`);
    }

    // Synchroniser Outlook
    const outlookIntegration = integrations.find(i => i.type === 'OUTLOOK');
    if (outlookIntegration?.isConnected) {
      const outlookResult = await CalendarService.syncOutlookCalendar();
      console.log(`Outlook: ${outlookResult.imported} événements synchronisés`);
    }

    console.log('Synchronisation terminée');
  } catch (error) {
    console.error('Erreur synchronisation:', error);
    throw error;
  }
}
```

---

## Backend - Express.js

### Route OAuth pour Google

```javascript
// backend/src/routes/calendarIntegration.js

import express from 'express';
import { google } from 'googleapis';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Obtenir l'URL d'autorisation Google
router.get('/google/auth-url', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.id,
      prompt: 'consent'
    });

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Erreur auth URL Google:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de l\'URL'
    });
  }
});

export default router;
```

### Callback OAuth Google

```javascript
// Traiter le callback OAuth Google

router.post('/google/callback', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code manquant'
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Échanger le code contre les tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Décoder le token pour obtenir les infos utilisateur
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token
    });

    const { email, name } = ticket.getPayload();

    // Sauvegarder en BDD
    const integration = await prisma.calendarIntegration.upsert({
      where: { userId_type: { userId, type: 'GOOGLE' } },
      create: {
        userId,
        type: 'GOOGLE',
        isConnected: true,
        syncEnabled: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(tokens.expiry_date),
        email,
        name
      },
      update: {
        isConnected: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiresAt: new Date(tokens.expiry_date),
        email,
        name
      }
    });

    res.json({
      success: true,
      data: integration,
      message: 'Connexion Google réussie'
    });
  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion Google'
    });
  }
});
```

### Service de synchronisation Google

```javascript
// backend/src/services/googleCalendarService.js

import { google } from 'googleapis';

export class GoogleCalendarService {
  static async getCalendarEvents(accessToken, startDate, endDate) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return events.data.items || [];
  }

  static async createEvent(accessToken, eventData) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDate,
          timeZone: 'Europe/Paris'
        },
        end: {
          dateTime: eventData.endDate,
          timeZone: 'Europe/Paris'
        },
        attendees: eventData.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: (eventData.reminders || []).map(minutes => ({
            method: 'notification',
            minutes
          }))
        },
        recurrence: eventData.recurrenceRule ? [eventData.recurrenceRule] : undefined
      }
    });

    return event.data;
  }

  static async updateEvent(accessToken, eventId, eventData) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.startDate },
        end: { dateTime: eventData.endDate }
      }
    });

    return event.data;
  }

  static async deleteEvent(accessToken, eventId) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });
  }

  static async refreshToken(refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }
}
```

### Synchroniser les événements

```javascript
// backend/src/routes/calendarIntegration.js

router.post('/sync/google', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtenir l'intégration
    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId_type: { userId, type: 'GOOGLE' } }
    });

    if (!integration?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar non connecté'
      });
    }

    // Rafraîchir le token si expiré
    if (integration.tokenExpiresAt <= new Date()) {
      const newTokens = await GoogleCalendarService.refreshToken(integration.refreshToken);
      
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: newTokens.access_token,
          tokenExpiresAt: new Date(newTokens.expiry_date)
        }
      });

      integration.accessToken = newTokens.access_token;
    }

    // Récupérer les événements Google
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90); // 90 jours à l'avance
    endDate.setHours(23, 59, 59, 999);

    const googleEvents = await GoogleCalendarService.getCalendarEvents(
      integration.accessToken,
      startDate,
      endDate
    );

    // Importer les événements
    let imported = 0;

    for (const googleEvent of googleEvents) {
      const existingEvent = await prisma.calendarEvent.findUnique({
        where: {
          userId_externalId: {
            userId,
            externalId: googleEvent.id
          }
        }
      });

      if (!existingEvent) {
        await prisma.calendarEvent.create({
          data: {
            userId,
            title: googleEvent.summary,
            description: googleEvent.description,
            startDate: new Date(googleEvent.start.dateTime || googleEvent.start.date),
            endDate: new Date(googleEvent.end.dateTime || googleEvent.end.date),
            externalId: googleEvent.id,
            externalSource: 'GOOGLE',
            isAllDay: !googleEvent.start.dateTime,
            attendees: googleEvent.attendees?.map(a => a.email).join(','),
            type: 'IMPORTED'
          }
        });
        imported++;
      }
    }

    // Mettre à jour lastSync
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() }
    });

    res.json({
      success: true,
      data: {
        imported,
        total: googleEvents.length
      }
    });
  } catch (error) {
    console.error('Erreur sync Google:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation'
    });
  }
});
```

---

## Prisma - Schéma

### CalendarIntegration

```prisma
model CalendarIntegration {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type           String    // "GOOGLE" ou "OUTLOOK"
  isConnected    Boolean   @default(false)
  syncEnabled    Boolean   @default(true)
  importEnabled  Boolean   @default(false)
  exportEnabled  Boolean   @default(false)
  accessToken    String?
  refreshToken   String?
  tokenExpiresAt DateTime?
  email          String?
  name           String?
  lastSync       DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId, type])
  @@map("calendar_integrations")
}
```

### CalendarEvent

```prisma
model CalendarEvent {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime
  type            String   @default("PERSONAL")
  location        String?
  attendees       String?
  isAllDay        Boolean  @default(false)
  color           String?
  status          String   @default("CONFIRMED")
  reminders       String?
  formationId     String?
  formation       Formation? @relation(fields: [formationId], references: [id], onDelete: Cascade)
  lessonId        String?
  eventType       String?
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?
  externalId      String?
  externalSource  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, externalId])
  @@index([userId, startDate])
  @@map("calendar_events")
}
```

---

## Tests - Jest

### Test du service

```typescript
// __tests__/calendarService.test.ts

describe('CalendarService', () => {
  it('should sync Google Calendar', async () => {
    const result = await CalendarService.syncGoogleCalendar();
    
    expect(result).toHaveProperty('imported');
    expect(result.imported).toBeGreaterThanOrEqual(0);
  });

  it('should create event', async () => {
    const event = await CalendarService.createEvent({
      title: 'Test Event',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString()
    });

    expect(event.id).toBeDefined();
    expect(event.title).toBe('Test Event');
  });
});
```

---

Ces exemples couvrent les cas d'usage les plus courants.
Pour plus de détails, consultez la documentation complète!

