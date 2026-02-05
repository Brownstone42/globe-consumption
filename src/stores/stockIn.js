import { defineStore } from 'pinia'
import { db } from '../firebase'
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
} from 'firebase/firestore'

export const useStockInStore = defineStore('stockIn', {
    state: () => ({
        stockInRecords: [],
        loading: false,
    }),

    actions: {
        async fetchStockInRecords() {
            this.loading = true
            try {
                const q = query(collection(db, 'con-stock-in'), orderBy('date', 'desc'))
                const querySnapshot = await getDocs(q)
                this.stockInRecords = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching stock-in records:', error)
            } finally {
                this.loading = false
            }
        },

        async addStockIn(data) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-stock-in'), data)
                await this.fetchStockInRecords()
            } catch (error) {
                console.error('Error adding stock-in record:', error)
            } finally {
                this.loading = false
            }
        },

        async updateStockIn(id, data) {
            this.loading = true
            try {
                const docRef = doc(db, 'con-stock-in', id)
                await updateDoc(docRef, data)
                await this.fetchStockInRecords()
            } catch (error) {
                console.error('Error updating stock-in record:', error)
            } finally {
                this.loading = false
            }
        },

        async deleteStockIn(id) {
            if (!confirm('Are you sure you want to delete this record?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-stock-in', id))
                await this.fetchStockInRecords()
            } catch (error) {
                console.error('Error deleting stock-in record:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
