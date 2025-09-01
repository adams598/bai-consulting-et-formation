import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, BookOpen, Edit, Trash2, FileText, Video, Image, ChevronDown, ChevronRight, Clock, CheckSquare, Move, Square } from 'lucide-react';
import { Formation, FormationContent } from '../types';
import { formationContentApi } from '../../../api/adminApi';
import SectionModal from './SectionModal';
import LessonModal from './LessonModal';
import ConfirmModal from './ConfirmModal';
import LessonPreview from './LessonPreview';
import LessonSelectionManager from './LessonSelectionManager';
import LessonProgressBar from './LessonProgressBar';
import { toast } from '../../../components/ui/use-toast';
import { getLessonImageUrl } from '../../../utils/imageUtils';

interface FormationContentManagerProps {
  formation: Formation;
  onClose: () => void;
}

const FormationContentManager: React.FC<FormationContentManagerProps> = ({
  formation,
  onClose
}) => {
  const [content, setContent] = useState<FormationContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<FormationContent | null>(null);
  const [action, setAction] = useState<'edit' | 'delete' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // États pour la sélection multiple et l'aperçu
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [showLessonSelection, setShowLessonSelection] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<FormationContent | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadContent();
  }, [formation.id]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const response = await formationContentApi.getByFormation(formation.id);
      const contentData = response.data.data || [];
      console.log('📚 Contenu chargé:', contentData);
      
      // Log des images de couverture
      contentData.forEach((item, index) => {
        if (item.contentType === 'LESSON') {
          console.log(`📖 Leçon ${index + 1}:`, {
            title: item.title,
            coverImage: item.coverImage,
            hasCoverImage: !!item.coverImage,
            type: item.type
          });
        }
      });
      
      setContent(contentData);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSection = async (sectionData: Partial<FormationContent>) => {
    try {
      if (selectedContent) {
        // Mise à jour d'une section existante
        await formationContentApi.updateSection(selectedContent.id, {
          title: sectionData.title || selectedContent.title,
          description: sectionData.description || selectedContent.description,
          order: sectionData.order || selectedContent.order
        });
      } else {
        // Création d'une nouvelle section
        await formationContentApi.addSection(formation.id, {
          title: sectionData.title || '',
          description: sectionData.description || '',
          order: sectionData.order || 0
        });
      }
      setShowSectionModal(false);
      loadContent();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la section:', error);
    }
  };

  const handleSaveLesson = async (lessonData: Partial<FormationContent>) => {
    try {
      if (selectedContent) {
        // Mise à jour d'une leçon existante
        await formationContentApi.updateLesson(selectedContent.id, {
          title: lessonData.title || selectedContent.title,
          description: lessonData.description || selectedContent.description,
          type: lessonData.type || selectedContent.type,
          duration: lessonData.duration || selectedContent.duration,
          order: lessonData.order || selectedContent.order,
          sectionId: lessonData.sectionId || selectedContent.sectionId,
          coverImage: lessonData.coverImage || selectedContent.coverImage,
          fileUrl: lessonData.fileUrl || selectedContent.fileUrl
        });
      } else {
        // Création d'une nouvelle leçon
        await formationContentApi.addLesson(formation.id, {
          title: lessonData.title || '',
          description: lessonData.description || '',
          type: lessonData.type || 'PRESENTATION',
          duration: lessonData.duration || 0,
          order: lessonData.order || 0,
          sectionId: lessonData.sectionId,
          coverImage: lessonData.coverImage,
          fileUrl: lessonData.fileUrl
        });
      }
      setShowLessonModal(false);
      loadContent();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la leçon:', error);
    }
  };

  const handleDeleteContent = async (contentItem: FormationContent) => {
    try {
      if (contentItem.contentType === 'SECTION') {
        await formationContentApi.deleteSection(contentItem.id);
      } else {
        await formationContentApi.deleteLesson(contentItem.id);
      }
      setShowConfirmModal(false);
      loadContent();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Gestion de la sélection multiple
  const toggleLessonSelection = (lessonId: string) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleAssignLessonsToSection = async (lessonIds: string[], sectionId: string) => {
    try {
      // Mettre à jour chaque leçon avec la nouvelle section
      await Promise.all(
        lessonIds.map(async lessonId => {
          // Récupérer d'abord la leçon existante pour conserver ses données
          const existingLesson = content.find(item => item.id === lessonId);
          if (existingLesson && existingLesson.contentType === 'LESSON') {
            return formationContentApi.updateLesson(lessonId, {
              title: existingLesson.title,
              description: existingLesson.description,
              type: existingLesson.type,
              duration: existingLesson.duration,
              order: existingLesson.order,
              sectionId: sectionId
            });
          }
        })
      );
      setSelectedLessons(new Set());
      loadContent();
    } catch (error) {
      console.error('Erreur lors de l\'affectation des leçons:', error);
    }
  };

  const handleDeleteMultipleLessons = async (lessonIds: string[]) => {
    try {
      await Promise.all(
        lessonIds.map(lessonId => 
          formationContentApi.deleteLesson(lessonId)
        )
      );
      setSelectedLessons(new Set());
      loadContent();
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
    }
  };

  // Gestion de l'aperçu au survol
  const handleLessonMouseEnter = (lesson: FormationContent, event: React.MouseEvent) => {
    setPreviewLesson(lesson);
    setPreviewPosition({ x: event.clientX, y: event.clientY });
  };

  const handleLessonMouseLeave = () => {
    setPreviewLesson(null);
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'VIDEO':
        return <Video className="h-5 w-5 text-green-600" />;
      case 'DOCUMENT':
        return <FileText className="h-5 w-5 text-blue-700" />;
      case 'INTERACTIVE':
        return <Image className="h-5 w-5 text-purple-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return 'Présentation';
      case 'VIDEO':
        return 'Vidéo';
      case 'DOCUMENT':
        return 'Document';
      case 'INTERACTIVE':
        return 'Interactif';
      default:
        return 'Autre';
    }
  };

  const sections = content.filter(item => item.contentType === 'SECTION');
  const lessonsWithoutSection = content.filter(item => 
    item.contentType === 'LESSON' && !item.sectionId
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header avec style uniforme */}
      <div className="bg-gradient-to-b from-white to-gray-100 border-b border-gray-200">
        <div className="px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-3 text-gray-900">
                {formation.title}
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Gestion du contenu et des leçons
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold shadow-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-8 py-8">
        {/* Barre d'outils moderne */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Contenu de la formation</h2>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Liste
                </button>
              </div>
              
              {/* Indicateur de sélection */}
              {selectedLessons.size > 0 && (
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-700 font-medium">
                    {selectedLessons.size} leçon(s) sélectionnée(s)
                  </span>
                  <button
                    onClick={() => setSelectedLessons(new Set())}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Désélectionner
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              {/* Actions pour les leçons sélectionnées */}
              {selectedLessons.size > 0 && (
                <>
                  <button
                    onClick={() => setShowLessonSelection(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    title="Affecter les leçons sélectionnées à une section"
                  >
                    <Move className="h-4 w-4" />
                    Affecter à une section
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedLessons.size} leçon(s) ?`)) {
                        handleDeleteMultipleLessons(Array.from(selectedLessons));
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    title="Supprimer les leçons sélectionnées"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer ({selectedLessons.size})
                  </button>
                </>
              )}
              

              
              <button
                onClick={() => {
                  setSelectedContent(null);
                  setAction('edit');
                  setShowSectionModal(true);
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                Nouvelle Section
              </button>
              <button
                onClick={() => {
                  setSelectedContent(null);
                  setAction('edit');
                  setShowLessonModal(true);
                }}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                Nouvelle Leçon
              </button>
            </div>
          </div>
        </div>

        {/* Contenu en grille moderne */}
        {viewMode === 'grid' ? (
          <div className="space-y-8">
            {/* Sections avec leurs leçons */}
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleSectionExpansion(section.id)}
                        className="text-slate-700 hover:text-slate-800 transition-colors"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-6 w-6" />
                        ) : (
                          <ChevronRight className="h-6 w-6" />
                        )}
                      </button>
                      <FolderOpen className="h-6 w-6 text-slate-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                        <p className="text-slate-600">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContent(section);
                          setAction('edit');
                          setShowSectionModal(true);
                        }}
                        className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier la section"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContent(section);
                          setAction('delete');
                          setShowConfirmModal(true);
                        }}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer la section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedSections.has(section.id) && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Leçons de cette section */}
                      {content
                        .filter(item => item.contentType === 'LESSON' && item.sectionId === section.id)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((lesson) => (
                          <div 
                            key={lesson.id} 
                            className={`group bg-white border-2 rounded-lg p-5 hover:shadow-lg transition-all duration-200 relative ${
                              selectedLessons.has(lesson.id) 
                                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onMouseEnter={(e) => handleLessonMouseEnter(lesson, e)}
                            onMouseLeave={handleLessonMouseLeave}
                          >
                            {/* Badge de sélection */}
                            {selectedLessons.has(lesson.id) && (
                              <div className="absolute -top-2 -left-2 z-20">
                                <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                                  Sélectionnée
                                </div>
                              </div>
                            )}

                            {/* Checkbox de sélection - repositionné en haut à droite */}
                            <div className="absolute top-3 right-3 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonSelection(lesson.id);
                                }}
                                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                {selectedLessons.has(lesson.id) ? (
                                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-500 hover:text-indigo-600 transition-colors" />
                                )}
                              </button>
                            </div>

                            {/* Zone d'image de couverture */}
                            {lesson.coverImage ? (
                              <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-gray-200">
                                <img 
                                  src={getLessonImageUrl(lesson.coverImage)} 
                                  alt={`Couverture de ${lesson.title}`}
                                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
  
                                  onError={(e) => {
                                    console.error('❌ Erreur de chargement de l\'image:', lesson.coverImage, e);
                                    // Fallback si l'image ne charge pas
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                  style={{ minHeight: '128px' }}
                                />
                                {/* Fallback si pas d'image */}
                                <div className="hidden w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  {getContentIcon(lesson.type)}
                                </div>
                              </div>
                            ) : (
                              // Placeholder si pas d'image de couverture
                              <div className="mb-4 w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300">
                                <div className="text-center">
                                  <div className="text-gray-500 mb-2">Pas d'image de couverture</div>
                                  {getContentIcon(lesson.type)}
                                </div>
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                              {getContentIcon(lesson.type)}
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setSelectedContent(lesson);
                                    setAction('edit');
                                    setShowLessonModal(true);
                                  }}
                                  className="text-slate-600 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Modifier la leçon"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedContent(lesson);
                                    setAction('delete');
                                    setShowConfirmModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="Supprimer la leçon"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{lesson.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lesson.description}</p>
                            
                            {/* Barre de progression */}
                            <div className="mb-3">
                              <LessonProgressBar
                                lessonId={lesson.id}
                                formationId={formation.id}
                                userId={localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')!).id : 'default-user-id'}
                                lessonType={lesson.type}
                                className="text-xs"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(lesson.duration || 0)}</span>
                              </div>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                {getContentTypeLabel(lesson.type)}
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Bouton pour ajouter une leçon à cette section */}
                      <button
                        onClick={() => {
                          setSelectedContent(null);
                          setAction('edit');
                          setShowLessonModal(true);
                        }}
                        className="group border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600"
                      >
                        <Plus className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Ajouter une leçon</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Leçons sans section */}
            {lessonsWithoutSection.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-900">Leçons sans section</h3>
                  <p className="text-amber-700 text-sm">Ces leçons ne sont pas organisées dans des sections</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessonsWithoutSection
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((lesson) => (
                        <div 
                          key={lesson.id} 
                          className={`group bg-white border-2 rounded-lg p-5 hover:shadow-lg transition-all duration-200 relative ${
                            selectedLessons.has(lesson.id) 
                              ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                          onMouseEnter={(e) => handleLessonMouseEnter(lesson, e)}
                          onMouseLeave={handleLessonMouseLeave}
                        >
                          {/* Badge de sélection */}
                          {selectedLessons.has(lesson.id) && (
                            <div className="absolute -top-2 -left-2 z-20">
                              <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                                Sélectionnée
                              </div>
                            </div>
                          )}

                          {/* Checkbox de sélection - repositionné en haut à droite */}
                          <div className="absolute top-3 right-3 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLessonSelection(lesson.id);
                              }}
                              className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              {selectedLessons.has(lesson.id) ? (
                                <CheckSquare className="h-5 w-5 text-indigo-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-500 hover:text-indigo-600 transition-colors" />
                              )}
                            </button>
                          </div>

                          {/* Zone d'image de couverture */}
                          {lesson.coverImage ? (
                            <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-gray-200">
                              <img 
                                src={getLessonImageUrl(lesson.coverImage)} 
                                alt={`Couverture de ${lesson.title}`}
                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  // Fallback si l'image ne charge pas
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                                style={{ minHeight: '128px' }}
                              />
                              {/* Fallback si pas d'image */}
                              <div className="hidden w-full h-32 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                {getContentIcon(lesson.type)}
                              </div>
                              
                            </div>
                          ) : (
                            // Placeholder si pas d'image de couverture
                            <div className="mb-4 w-full h-32 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center border-2 border-amber-300">
                              <div className="text-center">
                                <div className="text-amber-600 mb-2">Pas d'image de couverture</div>
                                {getContentIcon(lesson.type)}
                              </div>
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            {getContentIcon(lesson.type)}
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setSelectedContent(lesson);
                                  setAction('edit');
                                  setShowLessonModal(true);
                                }}
                                className="text-slate-600 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Modifier la leçon"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedContent(lesson);
                                  setAction('delete');
                                  setShowConfirmModal(true);
                                }}
                                className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer la leçon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{lesson.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lesson.description}</p>
                          
                          {/* Barre de progression */}
                          <div className="mb-3">
                            <LessonProgressBar
                              lessonId={lesson.id}
                              formationId={formation.id}
                              userId={localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')!).id : 'default-user-id'}
                              lessonType={lesson.type}
                              className="text-xs"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(lesson.duration || 0)}</span>
                            </div>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                              {getContentTypeLabel(lesson.type)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message si aucun contenu */}
            {content.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Commencez à créer du contenu
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Ajoutez des sections pour organiser vos leçons et commencez à construire votre formation
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedContent(null);
                        setAction('edit');
                        setShowSectionModal(true);
                      }}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Créer une section
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(null);
                        setAction('edit');
                        setShowLessonModal(true);
                      }}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Créer une leçon
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Vue liste moderne et organisée
          <div className="space-y-6">
            {/* En-tête de la liste */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-900">
                  <div className="col-span-4">Titre</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2">Durée</div>
                  <div className="col-span-2">Ordre</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
            </div>

            {/* Sections avec leurs leçons */}
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* En-tête de section */}
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-6 py-4 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleSectionExpansion(section.id)}
                        className="text-slate-700 hover:text-slate-800 transition-colors"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <FolderOpen className="h-5 w-5 text-slate-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                        <p className="text-slate-600 text-sm">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContent(section);
                          setAction('edit');
                          setShowSectionModal(true);
                        }}
                        className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier la section"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContent(section);
                          setAction('delete');
                          setShowConfirmModal(true);
                        }}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer la section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leçons de cette section */}
                {expandedSections.has(section.id) && (
                  <div className="divide-y divide-gray-100">
                    {content
                      .filter(item => item.contentType === 'LESSON' && item.sectionId === section.id)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((lesson, index) => (
                        <div key={lesson.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">
                              <div className="flex items-center space-x-3">
                                {getContentIcon(lesson.type)}
                                <div>
                                  <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                  <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-3">
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                                {getContentTypeLabel(lesson.type)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(lesson.duration || 0)}</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                                {lesson.order || index + 1}
                              </span>
                            </div>
                            <div className="col-span-1">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedContent(lesson);
                                    setAction('edit');
                                    setShowLessonModal(true);
                                  }}
                                  className="text-slate-600 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Modifier la leçon"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedContent(lesson);
                                    setAction('delete');
                                    setShowConfirmModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="Supprimer la leçon"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {/* Bouton pour ajouter une leçon à cette section */}
                    <div className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedContent(null);
                          setAction('edit');
                          setShowLessonModal(true);
                        }}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 group"
                      >
                        <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Ajouter une leçon à cette section</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Leçons sans section */}
            {lessonsWithoutSection.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 px-6 py-4 border-b border-amber-300">
                  <h3 className="text-lg font-semibold text-amber-900">Leçons sans section</h3>
                  <p className="text-amber-700 text-sm">Ces leçons ne sont pas organisées dans des sections</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {lessonsWithoutSection
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((lesson, index) => (
                      <div key={lesson.id} className="px-6 py-4 hover:bg-amber-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-4">
                            <div className="flex items-center space-x-3">
                              {getContentIcon(lesson.type)}
                              <div>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                              {getContentTypeLabel(lesson.type)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(lesson.duration || 0)}</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                              {lesson.order || index + 1}
                            </span>
                          </div>
                          <div className="col-span-1">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedContent(lesson);
                                  setAction('edit');
                                  setShowLessonModal(true);
                                }}
                                className="text-slate-600 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Modifier la leçon"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedContent(lesson);
                                  setAction('delete');
                                  setShowConfirmModal(true);
                                }}
                                className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer la leçon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Message si aucun contenu */}
            {content.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Commencez à créer du contenu
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Ajoutez des sections pour organiser vos leçons et commencez à construire votre formation
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedContent(null);
                        setAction('edit');
                        setShowSectionModal(true);
                      }}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Créer une section
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(null);
                        setAction('edit');
                        setShowLessonModal(true);
                      }}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Créer une leçon
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSectionModal && (
        <SectionModal
          isOpen={showSectionModal}
          onClose={() => setShowSectionModal(false)}
          onSave={handleSaveSection}
          formationId={formation.id}
          existingSection={selectedContent}
        />
      )}

      {showLessonModal && (
        <LessonModal
          isOpen={showLessonModal}
          onClose={() => setShowLessonModal(false)}
          onSave={handleSaveLesson}
          formationId={formation.id}
          formationTitle={formation.title}
          sectionId={selectedContent?.sectionId}
          existingLesson={selectedContent}
        />
      )}

      {showConfirmModal && selectedContent && (
        <ConfirmModal
          title={`Supprimer ${selectedContent.contentType === 'SECTION' ? 'la section' : 'la leçon'}`}
          message={`Êtes-vous sûr de vouloir supprimer "${selectedContent.title}" ?`}
          onConfirm={() => handleDeleteContent(selectedContent)}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Supprimer"
          variant="danger"
        />
      )}

      {/* Gestionnaire de sélection multiple des leçons */}
      {showLessonSelection && (
        <LessonSelectionManager
          isOpen={showLessonSelection}
          onClose={() => setShowLessonSelection(false)}
          lessons={content.filter(item => item.contentType === 'LESSON')}
          sections={sections}
          onAssignToSection={handleAssignLessonsToSection}
          onDeleteMultiple={handleDeleteMultipleLessons}
        />
      )}

      {/* Aperçu au survol des leçons */}
      {previewLesson && (
        <LessonPreview
          lesson={previewLesson}
          isVisible={true}
          position={previewPosition}
        />
      )}
    </div>
  );
};

export default FormationContentManager;
