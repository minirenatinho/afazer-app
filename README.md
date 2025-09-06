# Afazer - Your Personal Task Manager

A beautiful and intuitive TODO app built with React Native and Expo that works seamlessly across mobile and web platforms.

## Features

- ✅ Add, complete, and delete tasks, products and countries
- 🔄 Filter tasks by category (Priority, On, Off, Pay)
- 💾 Persistent storage using Postgres and AsyncStorage
- 🎨 Modern and responsive UI design
- 📱 Cross-platform support (iOS, Android, Web)
- ⌨️ Keyboard-friendly input

## Screenshots

The app features a clean, modern interface with:
- Beautiful headers
- Intuitive task input with add button
- Filter tabs to organize your tasks
- Card-based task items with checkboxes
- Smooth animations and interactions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd afazer-app
```

2. Install dependencies:
```bash
npm install
```

### Running the App

#### For Web Development
```bash
npm run web
```
This will start the development server and open the app in your default web browser.

#### For Mobile Development

**iOS (requires macOS):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Using Expo Go App:**
```bash
npm start
```
Then scan the QR code with the Expo Go app on your mobile device.

### Building for Production

#### Web Build
```bash
# For Web
eas build -p web
# or
npx expo export:web
```

#### Mobile Builds
```bash
# For iOS
eas build -p ios
# or
npx expo build:ios

# For Android
eas build -p android
# or
npx expo build:android
```

## Project Structure

```
afazer-app/
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── assets/              # Images and static assets
└── README.md           # This file
```

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript
- **AsyncStorage**: Local data persistence
- **Expo Vector Icons**: Beautiful icon library

## Contributing

1. Create a branch
1. Make your changes
3. Test on multiple platforms
4. Submit a pull request

## License

This is free and unencumbered software released into the public domain. For more information, please refer to <https://unlicense.org>

## Support

If you encounter any issues or have questions, please open an issue on the repository.

---

Made with ❤️ using React Native and Expo 