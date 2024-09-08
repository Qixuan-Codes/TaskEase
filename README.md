# TaskEase
TaskEase is a productivity application designed to help users efficiently manage their daily tasks. The app allows users to create tasks, organize them by priority, break them down into subtasks, and track progress. By integrating gamification elements such as points for task completion and daily challenges, TaskEase motivates users to stay on top of their goals. It also features reminders and notifications to ensure users don’t miss important deadlines.

The application is built using React Native for cross-platform compatibility (iOS and Android) and leverages Firebase for real-time data storage and user authentication.

# Key Features
- Task Management: Add, edit, and delete tasks with titles, descriptions, priorities, tags, and due dates.
- Subtask Management: Break tasks down into smaller, more manageable subtasks.
- Reminders and Notifications: Get notified before task deadlines and receive daily summary notifications.
- Gamification: Earn points for task completion and daily login streaks. Complete daily challenges for bonus points.
- Theme Support: Light and dark themes to suit user preferences.
- Calendar Integration: View tasks in a calendar format for easy scheduling and planning.
- Real-Time Syncing: Sync tasks across devices with Firebase real-time database.

# Installation and Setup
## Prerequisites
Before you can run TaskEase, you need to have the following installed on your system:
- Node.js (version 14.x or higher)
- Expo CLI (for running React Native apps)
- Firebase Account and Project setup

## Clone the Repository
To get started, clone this repository to your local machine:
```
git clone https://github.com/Qixuan-Codes/TaskEase.git
cd TaskEase
```

## Install Dependencies
Once inside the project directory, install the necessary dependencies:
```
npm install
```

## Firebase Setup
1. Create a Firebase project.
2. Set up Firebase Authentication and Real-Time Database.
3. Create a file named .env in the root of the project and add your Firebase configuration (ensure to add .env to .gitignore to keep it secure):

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_DATABASE_URL=your-database-url
```

## Run The App
Start the Expo development server by running:
```
npx expo start
```
To run the app on Android or iOS emulator:
- Android: press **a** after running to open the app in an Android emulator. (You will need to have Android Studio installed)
- iOS: press **i** after running to open the app in an iOS emulator. (Only for Apple devices)

Alternatively, you can scan the QR code provided by Expo using the Expo Go app on your mobile phone to run the app directly on your device

## Build the App
You can run your app in the Expo development environment or generate builds for Android/iOS using the following commands:

1. Install Expo CLI: If you haven't installed Expo CLI yet, run the following command:
```
npm install -g expo-cli
```

2. Login to Expo: Make sure you're logged in to your Expo account, If you're not, log in using:
```
expo login
```

3. Install EAS CLI: Install EAS CLI globally if you haven't:
```
npm install -g eas-cli
```

4. Initialise EAS in the project directory, run:
```
eas build:configure
```

For Android run the following:
```
eas build --platform android
```

For iOS run the following:
```
eas build --platform ios
```

# License
This project is licensed under the MIT License. You can modify and distribute it freely.

Feel free to customize this README file according to your project needs. If you have any questions or issues, feel free to contact me at [teoqixuan99@gmail.com].