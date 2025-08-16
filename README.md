# AdGen - AI-Powered Ad Campaign Generator

A modern React application for generating AI-powered advertising campaigns with a beautiful, responsive UI built with TypeScript, Tailwind CSS, and Vite.

## 🚀 Tech Stack

### Frontend Framework
- **React 19.1.1** - Modern React with hooks and functional components
- **TypeScript 5.8.3** - Type-safe JavaScript development
- **Vite 7.1.2** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

### Routing & State Management
- **React Router DOM 7.8.0** - Client-side routing
- **React Hooks** - Built-in state management

### HTTP Client & API
- **Axios 1.11.0** - HTTP client for API requests
- **Date-fns 4.1.0** - Date utility library

### Icons & UI Components
- **Lucide React 0.539.0** - Beautiful icon library

### Development Tools
- **ESLint 9.33.0** - Code linting
- **TypeScript ESLint 8.39.1** - TypeScript-specific linting rules

## 📁 Project Structure

```
admybrand-ai/
├── server/                          # Backend API server
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
└── web/                             # Frontend React application
    ├── public/
    │   └── vite.svg
    │
    ├── src/
    │   ├── components/              # Reusable UI components
    │   │   ├── AdPreviewCard.tsx    # Ad preview with platform badges
    │   │   ├── CampaignForm.tsx     # Campaign creation/editing form
    │   │   ├── CampaignTable.tsx    # Campaign listing table
    │   │   ├── Navbar.tsx           # Navigation header
    │   │   └── Toast.tsx            # Toast notification system
    │   │
    │   ├── pages/                   # Page components
    │   │   ├── DashboardPage.tsx    # Main dashboard with campaign list
    │   │   ├── NewCampaignPage.tsx  # Campaign creation flow
    │   │   └── CampaignDetailPage.tsx # Campaign editing/viewing
    │   │
    │   ├── lib/                     # Utility libraries
    │   │   └── api.ts               # API client and functions
    │   │
    │   ├── types.ts                 # TypeScript type definitions
    │   ├── App.tsx                  # Main application component
    │   ├── main.tsx                 # Application entry point
    │   ├── index.css                # Global styles
    │   └── vite-env.d.ts            # Vite type definitions
    │
    ├── package.json                 # Dependencies and scripts
    ├── package-lock.json
    ├── tailwind.config.js           # Tailwind CSS configuration
    ├── postcss.config.js            # PostCSS configuration
    ├── tsconfig.json                # TypeScript configuration
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts               # Vite build configuration
    └── eslint.config.js             # ESLint configuration
```

## 🎯 Core Features

### 1. Campaign Management
- **Create campaigns** with AI-generated creative content
- **Edit existing campaigns** with real-time preview
- **Delete campaigns** with confirmation dialogs
- **View campaign details** with ad previews

### 2. AI-Powered Content Generation
- **Generate headlines** and descriptions based on product/audience
- **Multiple variants** for A/B testing
- **Platform-specific** ad previews
- **Image URL support** for visual content

### 3. Platform Support
- **Facebook** - Blue theme with official branding
- **Instagram** - Purple/pink gradient theme
- **Google Ads** - Multi-color gradient theme
- **LinkedIn** - Professional blue theme

### 4. User Experience
- **Responsive design** - Mobile-first approach
- **Loading states** - Visual feedback during operations
- **Toast notifications** - Success/error messaging
- **Form validation** - Real-time error handling
- **Dark mode support** - Consistent theming

## 🔧 API Integration

### Base Configuration
- **Base URL**: Configurable via `VITE_API_URL` environment variable
- **Default**: `http://localhost:3000`
- **Content-Type**: `application/json`

### API Endpoints
```typescript
// Campaign Management
GET    /api/campaigns              # List all campaigns
GET    /api/campaigns/:id          # Get specific campaign
POST   /api/campaigns              # Create new campaign
PUT    /api/campaigns/:id          # Update campaign
DELETE /api/campaigns/:id          # Delete campaign

// AI Content Generation
POST   /api/generate               # Generate creative content
```

