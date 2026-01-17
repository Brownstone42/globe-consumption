import { defineStore } from 'pinia'
import { auth, provider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
    }),

    actions: {
        initAuth() {
            onAuthStateChanged(auth, (currentUser) => {
                this.user = currentUser
            })
        },
        async login() {
            try {
                await signInWithPopup(auth, provider)
            } catch (error) {
                console.error('Login failed:', error)
            }
        },
        async logout() {
            try {
                await signOut(auth)
            } catch (error) {
                console.error('Logout failed:', error)
            }
        },
    },
})
