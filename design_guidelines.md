# AgentForge AI - Design Guidelines

## Design Approach

**System-Based Approach**: Drawing from Replit's modern developer experience, Linear's clarity, and GitHub's developer-focused UX for a professional, AI-powered development platform.

**Rationale**: This is an AI-powered development platform combining 5 specialized AI agents with human expert backup. The design emphasizes modern IDE aesthetics, clear status indicators, and seamless collaboration between AI and human developers.

---

## Core Design Principles

1. **Clarity First**: Every element serves a functional purpose
2. **Status Transparency**: Users always know project state, budget, and progress
3. **Bilingual Excellence**: Seamless RTL/LTR support for Arabic/English
4. **Professional Trust**: Design conveys security and reliability for financial transactions

---

## Typography

**Primary Font**: Inter (Google Fonts)
- Headings: 600-700 weight, 24px-36px
- Body: 400 weight, 14px-16px
- Code/Data: JetBrains Mono, 13px-14px, 400 weight
- Arabic: Cairo (fallback for Arabic text), same size hierarchy

**Hierarchy**:
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels/Meta: text-sm text-gray-600
- Code Snippets: font-mono text-sm

---

## Layout System

**Spacing Units**: Consistent use of Tailwind units: **2, 4, 6, 8, 12, 16**

- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Grid gaps: gap-4, gap-6
- Margins: m-4, m-8, m-12

**Grid Structure**:
- Dashboard: Sidebar (w-64) + Main Content (flex-1)
- Card Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Project Details: Two-column split (2/3 + 1/3) for main/sidebar
- Forms: Single column, max-w-2xl centered

---

## Component Library

### Navigation
- **Top Bar**: Full-width, h-16, flex items-center justify-between, px-6
  - Logo + Project Name (left)
  - Balance Display + User Menu (right)
- **Sidebar**: Fixed left, w-64, py-6, px-4
  - Navigation items: py-3, px-4, rounded-lg, space-y-1
  - Active state: distinct background treatment
  - Icons: w-5 h-5 (Heroicons)

### Dashboard Cards
- **Project Cards**: p-6, rounded-xl, border, space-y-4
  - Header: flex justify-between items-start
  - Status Badge: px-3 py-1, rounded-full, text-xs font-medium
  - Progress Bar: h-2, rounded-full, relative overflow-hidden
  - Footer: flex justify-between items-center, text-sm

### Agent Status Display
- **Agent Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4
- **Agent Card**: p-4, rounded-lg, border
  - Icon: w-8 h-8, mb-3
  - Name: text-sm font-medium
  - Status Indicator: w-2 h-2, rounded-full, inline-block
  - Progress: text-xs, mt-2

### Chat Interface
- **Chat Container**: flex flex-col, h-[600px]
- **Messages Area**: flex-1, overflow-y-auto, p-4, space-y-3
- **Message Bubble**: max-w-[70%], p-3, rounded-2xl
  - User: ml-auto, rounded-br-sm
  - Programmer: mr-auto, rounded-bl-sm
- **Input**: sticky bottom-0, p-4, border-t, flex gap-2

### File Management
- **File List**: divide-y
- **File Item**: py-3, px-4, flex items-center justify-between
  - Icon + Name (left): flex items-center gap-3
  - Status + Size (right): flex items-center gap-4, text-sm
  - Actions: invisible group-hover:visible

### Programmer Dashboard
- **Work Timer**: Large display, text-4xl font-bold, tabular-nums
- **Control Buttons**: 
  - Start/Stop: px-8 py-4, rounded-xl, text-lg font-semibold
  - Primary action: w-full md:w-auto
- **Task List**: space-y-2, each task p-4, rounded-lg, border

### Payment & Balance
- **Balance Display**: p-4, rounded-lg, border-2
  - Amount: text-3xl font-bold, tabular-nums
  - Icon: w-6 h-6
- **Transaction History**: Table format
  - Headers: text-xs uppercase tracking-wide, pb-3
  - Rows: py-4, border-b, last:border-0
- **Top-Up Button**: Fixed position bottom-right or prominent in header

### Forms
- **Input Fields**: w-full, px-4 py-3, rounded-lg, border, text-base
- **Textareas**: min-h-[120px], resize-y
- **Labels**: block mb-2, text-sm font-medium
- **Helper Text**: text-sm, mt-1
- **Error States**: border-red-500, text-red-600

### Status Indicators
- **Badges**: px-2.5 py-0.5, rounded-full, text-xs font-medium
  - Pending: neutral tone
  - In Progress: blue/active tone
  - Completed: green/success tone
  - Failed: red/error tone
- **Loading States**: Skeleton screens, h-4 rounded, animate-pulse

### Modals & Overlays
- **Modal**: max-w-2xl, rounded-xl, p-6
- **Header**: pb-4, border-b, flex justify-between items-start
- **Footer**: pt-4, border-t, flex justify-end gap-3

---

## Responsive Behavior

- **Mobile** (base): Single column, stacked sidebar (drawer)
- **Tablet** (md:): Two-column grids, persistent sidebar
- **Desktop** (lg:+): Three+ column grids, full dashboard layout

---

## RTL Support

- Use `dir="rtl"` for Arabic
- All flex/grid layouts reverse automatically
- Sidebar switches to right side in RTL
- Maintain same spacing units
- Mirror icons where directional (arrows, chevrons)

---

## Key User Flows

1. **Project Creation**: Multi-step form → AI agent activation → Real-time progress
2. **Request Programmer**: Modal → Programmer list → Assignment confirmation
3. **Chat**: Real-time WebSocket updates, message grouping by sender
4. **Balance Management**: Prominent display → Easy top-up → Transaction transparency
5. **File Review**: List view → Detail modal → Encrypted file protection indicators

---

## Accessibility

- WCAG AA contrast ratios minimum
- Focus states: ring-2 ring-offset-2 on all interactive elements
- Screen reader labels for icon-only buttons
- Keyboard navigation: Tab order follows visual hierarchy
- ARIA labels for status changes and real-time updates