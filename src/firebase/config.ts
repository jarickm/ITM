import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogleWorkspace = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Workspace sign in error:', err);
    throw err;
  }
};

export const logoutGoogleWorkspace = async (): Promise<void> => {
  await signOut(auth);
};

export const initWorkspaceAuthListener = (onUserChange: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    onUserChange(user);
  });
};
