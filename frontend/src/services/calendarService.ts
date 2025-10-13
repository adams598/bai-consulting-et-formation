import { api } from '../config/api';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'PERSONAL' | 'FORMATION' | 'MEETING' | 'CALL' | 'EXTERNAL' | 'IMPORTED';
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  color?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  reminders?: number[];
  formationId?: string;
  lessonId?: string;
  eventType?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  externalId?: string;
  externalSource?: 'GOOGLE' | 'OUTLOOK';
  createdAt: string;
  updatedAt: string;
  formation?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    coverImage?: string;
  };
}

export interface CalendarIntegration {
  id: string;
  userId: string;
  type: 'GOOGLE' | 'OUTLOOK';
  email?: string;
  name?: string;
  isConnected: boolean;
  syncEnabled: boolean;
  importEnabled: boolean;
  exportEnabled: boolean;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type?: 'PERSONAL' | 'FORMATION' | 'MEETING' | 'CALL' | 'EXTERNAL';
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  color?: string;
  reminders?: number[];
  formationId?: string;
  lessonId?: string;
  eventType?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  type?: 'PERSONAL' | 'FORMATION' | 'MEETING' | 'CALL' | 'EXTERNAL';
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  color?: string;
  reminders?: number[];
  status?: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
}

export interface IntegrationSettings {
  syncEnabled: boolean;
  importEnabled: boolean;
  exportEnabled: boolean;
}

export class CalendarService {
  // Obtenir les événements du calendrier
  static async getEvents(startDate?: string, endDate?: string, type?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);

    const response = await api.get(`/calendar/events?${params.toString()}`);
    return response.data.data;
  }

  // Créer un nouvel événement
  static async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    const response = await api.post('/calendar/events', eventData);
    return response.data.data;
  }

  // Mettre à jour un événement
  static async updateEvent(eventId: string, eventData: UpdateEventData): Promise<CalendarEvent> {
    const response = await api.put(`/calendar/events/${eventId}`, eventData);
    return response.data.data;
  }

  // Supprimer un événement
  static async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/calendar/events/${eventId}`);
  }

  // Obtenir les intégrations calendrier
  static async getIntegrations(): Promise<CalendarIntegration[]> {
    const response = await api.get('/calendar/integrations');
    return response.data.data;
  }

  // Obtenir l'URL d'autorisation Google
  static async getGoogleAuthUrl(): Promise<{ authUrl: string }> {
    const response = await api.get('/calendar/google/auth-url');
    return response.data.data;
  }

  // Obtenir l'URL d'autorisation Outlook
  static async getOutlookAuthUrl(): Promise<{ authUrl: string }> {
    const response = await api.get('/calendar/outlook/auth-url');
    return response.data.data;
  }

  // Callback Google OAuth
  static async googleCallback(code: string): Promise<CalendarIntegration> {
    const response = await api.post('/calendar/google/callback', { code });
    return response.data.data;
  }

  // Callback Outlook OAuth
  static async outlookCallback(code: string): Promise<CalendarIntegration> {
    const response = await api.post('/calendar/outlook/callback', { code });
    return response.data.data;
  }

  // Mettre à jour les paramètres d'intégration
  static async updateIntegrationSettings(
    type: 'GOOGLE' | 'OUTLOOK',
    settings: IntegrationSettings
  ): Promise<CalendarIntegration> {
    const response = await api.put(`/calendar/integrations/${type.toLowerCase()}/settings`, settings);
    return response.data.data;
  }

  // Déconnecter une intégration
  static async disconnectIntegration(type: 'GOOGLE' | 'OUTLOOK'): Promise<void> {
    await api.delete(`/calendar/integrations/${type.toLowerCase()}`);
  }

  // Importer les événements depuis Google Calendar
  static async importFromGoogle(): Promise<{ imported: number; total: number }> {
    const response = await api.post('/calendar/google/import');
    return response.data.data;
  }

  // Importer les événements depuis Outlook
  static async importFromOutlook(): Promise<{ imported: number; total: number }> {
    const response = await api.post('/calendar/outlook/import');
    return response.data.data;
  }

  // Exporter une formation vers Google Calendar
  static async exportToGoogle(formationId: string): Promise<any> {
    const response = await api.post('/calendar/google/export-formation', { formationId });
    return response.data.data;
  }

  // Exporter une formation vers Outlook
  static async exportToOutlook(formationId: string): Promise<any> {
    const response = await api.post('/calendar/outlook/export-formation', { formationId });
    return response.data.data;
  }

  // Synchroniser les formations avec le calendrier
  static async syncFormations(formationId: string): Promise<{
    event: CalendarEvent;
    exports: Array<{ type: string; success: boolean; error?: string }>;
  }> {
    const response = await api.post('/calendar/sync-formations', { formationId });
    return response.data.data;
  }

  // Obtenir les événements par plage de dates
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });
    const response = await api.get(`/calendar/events/range?${params.toString()}`);
    return response.data.data;
  }

  // Obtenir les prochaines échéances
  static async getUpcomingDeadlines(): Promise<CalendarEvent[]> {
    const response = await api.get('/calendar/upcoming');
    return response.data.data;
  }
}

export default CalendarService;
