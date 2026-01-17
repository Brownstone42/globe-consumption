import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyA-59Hd3cwKU-IArkorrybzk-bmpCNqAJc',
    authDomain: 'ideal-globe-website.firebaseapp.com',
    projectId: 'ideal-globe-website',
    storageBucket: 'ideal-globe-website.firebasestorage.app',
    messagingSenderId: '1003894705965',
    appId: '1:1003894705965:web:b08d4eadec663f9ff7cda4',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

export { auth, db, provider }
