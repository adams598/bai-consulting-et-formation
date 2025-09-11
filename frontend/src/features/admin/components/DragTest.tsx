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

const DragTest: React.FC = () => {
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
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2 text-yellow-800">🧪 Test Drag & Drop</h3>
      <p className="text-sm text-yellow-700 mb-4">Glissez-déposez les éléments ci-dessous pour tester :</p>
      
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
                className="bg-white border border-gray-300 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                style={{
                  touchAction: 'none',
                }}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {item.id}</div>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-4 text-xs text-yellow-700">
        <strong>Ordre actuel:</strong> {items.map((item, index) => `${index + 1}.${item.title}`).join(', ')}
      </div>
    </div>
  );
};

export default DragTest;
