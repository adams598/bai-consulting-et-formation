# 🧪 Guide de test - Intégration calendrier

## Tests unitaires

### Test du service CalendarService

```typescript
// frontend/src/services/__tests__/calendarService.test.ts

import { CalendarService } from '../calendarService';
import { api } from '../../config/api';

jest.mock('../../config/api');

describe('CalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIntegrations', () => {
    it('should fetch all integrations', async () => {
      const mockData = [
        { id: '1', type: 'GOOGLE', isConnected: true },
        { id: '2', type: 'OUTLOOK', isConnected: false }
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { data: mockData }
      });

      const result = await CalendarService.getIntegrations();

      expect(api.get).toHaveBeenCalledWith('/calendar/integrations');
      expect(result).toEqual(mockData);
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(CalendarService.getIntegrations()).rejects.toThrow('Network error');
    });
  });

  describe('getGoogleAuthUrl', () => {
    it('should return valid auth URL', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';

      (api.get as jest.Mock).mockResolvedValue({
        data: { data: { authUrl: mockUrl } }
      });

      const result = await CalendarService.getGoogleAuthUrl();

      expect(result.authUrl).toBe(mockUrl);
    });
  });

  describe('disconnectIntegration', () => {
    it('should disconnect integration by ID', async () => {
      const integrationId = '123';

      await CalendarService.disconnectIntegration(integrationId);

      expect(api.delete).toHaveBeenCalledWith(`/calendar/integrations/${integrationId}`);
    });
  });
});
```

### Test du hook useCalendarIntegration

```typescript
// frontend/src/hooks/__tests__/useCalendarIntegration.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarIntegration } from '../useCalendarIntegration';
import * as CalendarService from '../../services/calendarService';

jest.mock('../../services/calendarService');

describe('useCalendarIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load integrations on mount', async () => {
    const mockIntegrations = [
      { id: '1', type: 'GOOGLE', isConnected: true }
    ];

    (CalendarService.getIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);

    const { result } = renderHook(() => useCalendarIntegration({ autoLoad: true }));

    await waitFor(() => {
      expect(result.current.integrations).toEqual(mockIntegrations);
    });
  });

  it('should handle connection error', async () => {
    const error = new Error('Connection failed');
    (CalendarService.getGoogleAuthUrl as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useCalendarIntegration());

    await act(async () => {
      try {
        await result.current.connectGoogle();
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Connection failed');
  });

  it('should check connection status', async () => {
    const mockIntegrations = [
      { id: '1', type: 'GOOGLE', isConnected: true }
    ];

    (CalendarService.getIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);

    const { result } = renderHook(() => useCalendarIntegration({ autoLoad: true }));

    await waitFor(() => {
      expect(result.current.isConnected('GOOGLE')).toBe(true);
      expect(result.current.isConnected('OUTLOOK')).toBe(false);
    });
  });
});
```

---

## Tests d'intégration

### Test du flux OAuth complet

