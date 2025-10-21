import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import calendarApi from '../../../api/calendarApi';
import { formationsApi as adminFormationsApi } from '../../../api/adminApi';
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
  const location = useLocation();
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

  // Charger les données au montage et quand on revient sur la page
  useEffect(() => {
    loadRealCalendarData();
    loadIntegrations();
  }, [location.pathname]); // Recharger quand l'URL change (navigation vers cette page)

  // Gérer la pré-sélection d'une formation depuis une autre page
  useEffect(() => {
    const preSelectedFormation = location.state?.selectedFormation;
    const action = location.state?.action;
    
    if (preSelectedFormation && action === 'schedule') {
      // Pré-remplir le formulaire avec les données de la formation
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setEventForm({
        title: `Formation: ${preSelectedFormation.title}`,
        description: preSelectedFormation.description || `Formation: ${preSelectedFormation.title}`,
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: new Date(new Date(`1970-01-01T09:00:00`).getTime() + (preSelectedFormation.duration || 60) * 60000)
          .toTimeString().substring(0, 5),
        type: 'FORMATION',
        location: 'En ligne',
        attendees: '',
        isAllDay: false,
        formationId: preSelectedFormation.id,
        reminders: [15, 60],
        isRecurring: false,
        recurrenceRule: ''
      });
      
      // Ouvrir automatiquement le formulaire d'événement
      setShowEventForm(true);
      
      // Nettoyer le state pour éviter de rouvrir le formulaire à chaque navigation
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state]);

  // Gérer les paramètres de retour OAuth
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const integrationStatus = params.get('integration');
    const integrationType = params.get('type');

    if (integrationStatus === 'success' && integrationType) {
      toast({
        title: "Connexion réussie",
        description: `Votre calendrier ${integrationType === 'google' ? 'Google' : 'Outlook'} a été connecté avec succès`,
      });
      loadIntegrations();
      // Nettoyer l'URL
      window.history.replaceState({}, '', location.pathname);
    } else if (integrationStatus === 'error' && integrationType) {
      toast({
        title: "Erreur de connexion",
        description: `Impossible de connecter votre calendrier ${integrationType === 'google' ? 'Google' : 'Outlook'}`,
        variant: "destructive"
      });
      // Nettoyer l'URL
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  const loadRealCalendarData = async () => {
    try {
      setLoading(true);
      
      // Charger les formations assignées (utilise la même API que AdminFormationsPage)
      const formationsResponse = await adminFormationsApi.getMyAssignedFormations();
      
      if (formationsResponse.data?.success && formationsResponse.data.data) {
        // Transformer les assignations pour compatibilité avec CalendarPage
        const transformedFormations = formationsResponse.data.data.map((assignment: any) => ({
          id: assignment.id,
          formationId: assignment.formation.id,
          formation: {
            id: assignment.formation.id,
            title: assignment.formation.title,
            description: assignment.formation.description,
            duration: assignment.formation.duration,
            isActive: assignment.formation.isActive,
            hasQuiz: assignment.formation.hasQuiz || false,
            quizRequired: assignment.formation.quizRequired || false,
            createdAt: assignment.formation.createdAt,
            updatedAt: assignment.formation.updatedAt
          },
          assignedAt: assignment.assignedAt,
          dueDate: assignment.dueDate,
          status: assignment.status as any,
          progress: assignment.progress || 0
        }));
        
        setFormations(transformedFormations);
      } else {
        setFormations([]);
      }
      
      // Charger les événements du calendrier depuis la base de données
      try {
        const eventsResponse = await calendarApi.getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          // Transformer les événements de BDD en événements de calendrier
          const calendarEvents: CalendarEvent[] = eventsResponse.data.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            type: event.type,
            location: event.location,
            attendees: event.attendees ? JSON.parse(event.attendees) : undefined,
            isAllDay: event.isAllDay,
            color: event.color,
            formationId: event.formationId,
            status: event.status,
            reminders: event.reminders ? JSON.parse(event.reminders) : [15, 60],
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt)
          }));
          
          setEvents(calendarEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.warn('Aucun événement trouvé, calendrier vide');
        setEvents([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await calendarApi.getIntegrations();
      if (response.success && response.data) {
        // Transformer les données pour correspondre à l'interface CalendarIntegration
        const transformedIntegrations: CalendarIntegration[] = response.data.map((integration: any) => ({
          id: integration.id,
          type: integration.type as 'GOOGLE' | 'OUTLOOK' | 'APPLE',
          name: integration.type === 'GOOGLE' ? 'Google Calendar' : 'Outlook',
          email: integration.email || '',
          isConnected: integration.isConnected,
          lastSync: integration.lastSync,
          syncEnabled: integration.syncEnabled,
        }));
        setIntegrations(transformedIntegrations);
      } else {
        // Créer des intégrations par défaut non connectées
        setIntegrations([
          {
            id: 'google-default',
            type: 'GOOGLE',
            name: 'Google Calendar',
            email: '',
            isConnected: false,
            syncEnabled: false
          },
          {
            id: 'outlook-default',
            type: 'OUTLOOK',
            name: 'Outlook',
            email: '',
            isConnected: false,
            syncEnabled: false
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des intégrations:', error);
      // Créer des intégrations par défaut en cas d'erreur
      setIntegrations([
        {
          id: 'google-default',
          type: 'GOOGLE',
          name: 'Google Calendar',
          email: '',
          isConnected: false,
          syncEnabled: false
        },
        {
          id: 'outlook-default',
          type: 'OUTLOOK',
          name: 'Outlook',
          email: '',
          isConnected: false,
          syncEnabled: false
        }
      ]);
    }
  };

  const loadCalendarData = async () => {
    // Utiliser la nouvelle fonction qui charge les vraies données
    await loadRealCalendarData();
  };

  const loadOldCalendarData = async () => {
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
            duration: 120,
            isActive: true,
            hasQuiz: false,
            quizRequired: false,
            createdAt: '2023-12-01',
            updatedAt: '2023-12-01'
          },
          assignedAt: '2023-12-01',
          dueDate: '2024-02-01',
          status: 'IN_PROGRESS' as any,
          progress: 45 as any
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
      // Préparer les données pour l'API
      const eventApiData = {
        title: eventForm.title,
        description: eventForm.description,
        startDate: new Date(`${eventForm.startDate}T${eventForm.startTime}`).toISOString(),
        endDate: new Date(`${eventForm.endDate}T${eventForm.endTime}`).toISOString(),
        type: eventForm.type,
        location: eventForm.location,
        attendees: eventForm.attendees ? eventForm.attendees.split(',').map(a => a.trim()) : undefined,
        isAllDay: eventForm.isAllDay,
        reminders: eventForm.reminders,
        formationId: eventForm.formationId || undefined,
        eventType: eventForm.formationId ? 'formation' : 'personal'
      };

      console.log('📅 Création événement depuis CalendarPage:', eventApiData);

      // Créer l'événement via l'API de calendrier
      const response = await calendarApi.createEvent(eventApiData);
      
      console.log('✅ Réponse création événement:', response);
      
      if (response.success && response.data) {
        // Recharger les événements depuis la BDD
        await loadRealCalendarData();
        
        setShowEventForm(false);
        resetEventForm();
        
        toast({
          title: "Événement créé",
          description: `L'événement "${eventForm.title}" a été ajouté à votre agenda`
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement",
        variant: "destructive"
      });
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    try {
      // Préparer les données pour l'API
      const updateData = {
        title: event.title,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        type: event.type,
        location: event.location,
        attendees: event.attendees,
        isAllDay: event.isAllDay,
        color: event.color,
        reminders: event.reminders
      };

      // Mettre à jour l'événement en base de données via l'API
      const response = await calendarApi.updateEvent(event.id, updateData);
      
      if (response.success && response.data) {
        // Mettre à jour l'état local seulement après succès de l'API
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
        
        toast({
          title: "Événement modifié",
          description: "L'événement a été mis à jour"
        });
      } else {
        throw new Error('Échec de la modification côté serveur');
      }
      
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
      // Supprimer l'événement en base de données via l'API
      const response = await calendarApi.deleteEvent(eventId);
      
      if (response.success) {
        // Supprimer de l'état local seulement après succès de l'API
        setEvents(prev => prev.filter(e => e.id !== eventId));
        
        toast({
          title: "Événement supprimé",
          description: "L'événement a été retiré de votre calendrier"
        });
      } else {
        throw new Error('Échec de la suppression côté serveur');
      }
      
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
    
    // Si une formation est pré-sélectionnée depuis la navigation, pré-remplir le formulaire
    const preSelectedFormation = location.state?.selectedFormation;
    
    setEventForm(prev => ({
      ...prev,
      title: preSelectedFormation ? `Formation: ${preSelectedFormation.title}` : '',
      description: preSelectedFormation ? preSelectedFormation.description : '',
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: preSelectedFormation ? 
        // Calculer l'heure de fin basée sur la durée de la formation
        new Date(new Date(`1970-01-01T09:00:00`).getTime() + (preSelectedFormation.duration || 60) * 60000)
          .toTimeString().substring(0, 5) : '10:00',
      type: preSelectedFormation ? 'FORMATION' : 'PERSONAL',
      formationId: preSelectedFormation?.id
    }));
    
    // Ouvrir automatiquement le formulaire d'événement
    setShowEventForm(true);
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

  const handleConnectCalendar = async (integrationType: 'GOOGLE' | 'OUTLOOK' | 'APPLE') => {
    try {
      let response;
      
      if (integrationType === 'GOOGLE') {
        response = await calendarApi.initiateGoogleOAuth();
      } else if (integrationType === 'OUTLOOK') {
        response = await calendarApi.initiateOutlookOAuth();
      } else {
        toast({
          title: "Non disponible",
          description: "L'intégration Apple Calendar n'est pas encore disponible",
          variant: "destructive"
        });
        return;
      }

      if (response.success && response.authUrl) {
        // Rediriger vers la page d'authentification OAuth
        window.location.href = response.authUrl;
      } else {
        throw new Error('URL OAuth non disponible');
      }
      
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
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Intégration non trouvée');
      }

      let response;
      if (integration.type === 'GOOGLE') {
        response = await calendarApi.syncGoogleCalendar();
      } else if (integration.type === 'OUTLOOK') {
        response = await calendarApi.syncOutlookCalendar();
      } else {
        throw new Error('Type d\'intégration non supporté');
      }

      if (response.success) {
        // Recharger les événements et les intégrations
        await Promise.all([loadRealCalendarData(), loadIntegrations()]);
        
        toast({
          title: "Synchronisation réussie",
          description: response.message || "Votre calendrier a été synchronisé"
        });
      } else {
        throw new Error(response.message || 'Échec de la synchronisation');
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de synchroniser le calendrier",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectCalendar = async (integrationId: string) => {
    try {
      const response = await calendarApi.disconnectIntegration(integrationId);
      
      if (response.success) {
        await loadIntegrations();
        toast({
          title: "Déconnexion réussie",
          description: "Le calendrier a été déconnecté"
        });
      } else {
        throw new Error(response.message || 'Échec de la déconnexion');
      }
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de déconnecter le calendrier",
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

  // Filtrer les formations qui ne sont pas encore planifiées
  const getUnplannedFormations = () => {
    // Récupérer les IDs des formations déjà planifiées
    const plannedFormationIds = new Set(
      events
        .filter(event => event.type === 'FORMATION' && event.formationId)
        .map(event => event.formationId)
    );
    
    // Retourner seulement les formations non planifiées
    return formations.filter(formation => 
      !plannedFormationIds.has(formation.formation.id)
    );
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
        {(() => {
          const unplannedFormations = getUnplannedFormations();
          return unplannedFormations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Formations à planifier ({unplannedFormations.length})
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
                {unplannedFormations.slice(0, 3).map((formation) => (
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
          );
        })()}

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
                  
                  <div className="space-y-6">
                    {/* Boutons de connexion avec icônes */}
                    <div className="flex justify-center space-x-4">
                      {/* Bouton Google Calendar */}
                      <button
                        onClick={() => handleConnectCalendar('GOOGLE')}
                        className="flex items-center justify-center w-16 h-16 bg-white border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200 group"
                        title="Connecter Google Calendar"
                      >
                        <svg className="w-8 h-8 text-red-500 group-hover:text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </button>

                      {/* Bouton Outlook */}
                      <button
                        onClick={() => handleConnectCalendar('OUTLOOK')}
                        className="flex items-center justify-center w-16 h-16 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                        title="Connecter Outlook"
                      >
                        <svg className="w-8 h-8 text-blue-500 group-hover:text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Liste des intégrations existantes */}
                    {integrations.filter(integration => integration.isConnected).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Calendriers connectés</h4>
                        {integrations.filter(integration => integration.isConnected).map((integration) => (
                          <div key={integration.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{integration.name}</h4>
                                  {integration.email && (
                                    <p className="text-sm text-gray-500">{integration.email}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSyncCalendar(integration.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Synchroniser"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDisconnectCalendar(integration.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Déconnecter"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {integration.lastSync && (
                              <p className="text-xs text-gray-500 mt-2">
                                Dernière synchronisation: {new Date(integration.lastSync).toLocaleString('fr-FR')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
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
