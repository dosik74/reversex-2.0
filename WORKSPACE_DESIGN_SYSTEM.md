# 🎨 Workspace - Дизайн и Интерфейсы

## Цветовая Палитра

### Основные Цвета
```
Белый:     #FFFFFF (фон)
Чёрный:    #000000 (текст, кнопки)
Серый 50:  #F9FAFB (фон элементов)
Серый 200: #E5E7EB (границы)
Серый 400: #9CA3AF (вторичный текст)
Серый 600: #4B5563 (основной текст)
```

### Статусы Kanban
```
Планы:      #6B7280 (серый)
Делается:   #3B82F6 (синий)
Сделано:    #10B981 (зелёный)
Брошено:    #EF4444 (красный)
```

---

## Типография

```
Font Family: System default (-apple-system, BlinkMacSystemFont, etc.)

Заголовки:
- h1: 32px, font-light, tracking-tight
- h2: 24px, font-light, tracking-tight
- h3: 20px, font-light, tracking-tight

Основной текст:
- Body: 16px, font-normal, leading-normal

Вспомогательный:
- Small: 14px, font-normal
- Tiny: 12px, font-normal
```

---

## Компоненты

### 1. Кнопка (Primary)
```
Состояние: Default
- Фон: Чёрный
- Текст: Белый
- Padding: 12px 24px
- Border radius: 8px
- Transition: 0.2s

Состояние: Hover
- Фон: Серый 800
- Scale: 1.02
```

### 2. Кнопка (Secondary)
```
Состояние: Default
- Border: 1px серый 300
- Текст: Чёрный
- Padding: 12px 24px
- Border radius: 8px

Состояние: Hover
- Фон: Серый 100
```

### 3. Input
```
Default:
- Border: 1px серый 300
- Padding: 12px 16px
- Border radius: 8px
- Font size: 16px

Focus:
- Border: 1px чёрный
- Ring: 1px чёрный
- Outline: none
```

### 4. Карточка Проекта
```
Default:
- Border: 1px серый 200
- Padding: 24px
- Border radius: 8px
- Background: белый

Hover:
- Border: 1px чёрный
- Shadow: 0 10px 25px rgba(0,0,0,0.1)
- Transform: translateY(-4px)
```

### 5. Задача (Task Card)
```
Default:
- Border: 1px серый 200
- Padding: 16px
- Border radius: 8px
- Background: белый
- Shadow: 0 1px 3px rgba(0,0,0,0.1)

Hover:
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Transform: translateY(-2px)
```

### 6. Модальное Окно
```
Overlay:
- Background: rgba(0,0,0,0.5)
- Animation: fadeIn 0.3s

Dialog:
- Background: белый
- Border radius: 12px
- Padding: 32px
- Shadow: 0 25px 50px rgba(0,0,0,0.15)
- Animation: scaleIn 0.3s
```

---

## Анимации (Framer Motion)

### Entrance (Появление)
```typescript
// Fade In + Translate Y
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.4 }

// Stagger для списков
staggerChildren: 0.1
delayChildren: 0.2
```

### Hover Effects
```typescript
whileHover: { scale: 1.05, y: -4 }
whileTap: { scale: 0.95 }
transition: { duration: 0.2 }
```

### Drag & Drop
```typescript
whileDrag: { opacity: 0.8 }
dragElastic: 0.2
dragTransition: { power: 0.3, distance: 200 }
```

### Модальные Окна
```typescript
// Overlay
initial: { opacity: 0 }
animate: { opacity: 1 }
exit: { opacity: 0 }

// Dialog
initial: { scale: 0.95, opacity: 0 }
animate: { scale: 1, opacity: 1 }
exit: { scale: 0.95, opacity: 0 }
```

---

## Spacing (Отступы)

```
4px   - xs (1 unit)
8px   - sm (2 units)
12px  - md (3 units)
16px  - lg (4 units)
24px  - xl (6 units)
32px  - 2xl (8 units)
48px  - 3xl (12 units)
```

---

## Shadows

```
Маленькая: 0 1px 3px rgba(0,0,0,0.1)
Средняя:  0 4px 6px rgba(0,0,0,0.1)
Большая:  0 10px 25px rgba(0,0,0,0.1)
XL:       0 25px 50px rgba(0,0,0,0.15)
```

---

## Border Radius

```
Маленький: 4px
Средний:  8px
Большой:  12px
XL:       16px
Полный:   9999px
```

---

## Responsive

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px

Grid Layout:
- Mobile:  1 колонка
- Tablet:  2 колонки
- Desktop: 3 колонки
```

---

## Состояния Элементов

### Button States
```
Default:   bg-black text-white
Hover:     bg-gray-800
Active:    scale(0.98)
Disabled:  opacity-50 cursor-not-allowed
Loading:   spinner animation
```

### Input States
```
Default:   border-gray-300 bg-white
Focus:     border-black ring-1 ring-black
Error:     border-red-500 bg-red-50
Disabled:  bg-gray-50 text-gray-600
```

### Task States
```
Active:    border-gray-200 shadow-sm
Hover:     border-gray-300 shadow-md
Dragging:  opacity-80
Completed: line-through text-gray-400
```

---

## Transitions

```
快速:    0.2s (UI interactions)
标准:   0.3s (anims, modals)
缓慢:   0.4s (page transitions)

Easing:
- Linear:    linear
- Ease Out:  cubic-bezier(0.4, 0, 0.2, 1)
- Ease In:   cubic-bezier(0.4, 0.6, 0, 1)
```

---

## Layout Patterns

### Header
```
Sticky Top: z-40, bg-white/95 backdrop-blur
Padding: 16px (vertical), 24px (horizontal)
Border: 1px bottom gray-200
```

### Main Container
```
Max Width: 1280px (7xl)
Padding: 24px (horizontal)
Margin: auto (centered)
```

### Grid
```
Gap: 24px between columns
Responsive: 1-2-3 columns
Card Height: auto
```

### Kanban Board
```
Card Width: 320px (flex-shrink-0)
Min Height: 384px per column
Gap: 12px between cards
```

---

## Dark Mode (Future)

```
Background: #1a1a1a
Text:       #f5f5f5
Border:     #333333
Shadow:     rgba(0,0,0,0.3)
```

---

## Accessibility

- ✅ Color contrast (WCAG AA)
- ✅ Focus states visible
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Reduced motion support

---

## Performance

- ✅ GPU-accelerated animations
- ✅ Will-change hints
- ✅ Transform-based movements
- ✅ Debounced handlers
- ✅ Lazy loading

---

## Design Tokens

```typescript
const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
  }
}

const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
}

const RADIUS = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
}

const SHADOW = {
  sm: "0 1px 3px rgba(0,0,0,0.1)",
  md: "0 4px 6px rgba(0,0,0,0.1)",
  lg: "0 10px 25px rgba(0,0,0,0.1)",
  xl: "0 25px 50px rgba(0,0,0,0.15)",
}
```

---

## Figma Components (Готов к Дизайну)

```
Workspace Design System готов к импорту в Figma:
- Color styles
- Typography styles
- Shadow styles
- Component library
```

---

*Design System v1.0 - Created 11 December 2025*
