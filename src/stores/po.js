import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export const usePoStore = defineStore('po', {
    state: () => ({
        orders: [],
        loading: false,
    }),

    getters: {
        sortedOrders: (state) => {
            return [...state.orders].sort((a, b) => {
                const dateA = new Date(a.date)
                const dateB = new Date(b.date)
                return dateB - dateA // Descending
            })
        },
    },

    actions: {
        async fetchOrders() {
            this.loading = true
            try {
                const querySnapshot = await getDocs(collection(db, 'con-po'))
                this.orders = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching POs:', error)
            } finally {
                this.loading = false
            }
        },

        async addOrder(orderData) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-po'), orderData)
                await this.fetchOrders()
            } catch (error) {
                console.error('Error adding PO:', error)
            } finally {
                this.loading = false
            }
        },

        async updateOrder(id, orderData) {
            this.loading = true
            try {
                const orderRef = doc(db, 'con-po', id)
                await updateDoc(orderRef, orderData)
                await this.fetchOrders()
            } catch (error) {
                console.error('Error updating PO:', error)
            } finally {
                this.loading = false
            }
        },

        async deleteOrder(id) {
            if (!confirm('Are you sure you want to delete this PO?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-po', id))
                await this.fetchOrders()
            } catch (error) {
                console.error('Error deleting PO:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
