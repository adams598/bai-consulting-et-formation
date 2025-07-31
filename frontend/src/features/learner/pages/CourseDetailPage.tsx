import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Users, Star, Award, ChevronRight, Play, CheckCircle } from 'lucide-react';
import { Course, Module, Lesson } from '../types';

// Données de test
const mockCourse: Course = {
  id: '1',
  title: 'Introduction à la Banque Digitale',
  description: 'Découvrez les fondamentaux de la transformation digitale dans le secteur bancaire. Cette formation complète vous guidera à travers les concepts clés, les technologies émergentes et les meilleures pratiques du secteur.',
  thumbnail: '/images/courses/banque-digitale.jpg',
  category: 'banque',
  level: 'débutant',
  duration: 180,
  modules: [
    {
      id: '1',
      title: 'Les Fondamentaux de la Banque Digitale',
      description: 'Comprendre les bases de la transformation digitale bancaire',
      order: 1,
      lessons: [
        {
          id: '1',
          title: 'Introduction à la Banque Digitale',
          type: 'video',
          content: { videoUrl: '/videos/courses/banque-digitale/intro.mp4' },
          duration: 15,
          isCompleted: false
        },
        {
          id: '2',
          title: 'Les Tendances du Secteur Bancaire',
          type: 'document',
          content: { documentUrl: '/documents/courses/banque-digitale/tendances.pdf' },
          duration: 20,
          isCompleted: false
        }
      ],
      duration: 35
    },
    // Ajoutez d'autres modules ici
  ],
  instructor: {
    name: 'Jean Dupont',
    avatar: '/images/instructors/jean-dupont.jpg',
    title: 'Expert en Digital Banking'
  },
  rating: 4.8,
  enrolledCount: 1250,
  isFree: true,
  certificate: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [selectedModule, setSelectedModule] = useState<Module | null>(mockCourse.modules[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(mockCourse.modules[0].lessons[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête du cours */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={mockCourse.thumbnail}
            alt={mockCourse.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{mockCourse.title}</h1>
            <p className="text-lg opacity-90">{mockCourse.description}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-600">{Math.round(mockCourse.duration / 60)}h de formation</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-600">{mockCourse.enrolledCount} apprenants</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-gray-600">{mockCourse.rating.toFixed(1)}/5</span>
            </div>
            {mockCourse.certificate && (
              <div className="flex items-center">
                <Award className="h-5 w-5 text-brand-beige mr-2" />
                <span className="text-gray-600">Certificat inclus</span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <img
              src={mockCourse.instructor.avatar}
              alt={mockCourse.instructor.name}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <p className="font-medium text-gray-900">{mockCourse.instructor.name}</p>
              <p className="text-sm text-gray-600">{mockCourse.instructor.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du cours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des modules */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contenu du cours</h2>
            <div className="space-y-4">
              {mockCourse.modules.map(module => (
                <div key={module.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedModule(module)}
                    className={`w-full p-4 text-left flex items-center justify-between ${
                      selectedModule?.id === module.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.lessons.length} leçons</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transform transition-transform ${
                      selectedModule?.id === module.id ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {selectedModule?.id === module.id && (
                    <div className="border-t">
                      {module.lessons.map(lesson => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 ${
                            selectedLesson?.id === lesson.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          {lesson.isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Play className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{lesson.title}</p>
                            <p className="text-sm text-gray-600">{lesson.duration} min</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu de la leçon */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {selectedLesson ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h2>
                {selectedLesson.type === 'video' && (
                  <div className="aspect-video bg-black rounded-lg mb-6">
                    <video
                      src={selectedLesson.content.videoUrl}
                      controls
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                )}
                {selectedLesson.type === 'document' && (
                  <div className="border rounded-lg p-4 mb-6">
                    <a
                      href={selectedLesson.content.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Télécharger le document
                    </a>
                  </div>
                )}
                {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Ressources complémentaires</h3>
                    <div className="space-y-2">
                      {selectedLesson.resources.map(resource => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-brand-blue hover:underline"
                        >
                          {resource.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Sélectionnez une leçon pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 