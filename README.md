# NotesSummarizer Mobile App

A React Native Expo app that transforms various content types (PDFs, websites, URLs, text) into clear, concise summaries.

## Features

- **Multi-format Support**: Upload PDFs, add websites, paste URLs, or input text
- **Smart Summarization**: AI-powered content summarization with key points extraction
- **Modern UI**: Clean, intuitive interface with beautiful design
- **Document Management**: Organize and manage your documents and summaries
- **Search & Filter**: Find your content quickly with search functionality
- **Export & Share**: Share summaries and export content

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **TypeScript**: Full type safety
- **Icons**: Expo Vector Icons (Ionicons)
- **File Handling**: Expo Document Picker & File System
- **Storage**: AsyncStorage for local data
- **Backend Integration**: Ready for Supabase, Vercel, and Stripe

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── HomeScreen.tsx
│   ├── AddDocumentScreen.tsx
│   ├── DocumentsScreen.tsx
│   ├── SummariesScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── DocumentDetailScreen.tsx
│   └── SummaryDetailScreen.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── services/          # API services (to be implemented)
├── types/            # TypeScript type definitions
│   └── index.ts
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NotesSummarizer-Mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## App Screens

### Home Screen
- Welcome dashboard with quick actions
- Recent activity overview
- Usage statistics
- Quick access to add documents

### Add Document Screen
- Multiple upload options (PDF, Website, URL, Text)
- File picker integration
- URL validation
- Supported format information

### Documents Screen
- List of all uploaded documents
- Search functionality
- Document type indicators
- Quick access to document details

### Summaries Screen
- List of generated summaries
- Search and filter options
- Summary previews with key points
- Quick access to summary details

### Profile Screen
- User information and subscription status
- Usage statistics
- App settings and preferences
- Account management options

## Backend Integration (Coming Soon)

The app is designed to integrate with:

- **Supabase**: Database and authentication
- **Vercel**: API deployment and hosting
- **Stripe**: Payment processing and subscriptions

## Development Status

- ✅ Project setup and navigation
- ✅ UI components and screens
- ✅ TypeScript types
- ✅ File upload functionality
- 🔄 Backend integration (in progress)
- 🔄 API services implementation
- 🔄 Authentication system
- 🔄 Payment integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