```typescript
// Test: Connexion Google → Synchronisation → Déconnexion

describe('Google Calendar OAuth Flow', () => {
  let browser: any;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete full OAuth flow', async () => {
    const page = await browser.newPage();

    // 1. Naviguer vers la page calendrier
    await page.goto('http://localhost:3001/learner/calendar');

    // 2. Cliquer sur "Connecter Google"
    const googleBtn = await page.$('button:contains("Se connecter avec Google")');
    const popup = await new Promise((resolve) => {
      page.once('popup', resolve);
      googleBtn.click();
    });

    // 3. Remplir le formulaire Google (dans la popup)
    await popup.type('input[type="email"]', 'test@gmail.com');
    await popup.click('button:contains("Suivant")');
    await popup.type('input[type="password"]', 'password');
    await popup.click('button:contains("Suivant")');

    // 4. Accepter les permissions
    await popup.click('button:contains("Permettre")');

    // 5. Attendre la redirection et fermeture
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 6. Vérifier que "Connecté" s'affiche
    const status = await page.$('.calendar-status');
    const text = await status.evaluate(el => el.textContent);
    expect(text).toContain('Connecté');

    // 7. Cliquer sur "Synchroniser"
    const syncBtn = await page.$('button:contains("Synchroniser")');
    await syncBtn.click();

    // 8. Attendre le message de succès
    await page.waitForSelector('.success-message');

    page.close();
  });

  it('should handle OAuth error gracefully', async () => {
    const page = await browser.newPage();

    // Intercept les appels API
    await page.on('response', (response: any) => {
      if (response.url().includes('/api/calendar/oauth/google/auth-url')) {
        // Simuler une erreur
        return Promise.reject(new Error('Server error'));
      }
    });

    await page.goto('http://localhost:3001/learner/calendar');

    const googleBtn = await page.$('button:contains("Se connecter avec Google")');
    await googleBtn.click();

    // Vérifier que le message d'erreur s'affiche
    await page.waitForSelector('.error-message');

    page.close();
  });
});
```

---

## Tests de performance

### Temps de synchronisation

```typescript
// Test: Mesurer le temps de synchro pour différentes tailles d'événements

describe('Synchronization Performance', () => {
  it('should sync 50 events in less than 5 seconds', async () => {
    const startTime = Date.now();

    // Créer 50 événements test
    const events = Array.from({ length: 50 }, (_, i) => ({
      title: `Event ${i}`,
      startDate: new Date(2024, 0, i + 1).toISOString(),
      endDate: new Date(2024, 0, i + 1, 1).toISOString(),
    }));

    // Uploader sur Google
    for (const event of events) {
      await googleCalendarAPI.insertEvent(event);
    }

    // Synchroniser
    const result = await CalendarService.syncGoogleCalendar();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    expect(result.imported).toBe(50);
    expect(duration).toBeLessThan(5);
  });

  it('should handle large descriptions (> 1000 chars)', async () => {
    const largeDescription = 'A'.repeat(5000);
    
    const event = {
      title: 'Large Event',
      description: largeDescription,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
    };

    const result = await CalendarService.createEvent(event);

    expect(result.description).toBe(largeDescription);
  });
});
```

---

## Tests de sécurité

### Authentification et autorisation

```typescript
describe('Calendar Security', () => {
  it('should reject requests without JWT token', async () => {
    const response = await fetch(
      'http://localhost:3000/api/calendar/integrations',
      { headers: {} }
    );

    expect(response.status).toBe(401);
    expect(response.statusText).toBe('Unauthorized');
  });

  it('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { userId: '123' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Déjà expiré
    );

    const response = await fetch(
      'http://localhost:3000/api/calendar/integrations',
      { headers: { Authorization: `Bearer ${expiredToken}` } }
    );

    expect(response.status).toBe(401);
  });

  it('should not expose other users integrations', async () => {
    const token1 = jwt.sign(
      { userId: 'user1' },
      process.env.JWT_SECRET
    );

    const response = await fetch(
      'http://localhost:3000/api/calendar/integrations',
      { headers: { Authorization: `Bearer ${token1}` } }
    );

    const data = await response.json();

    // Vérifier que seules les intégrations de user1 sont retournées
    data.forEach((integration: any) => {
      expect(integration.userId).toBe('user1');
    });
  });

  it('should validate OAuth state parameter', async () => {
    // Tenter un CSRF attack
    const response = await fetch(
      'http://localhost:3000/api/calendar/google/callback?code=AUTH_CODE&state=WRONG_USER_ID'
    );

    expect(response.status).toBe(400);
  });
});
```

### Gestion des tokens sensibles