### Error Handling
- **HTTP status codes** with user-friendly messages
- **Network error handling** with fallback messages
- **Validation errors** with field-specific feedback

## 🎨 UI Components

### AdPreviewCard
- **Platform badges** with official icons and colors
- **Aspect-ratio video** image containers
- **Gradient overlays** for text readability
- **Fallback states** for missing images

### CampaignForm
- **Responsive layout** - Stacked on mobile, two-column on desktop
- **Platform selector** - Clickable pill buttons with icons
- **Form validation** - Required field validation
- **Loading states** - Submit button with spinner

### CampaignTable
- **Responsive design** - Table on desktop, cards on mobile
- **Platform badges** - Color-coded platform indicators
- **Relative timestamps** - Human-readable dates
- **Action buttons** - View and delete operations

### Toast System
- **Context-based** - Global toast management
- **Auto-dismiss** - 5-second timeout
- **Success/Error variants** - Color-coded messaging
- **Fixed positioning** - Top-right corner

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admybrand-ai
   ```

2. **Install frontend dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in web/ directory
   VITE_API_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔧 Configuration Files

### Tailwind CSS (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### TypeScript (tsconfig.json)
- **Strict mode** enabled
- **JSX support** for React
- **Module resolution** configured
- **Path mapping** for clean imports

### Vite (vite.config.ts)
- **React plugin** for JSX support
- **TypeScript support** with type checking
- **Hot module replacement** for development
- **Build optimization** for production

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 640px` - Stacked layout
- **Tablet**: `640px - 1024px` - Two-column layout
- **Desktop**: `> 1024px` - Full layout with sidebars

### Mobile-First Approach
- **Touch-friendly** buttons and inputs
- **Readable text** sizes on small screens
- **Optimized spacing** for mobile devices
- **Card-based layout** for better mobile UX

## 🎯 TypeScript Types

### Core Interfaces
```typescript
export type Platform = "facebook" | "instagram" | "google" | "linkedin";

export interface Campaign {
  _id?: string;
  name: string;
  product: string;
  audience: string;
  budget: number;
  platform: Platform;
  headline?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratePayload {
  product: string;
  audience: string;
}

export interface GenerateResult {
  headline: string;
  description: string;
  variants: string[];
  imageUrl: string;
}
```

## 🔒 Security & Best Practices

### Code Quality
- **ESLint** configuration for code consistency
- **TypeScript** for type safety
- **Prettier** integration for code formatting
- **Git hooks** for pre-commit validation

### Performance
- **Code splitting** with React Router
- **Lazy loading** for better initial load times
- **Optimized builds** with Vite
- **Tree shaking** for smaller bundle sizes

### Accessibility
- **Semantic HTML** structure
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for form interactions

## 🚀 Deployment

### Build Process
1. **Production build**: `npm run build`
2. **Static files** generated in `dist/` directory
3. **Deploy** to any static hosting service

### Environment Variables
- **VITE_API_URL**: Backend API endpoint
- **VITE_APP_TITLE**: Application title
- **VITE_APP_VERSION**: Application version

### Hosting Options
- **Vercel** - Zero-config deployment
- **Netlify** - Static site hosting
- **AWS S3** - Cloud storage hosting
- **GitHub Pages** - Free static hosting

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch
3. **Make** changes with proper TypeScript types
4. **Test** functionality across devices
5. **Submit** pull request

### Code Standards
- **TypeScript** for all new code
- **Functional components** with hooks
- **Tailwind CSS** for styling
- **ESLint** rules compliance
- **Component documentation** with JSDoc

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Issues**: Create GitHub issue
- **Documentation**: Check inline code comments
- **TypeScript**: Use IDE intellisense for type hints

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS** 