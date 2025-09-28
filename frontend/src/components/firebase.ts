import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  deleteObject,
  listAll,
  getDownloadURL,
  type FirebaseStorage,
  type ListResult,
  type StorageReference,
} from "firebase/storage";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// ---- Types ----
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
  messagingSenderId: string;
};

export type UserFile = { name: string; url: string };
export type UserRole = "patient" | "doctor";

export type PatientHistoryData = {
  firstName: string;
  lastName: string;
  birthday: string;
  phone: string;
  email: string;
  address: string;
  sex: string;
  emergencyName: string;
  relationship: string;
  emergencyPhone: string;
  insurance: string;
  currentMedications: string;
  allergies: string;
  pastSurgeries: string;
  familyHistory: string;
  lifestyle: string;
};

// ---- Env typings (Vite) ----
declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// ---- Config ----
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// ---- App (singleton for HMR/dev) ----
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ---- Auth ----
export const auth: Auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}
export { onAuthStateChanged };

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ---- Firestore (roles) ----
export const db = getFirestore(app);

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const d = await getDoc(doc(db, "users", uid));
  return (d.exists() ? (d.data().role as UserRole) : null) ?? null;
}

export async function setUserRole(uid: string, role: UserRole) {
  await setDoc(
    doc(db, "users", uid),
    { role, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }
  );
}

export async function savePatientHistory(uid: string, patientData: PatientHistoryData) {
  await setDoc(
    doc(db, "patientHistory", uid),
    { ...patientData, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getPatientData(uid: string) {
  try {
    const docRef = doc(db, "patients", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Remove Firebase metadata for cleaner output
      const { updatedAt, createdAt, uid: docUid, ...patientData } = data;
      void updatedAt; void createdAt; void docUid; // Acknowledge unused variables
      return patientData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return null;
  }
}

export async function getQuestionnaireData(uid: string) {
  try {
    const docRef = doc(db, "questionnaires", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // ✅ Return the nested 'answers' object directly
      return docSnap.data().answers || null; 
    }
    return null;
  } catch (error) {
    console.error("Error fetching questionnaire data:", error);
    return null;
  }
}

// ---- Storage (bind explicitly to your bucket) ----
const bucketUrl = `gs://${firebaseConfig.storageBucket}`;
export const storage: FirebaseStorage = getStorage(app, bucketUrl);

// ---- Storage helpers ----
export async function uploadFile(uid: string, file: File): Promise<string> {
  if (!uid || !file) throw new Error("Missing uid or file");
  const path = `uploads/${uid}/${Date.now()}-${file.name}`;
  const fileRef: StorageReference = ref(storage, path);
  await uploadBytes(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  return getDownloadURL(fileRef);
}

export async function deleteFile(uid: string, fileName: string): Promise<void> {
  if (!uid || !fileName) throw new Error("Missing uid or fileName");
  const fileRef = ref(storage, `uploads/${uid}/${fileName}`);
  await deleteObject(fileRef);
}

export async function fetchUserFiles(uid: string): Promise<UserFile[]> {
  if (!uid) throw new Error("Missing uid");
  const folderRef = ref(storage, `uploads/${uid}`);
  const { items }: ListResult = await listAll(folderRef);
  return Promise.all(
    items.map(async (itemRef) => ({
      name: itemRef.name,
      url: await getDownloadURL(itemRef),
    }))
  );
}

// ---- Re-exports ----
export { ref, listAll, getDownloadURL, uploadBytes };
