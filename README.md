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
1. Create a Firebase project here.
2. Set up Firebase Authentication and Firestore.
3. Create a file named .env in the root of the project and add your Firebase configuration (ensure to add .env to .gitignore to keep it secure):

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

## Run the App
Start the Expo development server by running:
```
npx expo start
```

# License
This project is licensed under the MIT License. You can modify and distribute it freely.

Feel free to customize this README file according to your project needs. If you have any questions or issues, feel free to contact me at [teoqixuan99@gmail.com].
