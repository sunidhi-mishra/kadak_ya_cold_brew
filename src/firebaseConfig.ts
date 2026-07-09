import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replace the configuration below with your Firebase Project Configuration details.
// You can obtain this configuration in the Firebase Console -> Project Settings -> General -> Web Apps.
const firebaseConfig = {
  apiKey: "AIzaSyApx4WuGOQRDnhk-32amUeVo8-7JjFjUKw",
  authDomain: "kadakyacoldbrew.firebaseapp.com",
  databaseURL: "https://kadakyacoldbrew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kadakyacoldbrew",
  storageBucket: "kadakyacoldbrew.firebasestorage.app",
  messagingSenderId: "1051866455145",
  appId: "1:1051866455145:web:00eca4d6ee6937971196f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export
export const db = getDatabase(app);
