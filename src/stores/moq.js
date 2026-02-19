import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'

export const useMoqStore = defineStore('moq', {
    state: () => ({
        moqList: [],
        loading: false
    }),
    actions: {
        async fetchMoqList() {
            this.loading = true
            try {
                const q = query(collection(db, 'con-moq'), orderBy('createdAt', 'desc'))
                const querySnapshot = await getDocs(q)
                this.moqList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            } catch (error) {
                console.error('Error fetching MOQ list:', error)
            } finally {
                this.loading = false
            }
        },
        async addMoq(data) {
            try {
                const docRef = await addDoc(collection(db, 'con-moq'), {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })
                this.moqList.unshift({
                    id: docRef.id,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
            } catch (error) {
                console.error('Error adding MOQ:', error)
                throw error
            }
        },
        async updateMoq(id, data) {
            try {
                const docRef = doc(db, 'con-moq', id)
                await updateDoc(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                })
                const index = this.moqList.findIndex(item => item.id === id)
                if (index !== -1) {
                    this.moqList[index] = { ...this.moqList[index], ...data, updatedAt: new Date() }
                }
            } catch (error) {
                console.error('Error updating MOQ:', error)
                throw error
            }
        },
        async deleteMoq(id) {
            try {
                await deleteDoc(doc(db, 'con-moq', id))
                this.moqList = this.moqList.filter(item => item.id !== id)
            } catch (error) {
                console.error('Error deleting MOQ:', error)
                throw error
            }
        }
    }
})
