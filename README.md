# Afazer - Your Personal Task Manager

A beautiful and intuitive TODO app built with React Native and Expo that works seamlessly across mobile and web platforms.

## Features

- ✅ Add, complete, and delete tasks
- 🔄 Filter tasks by status (All, Active, Completed)
- 💾 Persistent storage using AsyncStorage
- 🎨 Modern and responsive UI design
- 📱 Cross-platform support (iOS, Android, Web)
- 🗑️ Clear completed tasks functionality
- ⌨️ Keyboard-friendly input

## Screenshots

The app features a clean, modern interface with:
- Beautiful header with app branding
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
npx expo export:web
```

#### Mobile Builds
```bash
# For iOS
npx expo build:ios

# For Android
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

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on the repository.

---

Made with ❤️ using React Native and Expo 