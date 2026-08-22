import { useState } from 'react';
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
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TierListItem } from '@/utils/tierListService';

interface TierListDisplayProps {
  items: TierListItem[];
  onRemoveItem: (itemId: string) => void;
  onReorderItems: (items: TierListItem[]) => void;
  isEditable?: boolean;
}

const TIERS = [
  { id: 'SS', label: 'SS', color: 'bg-red-500' },
  { id: 'S', label: 'S', color: 'bg-orange-500' },
  { id: 'A', label: 'A', color: 'bg-yellow-500' },
  { id: 'B', label: 'B', color: 'bg-green-500' },
  { id: 'C', label: 'C', color: 'bg-blue-500' }
];

// Sortable item component
const SortableItem = ({
  item,
  isEditable,
  onRemove
}: {
  item: TierListItem;
  isEditable: boolean;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <img
        src={item.poster_url || 'https://placehold.co/100x150'}
        alt={item.title}
        className="h-24 w-16 object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center rounded-lg">
        {isEditable && (
          <Button
            variant="destructive"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
        {item.title}
      </p>
    </div>
  );
};

// Tier row component
const TierRow = ({
  tier,
  items,
  isEditable,
  onRemoveItem
}: {
  tier: { id: string; label: string; color: string };
  items: TierListItem[];
  isEditable: boolean;
  onRemoveItem: (itemId: string) => void;
}) => {
  const itemIds = items.map(item => item.id);

  return (
    <div className="flex gap-3">
      {/* Tier Label */}
      <div className={`${tier.color} w-20 flex items-center justify-center rounded-lg font-bold text-white text-xl flex-shrink-0`}>
        {tier.label}
      </div>

      {/* Items Container */}
      <SortableContext items={itemIds} disabled={!isEditable}>
        <div className="flex-1 min-h-24 rounded-lg border-2 border-dashed bg-muted border-muted-foreground/30 p-3 flex flex-wrap gap-2 items-start content-start">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm w-full text-center py-4">
              Перетащите сюда
            </p>
          ) : (
            items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                isEditable={isEditable}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const TierListDisplay = ({
  items,
  onRemoveItem,
  onReorderItems,
  isEditable = true
}: TierListDisplayProps) => {
  const [localItems, setLocalItems] = useState(items);

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
    if (!isEditable) return;

    const { active, over } = event;

    if (!over) return;

    const draggedItem = localItems.find(item => item.id === active.id);
    if (!draggedItem) return;

    // Get the tier ID from the over element
    const newTierId = over.id as string;
    if (!TIERS.find(t => t.id === newTierId)) return;

    // Update the item's tier
    const updatedItems = localItems.map(item =>
      item.id === active.id
        ? { ...item, tier: newTierId as 'SS' | 'S' | 'A' | 'B' | 'C' }
        : item
    );

    setLocalItems(updatedItems);
    onReorderItems(updatedItems);
  };

  const getItemsByTier = (tier: string) => {
    return localItems.filter((item) => item.tier === tier);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full space-y-2">
        {TIERS.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            items={getItemsByTier(tier.id)}
            isEditable={isEditable}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default TierListDisplay;
