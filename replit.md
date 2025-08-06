# Overview

Pomotron is a retro-themed Pomodoro timer web application designed to enhance productivity through the Pomodoro Technique. The app combines a nostalgic 1980s synthwave aesthetic with modern productivity features including intention-setting, website blocking, analytics tracking, and multiple visual themes. Built as a Progressive Web App (PWA), it provides both online and offline functionality with features like session history, customizable timer settings, and comprehensive productivity analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## 2025-08-06: Complete Font Integration for macOS App
- Downloaded all three web UI fonts: Orbitron Variable, Inter Variable, ShareTechMono Regular
- Created comprehensive FontManager utility with proper font registration and fallback systems
- Updated all SwiftUI views to use consistent font extensions matching web typography
- Added proper Xcode project configuration and Info.plist for font resources
- Integrated fonts into macOS app bundle with proper TTF format for native rendering
- Applied exact web UI typography hierarchy: Orbitron for headers/titles, Inter for body text, ShareTech Mono for code

## 2025-01-07: macOS Native App Development
- Created complete macOS version of Pomotron using SwiftUI and Xcode
- Implemented advanced website blocking using AppleScript, hosts file modification, and browser control
- Fixed all Xcode project crashes and Swift compilation errors for stable build
- Completed comprehensive UI overhaul to match web version's exact retro synthwave design
- Updated timer display with 140px fonts, cyan-purple gradients, and proper shadow effects
- Modified ContentView with proper retro background gradients and neon grid overlays
- Updated all views (Timer, Analytics, Settings, IntentionModal) with consistent styling:
  * Card layouts with 16px radius, dark backgrounds, and purple border accents
  * Headers with 36px gradient fonts (pink to purple)
  * Buttons with proper colors, shadows, and hover effects
  * Input fields with retro styling and cyan accents
- Aligned color schemes perfectly with web UI: dark purple gradients, cyan/purple accents, proper spacing
- Added comprehensive analytics with Charts framework
- Built custom audio system for retro sound effects using AVAudioEngine
- Fixed macOS audio compatibility issues by removing iOS-specific AVAudioSession APIs
- Added NSSound fallback for reliable audio on macOS
- Resolved all Swift compilation errors for stable Xcode builds
- Included full permission management and setup documentation

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in a Vite-powered single-page application
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface components
- **Styling**: Tailwind CSS with custom CSS variables for theme switching between retro (Starcourt), minimal, and Ghibli themes
- **State Management**: React hooks with local storage persistence for settings, sessions, and user preferences
- **Routing**: Wouter for lightweight client-side routing with support for timer, analytics, and settings views
- **Data Fetching**: TanStack Query for server state management and caching

## Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Development Setup**: Vite middleware integration for hot module replacement and development server
- **API Structure**: RESTful API design with /api prefix for all endpoints
- **Error Handling**: Centralized error middleware with structured error responses
- **Logging**: Custom request logging middleware for API endpoints with response capture

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Local Storage**: Browser localStorage for offline-first data persistence including sessions, settings, and analytics
- **Session Storage**: Browser sessionStorage for temporary state management

## Authentication and Authorization
- **Current State**: Basic user schema defined but not implemented
- **Storage Interface**: Modular storage abstraction with in-memory implementation for development
- **Session Management**: Prepared for PostgreSQL session storage using connect-pg-simple

## Progressive Web App Features
- **Service Worker**: Custom implementation for website blocking functionality during focus sessions
- **Manifest**: Complete PWA manifest with icons, shortcuts, and offline capabilities
- **Caching Strategy**: Static asset caching with dynamic content management
- **Offline Support**: Local storage persistence enables full offline functionality

## Core Timer Logic
- **Timer State Management**: Custom useTimer hook managing Pomodoro cycles with focus/break transitions
- **Settings Integration**: Configurable durations, auto-start, and cycle management
- **Intention Setting**: Modal-based workflow for task and motivation capture before sessions
- **Sound System**: Web Audio API integration for retro-style sound effects and notifications
- **Idle Detection**: Automatic detection and notification of user inactivity during focus sessions

## Website Blocking System
- **Implementation**: Service Worker-based URL interception for blocking distracting websites
- **Activation**: Automatic blocking during focus sessions with unblocking during breaks
- **Configuration**: User-managed blocklist with friction-based override options
- **Browser Integration**: Leverages service worker fetch event handling for seamless blocking

## Analytics and Data Visualization
- **Charts**: Recharts library for responsive data visualization including weekly progress tracking
- **Metrics**: Comprehensive session tracking including completion rates, focus time, and streak calculations
- **Data Export**: Prepared infrastructure for session data export and analysis
- **Real-time Updates**: Live analytics updates based on completed sessions

## Theme System
- **Multi-theme Support**: Three distinct themes (Starcourt retro, minimal, Ghibli) with CSS custom properties
- **Dynamic Switching**: Runtime theme switching with persistence to localStorage
- **Typography**: Google Fonts integration (Orbitron for headers, Inter for body text)
- **Visual Effects**: CSS animations and transitions for enhanced user experience

## Development and Build Process
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled
- **Code Quality**: ESBuild for server-side bundling with external package optimization
- **Environment Management**: Separate development and production configurations with environment variable support