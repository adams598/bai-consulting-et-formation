import { api } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const calendarApi = {
  // Récupérer tous les événements de l'utilisateur
  getEvents: async () => {
    const response = await api.get('/api/calendar/events');
    return response.data;
  },

  // Créer un nouvel événement
  createEvent: async (eventData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type?: string;
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
  }) => {
    const response = await api.post('/api/calendar/events', eventData);
    return response.data;
  },

  // Mettre à jour un événement
  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/api/calendar/events/${id}`, eventData);
    return response.data;
  },

  // Supprimer un événement
  deleteEvent: async (id: string) => {
    const response = await api.delete(`/api/calendar/events/${id}`);
    return response.data;
  },

  // Récupérer les événements dans une plage de dates
  getEventsByDateRange: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/calendar/events/range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Récupérer les prochaines échéances
  getUpcomingDeadlines: async () => {
    const response = await api.get('/api/calendar/upcoming');
    return response.data;
  },
};

export default calendarApi;
