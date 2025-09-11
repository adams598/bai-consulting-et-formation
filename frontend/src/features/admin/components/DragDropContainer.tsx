import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface DragDropContainerProps {
  children: React.ReactNode;
  items: any[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  strategy?: 'vertical' | 'rect';
  className?: string;
}

const DragDropContainer: React.FC<DragDropContainerProps> = ({
  children,
  items,
  onDragEnd,
  onDragStart,
  strategy = 'rect',
  className = ''
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortingStrategy = strategy === 'vertical' 
    ? verticalListSortingStrategy 
    : rectSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      modifiers={[restrictToWindowEdges]}
    >
      <SortableContext 
        items={items.map(item => item.id)} 
        strategy={sortingStrategy}
      >
        <div className={className}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DragDropContainer;
