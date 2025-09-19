import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Video,
  Phone,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'FORMATION' | 'MEETING' | 'CALL' | 'PERSONAL' | 'EXTERNAL';
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  color?: string;
  formationId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminders?: number[]; // minutes before event
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onDateClick?: (date: Date) => void;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  allowEdit?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateClick,
  view = 'month',
  onViewChange,
  allowEdit = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Générer les jours du mois
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer au lundi de la semaine contenant le premier jour
    const startDayOfWeek = firstDay.getDay();
    const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const days = [];
    const endDate = new Date(lastDay);
    
    // Aller jusqu'au dimanche de la semaine contenant le dernier jour
    const endDayOfWeek = lastDay.getDay();
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Générer les jours de la semaine
  const weekDays7 = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Filtrer les événements pour une date donnée
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);
      
      return (
        (eventStart.toDateString() === checkDate.toDateString()) ||
        (eventStart <= checkDate && eventEnd >= checkDate)
      );
    });
  };

  // Obtenir la couleur d'un événement selon son type
  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    
    switch (event.type) {
      case 'FORMATION':
        return 'bg-blue-500';
      case 'MEETING':
        return 'bg-green-500';
      case 'CALL':
        return 'bg-yellow-500';
      case 'PERSONAL':
        return 'bg-purple-500';
      case 'EXTERNAL':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Obtenir l'icône d'un événement selon son type
  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'FORMATION':
        return <BookOpen className="h-3 w-3" />;
      case 'MEETING':
        return <Users className="h-3 w-3" />;
      case 'CALL':
        return <Phone className="h-3 w-3" />;
      case 'PERSONAL':
        return <CalendarIcon className="h-3 w-3" />;
      case 'EXTERNAL':
        return <CalendarIcon className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
    onEventClick?.(event);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
      {/* En-têtes des jours */}
      {weekDays.map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
          {day}
        </div>
      ))}
      
      {/* Jours du mois */}
      {monthDays.map((date, index) => {
        const dayEvents = getEventsForDate(date);
        const isCurrentMonthDay = isCurrentMonth(date);
        const isTodayDate = isToday(date);
        
        return (
          <div
            key={index}
            onClick={() => handleDateClick(date)}
            className={`bg-white p-1 h-24 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isCurrentMonthDay ? 'opacity-30' : ''
            } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className={`text-sm font-medium mb-1 ${
              isTodayDate ? 'text-blue-600' : isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {date.getDate()}
            </div>
            
            <div className="space-y-px">
              {dayEvents.slice(0, 2).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className={`text-xs px-1 py-0.5 rounded text-white cursor-pointer truncate ${getEventColor(event)}`}
                  title={event.title}
                >
                  <div className="flex items-center space-x-1">
                    {getEventIcon(event)}
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500 px-1">
                  +{dayEvents.length - 2} autres
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-lg overflow-hidden">
      {/* Colonne des heures */}
      <div className="bg-gray-50">
        <div className="h-12 border-b border-gray-200"></div>
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="h-12 border-b border-gray-200 text-xs text-gray-500 p-1">
            {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {/* Colonnes des jours */}
      {weekDays7.map(date => {
        const dayEvents = getEventsForDate(date);
        const isTodayDate = isToday(date);
        
        return (
          <div key={date.toISOString()} className="bg-white">
            <div className={`h-12 border-b border-gray-200 p-2 text-center ${
              isTodayDate ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}>
              <div className="text-sm font-medium">
                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-lg">{date.getDate()}</div>
            </div>
            
            {/* Grille horaire */}
            <div className="relative">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-12 border-b border-gray-100"></div>
              ))}
              
              {/* Événements */}
              {dayEvents.map(event => {
                const startHour = new Date(event.startDate).getHours();
                const startMinute = new Date(event.startDate).getMinutes();
                const duration = (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60);
                
                return (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`absolute left-1 right-1 rounded px-2 py-1 text-xs text-white cursor-pointer ${getEventColor(event)}`}
                    style={{
                      top: `${(startHour * 48) + (startMinute * 48 / 60)}px`,
                      height: `${Math.max(duration * 48 / 60, 24)}px`
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      {getEventIcon(event)}
                      <span className="truncate font-medium">{event.title}</span>
                    </div>
                    <div className="text-xs opacity-90">
                      {formatTime(new Date(event.startDate))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {view === 'month' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Semaine du ${weekDays7[0]?.getDate()} ${months[weekDays7[0]?.getMonth()]} ${weekDays7[0]?.getFullYear()}`}
            {view === 'day' && currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sélecteur de vue */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map(viewType => (
              <button
                key={viewType}
                onClick={() => onViewChange?.(viewType)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === viewType 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType === 'month' ? 'Mois' : viewType === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>

          {allowEdit && onEventCreate && (
            <button
              onClick={() => {
                setSelectedEvent(null);
                setIsEditing(true);
                setShowEventModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvel événement</span>
            </button>
          )}
        </div>
      </div>

      {/* Vue du calendrier */}
      <div className="calendar-view" style={{ minHeight: '600px' }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
      </div>

      {/* Modal d'événement */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isEditing ? (selectedEvent ? 'Modifier l\'événement' : 'Nouvel événement') : 'Détails de l\'événement'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setIsEditing(false);
                      setSelectedEvent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {selectedEvent && !isEditing && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        {getEventIcon(selectedEvent)}
                        <span>{selectedEvent.title}</span>
                      </h4>
                      {selectedEvent.description && (
                        <p className="text-gray-600 mt-1">{selectedEvent.description}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedEvent.isAllDay 
                            ? 'Toute la journée'
                            : `${formatTime(new Date(selectedEvent.startDate))} - ${formatTime(new Date(selectedEvent.endDate))}`
                          }
                        </span>
                      </div>
                      
                      {selectedEvent.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      )}
                      
                      {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{selectedEvent.attendees.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedEvent && !isEditing && allowEdit && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        onEventDelete?.(selectedEvent.id);
                        setShowEventModal(false);
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-600 hover:bg-red-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
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

export default Calendar;
