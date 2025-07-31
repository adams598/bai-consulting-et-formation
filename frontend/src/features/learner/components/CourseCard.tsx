import React from 'react';
import { Course } from '../types';
import { Clock, Users, Star, Award, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
  progress?: number;
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl group">
      {/* Image de couverture */}
      <div className="relative h-48">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-brand-blue transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
          </div>
          {course.certificate && (
            <Award className="h-6 w-6 text-brand-beige" />
          )}
        </div>

        {/* Métadonnées */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{Math.round(course.duration / 60)}h</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.enrolledCount} apprenants</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-400" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Instructeur */}
        <div className="flex items-center mb-4">
          <img
            src={course.instructor.avatar}
            alt={course.instructor.name}
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{course.instructor.name}</p>
            <p className="text-xs text-gray-500">{course.instructor.title}</p>
          </div>
        </div>

        {/* Bouton d'action */}
        <Link
          to={`/apprenant/cours/${course.id}`}
          className="flex items-center justify-center w-full bg-brand-blue text-white py-2 px-4 rounded-lg hover:bg-brand-blue/90 transition-colors"
        >
          {progress !== undefined ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Continuer
            </>
          ) : (
            'Commencer'
          )}
        </Link>
      </div>
    </div>
  );
} 