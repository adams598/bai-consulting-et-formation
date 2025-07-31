import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { Course } from '../types';

// Données de test
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction à la Banque Digitale',
    description: 'Découvrez les fondamentaux de la transformation digitale dans le secteur bancaire.',
    thumbnail: '/images/courses/banque-digitale.jpg',
    category: 'banque',
    level: 'débutant',
    duration: 180,
    modules: [],
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
  },
  // Ajoutez d'autres cours ici
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Nos formations</h1>
        <p className="text-gray-600">
          Découvrez notre catalogue de formations professionnelles dans les domaines de la banque,
          de l'assurance et de l'immobilier.
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Barre de recherche */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            <option value="banque">Banque</option>
            <option value="assurance">Assurance</option>
            <option value="immobilier">Immobilier</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="all">Tous les niveaux</option>
            <option value="débutant">Débutant</option>
            <option value="intermédiaire">Intermédiaire</option>
            <option value="avancé">Avancé</option>
          </select>
        </div>
      </div>

      {/* Grille de cours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche ou de filtres.
          </p>
        </div>
      )}
    </div>
  );
} 