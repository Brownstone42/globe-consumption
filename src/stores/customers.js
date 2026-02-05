import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export const useCustomerStore = defineStore('customers', {
    state: () => ({
        customers: [],
        loading: false,
    }),

    getters: {
        sortedCustomers: (state) => {
            return [...state.customers].sort((a, b) => {
                const nameA = a.name || ''
                const nameB = b.name || ''
                return nameA.localeCompare(nameB, 'th')
            })
        },
        sortedCustomersByCode: (state) => {
            return [...state.customers].sort((a, b) => {
                const codeA = a.code || ''
                const codeB = b.code || ''
                return codeA.localeCompare(codeB, 'th')
            })
        },
    },

    actions: {
        // ดึงข้อมูลลูกค้าทั้งหมด
        async fetchCustomers() {
            this.loading = true
            try {
                const querySnapshot = await getDocs(collection(db, 'con-customers'))
                this.customers = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching customers:', error)
            } finally {
                this.loading = false
            }
        },

        // เพิ่มลูกค้าใหม่
        async addCustomer(customerData) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-customers'), customerData)
                await this.fetchCustomers() // โหลดข้อมูลใหม่
            } catch (error) {
                console.error('Error adding customer:', error)
            } finally {
                this.loading = false
            }
        },

        // แก้ไขข้อมูลลูกค้า
        async updateCustomer(id, customerData) {
            this.loading = true
            try {
                const customerRef = doc(db, 'con-customers', id)
                await updateDoc(customerRef, customerData)
                await this.fetchCustomers()
            } catch (error) {
                console.error('Error updating customer:', error)
            } finally {
                this.loading = false
            }
        },

        // ลบลูกค้า
        async deleteCustomer(id) {
            if (!confirm('Are you sure you want to delete this customer?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-customers', id))
                await this.fetchCustomers()
            } catch (error) {
                console.error('Error deleting customer:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
