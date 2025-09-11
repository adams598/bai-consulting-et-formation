import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface TestItem {
  id: string;
  title: string;
}

const DragDropTest: React.FC = () => {
  const [items, setItems] = useState<TestItem[]>([
    { id: '1', title: 'Formation 1' },
    { id: '2', title: 'Formation 2' },
    { id: '3', title: 'Formation 3' },
    { id: '4', title: 'Formation 4' },
  ]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Test Drag & Drop</h2>
      <p className="mb-4 text-gray-600">Glissez-déposez les éléments pour les réorganiser :</p>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-blue-100 border border-blue-300 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:bg-blue-200 transition-colors"
                style={{
                  touchAction: 'none',
                }}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-800">{item.title}</div>
                  <div className="text-xs text-blue-600 mt-1">ID: {item.id}</div>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Ordre actuel :</h3>
        <div className="text-sm text-gray-600">
          {items.map((item, index) => (
            <span key={item.id}>
              {index + 1}. {item.title}
              {index < items.length - 1 && ', '}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DragDropTest;
