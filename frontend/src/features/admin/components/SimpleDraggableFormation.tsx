import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Formation } from '../types';

interface SimpleDraggableFormationProps {
  formation: Formation;
}

const SimpleDraggableFormation: React.FC<SimpleDraggableFormationProps> = ({ formation }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: formation.id,
    disabled: false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-300 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="text-sm font-medium text-gray-800">{formation.title}</div>
      <div className="text-xs text-gray-500 mt-1">ID: {formation.id}</div>
    </div>
  );
};

export default SimpleDraggableFormation;
