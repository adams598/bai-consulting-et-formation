import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { CalendarService, CalendarEvent, CalendarIntegration } from '../services/calendarService';
// Fonctions utilitaires pour les dates (remplacent date-fns)
const formatDate = (date: Date, formatStr: string) => {
  if (formatStr === 'MMMM yyyy') {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } else if (formatStr === 'd') {
    return date.getDate().toString();
  } else if (formatStr === 'HH:mm') {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR');
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
const subMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() - months, date.getDate());

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameMonth = (date1: Date, date2: Date) => 
  date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();

const isSameDay = (date1: Date, date2: Date) =>
  date1.getFullYear() === date2.getFullYear() && 
  date1.getMonth() === date2.getMonth() && 
  date1.getDate() === date2.getDate();

interface CalendarWidgetProps {
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  showIntegrationStatus?: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  className = '', 
  onEventClick,
  onDateClick,
  showIntegrationStatus = true 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    loadEvents();
    if (showIntegrationStatus) {
      loadIntegrations();
    }
  }, [currentDate, showIntegrationStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentDate).toISOString();
      const endDate = endOfMonth(currentDate).toISOString();
      const data = await CalendarService.getEventsByDateRange(startDate, endDate);
      setEvents(data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const data = await CalendarService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des intégrations:', error);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'FORMATION': 'bg-blue-100 text-blue-800 border-blue-200',
      'MEETING': 'bg-green-100 text-green-800 border-green-200',
      'CALL': 'bg-purple-100 text-purple-800 border-purple-200',
      'PERSONAL': 'bg-gray-100 text-gray-800 border-gray-200',
      'EXTERNAL': 'bg-orange-100 text-orange-800 border-orange-200',
      'IMPORTED': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || colors.PERSONAL;
  };

  const handleImportFromOutlook = async () => {
    try {
      setLoading(true);
      await CalendarService.importFromOutlook();
      await loadEvents();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setError('Erreur lors de l\'import des événements');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start, 'HH:mm')} - ${formatDate(end, 'HH:mm')}`;
    }
    
    const startFormatted = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')} ${formatDate(start, 'HH:mm')}`;
    const endFormatted = `${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')} ${formatDate(end, 'HH:mm')}`;
    return `${startFormatted} - ${endFormatted}`;
  };

  const outlookIntegration = integrations.find(i => i.type === 'OUTLOOK' && i.isConnected);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate, 'MMMM yyyy')}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {outlookIntegration && showIntegrationStatus && (
            <div className="flex items-center space-x-2 mr-4">
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Outlook connecté</span>
              </div>
              <button
                onClick={handleImportFromOutlook}
                disabled={loading}
                className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                title="Importer les événements Outlook"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
          
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-gray-600">Formation</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Réunion</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></div>
            <span className="text-gray-600">Importé</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Personnel</span>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="p-4">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border border-gray-200 rounded-lg p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {formatDate(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm border ${getEventTypeColor(event.type)}`}
                      title={`${event.title} - ${formatEventTime(event.startDate, event.endDate)}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {formatDate(new Date(event.startDate), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayEvents.length - 2} autres
                    </div>
                  )}
                </div>

                {onDateClick && (
                  <button
                    onClick={() => onDateClick(day)}
                    className="w-full h-full absolute inset-0 opacity-0 hover:opacity-10 hover:bg-blue-500 rounded-lg transition-opacity"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des événements du jour sélectionné */}
      {events.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Événements de {formatDate(currentDate, 'MMMM yyyy')}
          </h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type).split(' ')[0].replace('bg-', 'bg-').replace('text-', '')}`}></div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {event.title}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatEventTime(event.startDate, event.endDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.attendees && JSON.parse(event.attendees).length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{JSON.parse(event.attendees).length}</span>
                      </div>
                    )}
                    
                    {event.externalSource && (
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="capitalize">{event.externalSource.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
