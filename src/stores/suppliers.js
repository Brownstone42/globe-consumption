import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'

export const useSupplierStore = defineStore('suppliers', {
    state: () => ({
        suppliers: [],
        loading: false,
    }),

    actions: {
        async fetchSuppliers() {
            this.loading = true
            try {
                const q = query(collection(db, 'con-suppliers'), orderBy('name', 'asc'))
                const querySnapshot = await getDocs(q)
                this.suppliers = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching suppliers:', error)
            } finally {
                this.loading = false
            }
        },

        async addSupplier(supplierData) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-suppliers'), supplierData)
                await this.fetchSuppliers()
            } catch (error) {
                console.error('Error adding supplier:', error)
            } finally {
                this.loading = false
            }
        },

        async updateSupplier(id, supplierData) {
            this.loading = true
            try {
                const supplierRef = doc(db, 'con-suppliers', id)
                await updateDoc(supplierRef, supplierData)
                await this.fetchSuppliers()
            } catch (error) {
                console.error('Error updating supplier:', error)
            } finally {
                this.loading = false
            }
        },

        async deleteSupplier(id) {
            if (!confirm('Are you sure you want to delete this supplier?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-suppliers', id))
                await this.fetchSuppliers()
            } catch (error) {
                console.error('Error deleting supplier:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
