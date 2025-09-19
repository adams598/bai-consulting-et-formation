import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Settings, 
  Download, 
  Upload,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Users,
  Phone,
  Video,
  Clock,
  MapPin,
  Bell,
  Repeat,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { StatsCard } from '../components';
import Calendar, { CalendarEvent } from '../components/Calendar';
import { LearnerFormationAssignment } from '../types';
import { formationsApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

interface CalendarIntegration {
  id: string;
  type: 'GOOGLE' | 'OUTLOOK' | 'APPLE';
  name: string;
  email: string;
  isConnected: boolean;
  lastSync?: string;
  syncEnabled: boolean;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [formations, setFormations] = useState<LearnerFormationAssignment[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // États pour le formulaire d'événement
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'PERSONAL' as CalendarEvent['type'],
    location: '',
    attendees: '',
    isAllDay: false,
    formationId: '',
    reminders: [15], // 15 minutes avant
    isRecurring: false,
    recurrenceRule: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Données de test temporaires (en attendant la correction de l'API)
      const mockFormations: LearnerFormationAssignment[] = [
        {
          id: '1',
          formationId: 'form-1',
          formation: {
            id: 'form-1',
            title: 'Formation Crédit Immobilier',
            description: 'Apprenez les bases du crédit immobilier',
            category: 'BANQUE',
            level: 'DEBUTANT',
            duration: 120,
            isActive: true,
            createdAt: '2023-12-01',
            updatedAt: '2023-12-01'
          },
          assignedAt: '2023-12-01',
          dueDate: '2024-02-01',
          status: 'IN_PROGRESS',
          progress: 45
        }
      ];
      
      // Charger les formations pour la planification (avec fallback)
      try {
        const formationsResponse = await formationsApi.getMyFormations();
        setFormations(formationsResponse.data);
      } catch (error) {
        console.warn('Erreur API formations, utilisation des données de test:', error);
        setFormations(mockFormations);
      }
      
      // Simuler le chargement des événements du calendrier
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Formation Banque Digitale',
          description: 'Session de formation sur les outils numériques bancaires',
          startDate: new Date(2024, 1, 15, 9, 0),
          endDate: new Date(2024, 1, 15, 11, 0),
          type: 'FORMATION',
          location: 'Salle de formation A',
          formationId: 'formation-1',
          status: 'CONFIRMED',
          reminders: [15, 60],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Réunion équipe commerciale',
          description: 'Point mensuel sur les objectifs et résultats',
          startDate: new Date(2024, 1, 20, 14, 0),
          endDate: new Date(2024, 1, 20, 15, 30),
          type: 'MEETING',
          location: 'Visioconférence',
          attendees: ['manager@banque.fr', 'equipe@banque.fr'],
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Appel client - Prêt immobilier',
          description: 'Suivi dossier prêt immobilier famille Martin',
          startDate: new Date(2024, 1, 22, 10, 30),
          endDate: new Date(2024, 1, 22, 11, 0),
          type: 'CALL',
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setEvents(mockEvents);
      
      // Simuler les intégrations de calendrier
      const mockIntegrations: CalendarIntegration[] = [
        {
          id: '1',
          type: 'GOOGLE',
          name: 'Google Calendar',
          email: 'utilisateur@gmail.com',
          isConnected: false,
          syncEnabled: false
        },
        {
          id: '2',
          type: 'OUTLOOK',
          name: 'Outlook',
          email: 'utilisateur@outlook.com',
          isConnected: false,
          syncEnabled: false
        }
      ];
      
      setIntegrations(mockIntegrations);
      
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreate = async (eventData: Partial<CalendarEvent>) => {
    try {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventForm.title,
        description: eventForm.description,
        startDate: new Date(`${eventForm.startDate}T${eventForm.startTime}`),
        endDate: new Date(`${eventForm.endDate}T${eventForm.endTime}`),
        type: eventForm.type,
        location: eventForm.location,
        attendees: eventForm.attendees ? eventForm.attendees.split(',').map(a => a.trim()) : undefined,
        isAllDay: eventForm.isAllDay,
        formationId: eventForm.formationId || undefined,
        reminders: eventForm.reminders,
        isRecurring: eventForm.isRecurring,
        recurrenceRule: eventForm.recurrenceRule || undefined,
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEvents(prev => [...prev, newEvent]);
      setShowEventForm(false);
      resetEventForm();
      
      toast({
        title: "Événement créé",
        description: "L'événement a été ajouté à votre calendrier"
      });
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement",
        variant: "destructive"
      });
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    try {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      
      toast({
        title: "Événement modifié",
        description: "L'événement a été mis à jour"
      });
      
    } catch (error) {
      console.error('Erreur lors de la modification de l\'événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement",
        variant: "destructive"
      });
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      toast({
        title: "Événement supprimé",
        description: "L'événement a été retiré de votre calendrier"
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive"
      });
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm(prev => ({
      ...prev,
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00'
    }));
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      type: 'PERSONAL',
      location: '',
      attendees: '',
      isAllDay: false,
      formationId: '',
      reminders: [15],
      isRecurring: false,
      recurrenceRule: ''
    });
  };

  const handleConnectCalendar = async (integrationType: 'GOOGLE' | 'OUTLOOK') => {
    try {
      // Simuler la connexion au calendrier externe
      if (integrationType === 'GOOGLE') {
        // En réalité, cela ouvrirait le flow OAuth de Google
        window.open('https://accounts.google.com/oauth/authorize?...', '_blank');
      } else if (integrationType === 'OUTLOOK') {
        // En réalité, cela ouvrirait le flow OAuth de Microsoft
        window.open('https://login.microsoftonline.com/oauth2/v2.0/authorize?...', '_blank');
      }
      
      // Simuler la connexion réussie
      setIntegrations(prev => prev.map(integration => 
        integration.type === integrationType 
          ? { ...integration, isConnected: true, syncEnabled: true, lastSync: new Date().toISOString() }
          : integration
      ));
      
      toast({
        title: "Calendrier connecté",
        description: `Votre calendrier ${integrationType === 'GOOGLE' ? 'Google' : 'Outlook'} a été connecté avec succès`
      });
      
    } catch (error) {
      console.error('Erreur lors de la connexion du calendrier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter le calendrier externe",
        variant: "destructive"
      });
    }
  };

  const handleSyncCalendar = async (integrationId: string) => {
    try {
      // Simuler la synchronisation
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, lastSync: new Date().toISOString() }
          : integration
      ));
      
      toast({
        title: "Synchronisation réussie",
        description: "Votre calendrier a été synchronisé"
      });
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser le calendrier",
        variant: "destructive"
      });
    }
  };

  const planFormationSession = (formation: LearnerFormationAssignment) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setEventForm({
      title: `Formation: ${formation.formation.title}`,
      description: formation.formation.description,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      type: 'FORMATION',
      location: 'En ligne',
      attendees: '',
      isAllDay: false,
      formationId: formation.formation.id,
      reminders: [15, 60], // 15 min et 1h avant
      isRecurring: false,
      recurrenceRule: ''
    });
    
    setShowEventForm(true);
  };

  const getCalendarStats = () => {
    const today = new Date();
    const thisWeek = events.filter(event => {
      const eventDate = new Date(event.startDate);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
    
    const formationEvents = events.filter(event => event.type === 'FORMATION');
    const connectedCalendars = integrations.filter(integration => integration.isConnected).length;
    
    return {
      totalEvents: events.length,
      thisWeekEvents: thisWeek.length,
      formationSessions: formationEvents.length,
      connectedCalendars
    };
  };

  const stats = getCalendarStats();

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          {/* <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Agenda</h1>
            <p className="text-gray-600 mt-1">
              Planifiez vos formations et gérez votre emploi du temps
            </p>
          </div> */}
          

        </div>

        {/* Statistiques
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Événements totaux"
            value={stats.totalEvents}
            icon={CalendarIcon}
            color="blue"
          />
          <StatsCard
            title="Cette semaine"
            value={stats.thisWeekEvents}
            icon={Clock}
            color="green"
            subtitle="Événements programmés"
          />
          <StatsCard
            title="Sessions de formation"
            value={stats.formationSessions}
            icon={BookOpen}
            color="yellow"
            subtitle="Planifiées"
          />
            <StatsCard
              title="Calendriers connectés"
              value={stats.connectedCalendars}
              icon={RefreshCw}
              color="purple"
              subtitle={`${integrations.length} disponibles`}
            />
        </div> */}

        {/* Formations à planifier */}
        {formations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Formations à planifier
            </h3>
            <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowIntegrationModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Intégrations</span> 
            </button>
          </div>
          <br />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formations.slice(0, 3).map((formation) => (
                <div key={formation.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {formation.formation.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Durée: {Math.floor(formation.formation.duration / 60)}h{formation.formation.duration % 60 > 0 ? ` ${formation.formation.duration % 60}min` : ''}
                  </p>
                  <button
                    onClick={() => planFormationSession(formation)}
                    className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Planifier une session
                  </button>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Calendrier principal */}
        <Calendar
          events={events}
          view={view}
          onViewChange={setView}
          onEventClick={() => {}}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onDateClick={handleDateClick}
          allowEdit={true}
        />

        {/* Modal de création/édition d'événement */}
        {showEventForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Nouvel événement
                    </h3>
                    <button
                      onClick={() => {
                        setShowEventForm(false);
                        resetEventForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); handleEventCreate({}); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventForm.title}
                        onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Titre de l'événement"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Description de l'événement"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={eventForm.type}
                          onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="PERSONAL">Personnel</option>
                          <option value="FORMATION">Formation</option>
                          <option value="MEETING">Réunion</option>
                          <option value="CALL">Appel</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lieu
                        </label>
                        <input
                          type="text"
                          value={eventForm.location}
                          onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Lieu de l'événement"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de début *
                        </label>
                        <input
                          type="date"
                          required
                          value={eventForm.startDate}
                          onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heure de début
                        </label>
                        <input
                          type="time"
                          value={eventForm.startTime}
                          onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={eventForm.isAllDay}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de fin *
                        </label>
                        <input
                          type="date"
                          required
                          value={eventForm.endDate}
                          onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heure de fin
                        </label>
                        <input
                          type="time"
                          value={eventForm.endTime}
                          onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={eventForm.isAllDay}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eventForm.isAllDay}
                          onChange={(e) => setEventForm(prev => ({ ...prev, isAllDay: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Toute la journée</span>
                      </label>
                    </div>
                    
                    {eventForm.type === 'FORMATION' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formation liée
                        </label>
                        <select
                          value={eventForm.formationId}
                          onChange={(e) => setEventForm(prev => ({ ...prev, formationId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner une formation</option>
                          {formations.map((formation) => (
                            <option key={formation.id} value={formation.formation.id}>
                              {formation.formation.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEventForm(false);
                          resetEventForm();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Créer l'événement
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'intégration des calendriers */}
        {showIntegrationModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Intégrations de calendrier
                    </h3>
                    <button
                      onClick={() => setShowIntegrationModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              integration.isConnected ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div>
                              <h4 className="font-medium text-gray-900">{integration.name}</h4>
                              {integration.isConnected && (
                                <p className="text-sm text-gray-500">{integration.email}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {integration.isConnected ? (
                              <button
                                onClick={() => handleSyncCalendar(integration.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Synchroniser"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConnectCalendar(integration.type)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Connecter
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {integration.isConnected && integration.lastSync && (
                          <p className="text-xs text-gray-500">
                            Dernière synchronisation: {new Date(integration.lastSync).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">
                            Synchronisation bidirectionnelle
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Les événements créés dans votre espace apprenant seront automatiquement 
                            synchronisés avec vos calendriers externes connectés.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowIntegrationModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default CalendarPage;