```typescript
describe('Token Security', () => {
  it('should not expose tokens in logs', () => {
    const token = 'secret_token_12345';
    const integration = {
      id: '1',
      accessToken: token,
      refreshToken: 'refresh_token_67890'
    };

    const logOutput = JSON.stringify(integration);

    // Vérifier que les logs ne contiennent pas les tokens complets
    expect(logOutput).not.toContain('secret_token_12345');
  });

  it('should encrypt tokens in database', async () => {
    const plainToken = 'secret_token';

    // Sauvegarder
    await CalendarService.saveIntegration({
      accessToken: plainToken
    });

    // Récupérer directement de la BDD
    const raw = await db.query(
      'SELECT access_token FROM calendar_integrations WHERE id = ?',
      ['1']
    );

    // Le token en BDD devrait être crypté
    expect(raw[0].access_token).not.toBe(plainToken);
  });
});
```

---

## Tests d'erreur

### Gestion des erreurs réseau

```typescript
describe('Network Error Handling', () => {
  it('should retry on temporary failure', async () => {
    let attempts = 0;

    jest.spyOn(googleAPI, 'get').mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network timeout'));
      }
      return Promise.resolve({ events: [] });
    });

    const result = await CalendarService.syncGoogleCalendar();

    expect(attempts).toBe(3);
    expect(result.imported).toBe(0);
  });

  it('should timeout after max retries', async () => {
    jest.spyOn(googleAPI, 'get').mockRejectedValue(
      new Error('Network timeout')
    );

    await expect(
      CalendarService.syncGoogleCalendar()
    ).rejects.toThrow('Max retries exceeded');
  });

  it('should handle API rate limiting (429)', async () => {
    const response = {
      status: 429,
      headers: { 'retry-after': '60' }
    };

    jest.spyOn(googleAPI, 'get').mockRejectedValue(response);

    const result = await CalendarService.syncGoogleCalendar();

    expect(result.error).toContain('Rate limited');
    expect(result.retryAfter).toBe(60);
  });
});
```

---

## Tests de validation

### Validation des données entrantes

```typescript
describe('Data Validation', () => {
  it('should reject invalid email in attendees', async () => {
    const event = {
      title: 'Event',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      attendees: ['invalid-email', 'valid@test.com']
    };

    await expect(
      CalendarService.createEvent(event)
    ).rejects.toThrow('Invalid email');
  });

  it('should reject end date before start date', async () => {
    const event = {
      title: 'Event',
      startDate: new Date(2024, 0, 2).toISOString(),
      endDate: new Date(2024, 0, 1).toISOString()
    };

    await expect(
      CalendarService.createEvent(event)
    ).rejects.toThrow('End date must be after start date');
  });

  it('should reject too long title (> 255 chars)', async () => {
    const event = {
      title: 'A'.repeat(256),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString()
    };

    await expect(
      CalendarService.createEvent(event)
    ).rejects.toThrow('Title too long');
  });

  it('should validate recurrence rules (RFC 5545)', async () => {
    const event = {
      title: 'Event',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      isRecurring: true,
      recurrenceRule: 'INVALID RRULE'
    };

    await expect(
      CalendarService.createEvent(event)
    ).rejects.toThrow('Invalid recurrence rule');
  });
});
```

---

## Suite de test complète

### Exécuter tous les tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests de performance
npm run test:performance

# Tests de sécurité
npm run test:security

# Tous les tests avec coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## Tests manuels (Checklist)

- [ ] Google: Connexion réussit
- [ ] Google: Synchronisation fonctionne
- [ ] Google: Événements importés correctement
- [ ] Outlook: Connexion réussit
- [ ] Outlook: Synchronisation fonctionne
- [ ] Outlook: Événements importés correctement
- [ ] Déconnexion nettoie correctement les tokens
- [ ] Pas de token exposé dans les logs
- [ ] Erreurs réseau gérées gracieusement
- [ ] Refresh token fonctionne
- [ ] Récurrence des événements respectée
- [ ] Attendees synchronisés correctement
- [ ] Fuseaux horaires gérés correctement
- [ ] Événements supprimés externement supprimés localement
- [ ] Performance: < 5s pour 50 événements

