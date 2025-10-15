import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "./config";

function ensureFirebaseApp() {
  if (!getApps().length) {
    const config = getFirebaseConfig();
    return initializeApp(config);
  }
  return getApp();
}

export function getFirebaseApp() {
  return ensureFirebaseApp();
}


export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDatabase() {
  return getDatabase(getFirebaseApp());
}
