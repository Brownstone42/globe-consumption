import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export const useProductStore = defineStore('products', {
    state: () => ({
        products: [],
        loading: false,
    }),

    actions: {
        async fetchProducts() {
            this.loading = true
            try {
                const querySnapshot = await getDocs(collection(db, 'con-products'))
                this.products = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                this.loading = false
            }
        },

        async addProduct(productData) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-products'), productData)
                await this.fetchProducts()
            } catch (error) {
                console.error('Error adding product:', error)
            } finally {
                this.loading = false
            }
        },

        async updateProduct(id, productData) {
            this.loading = true
            try {
                const productRef = doc(db, 'con-products', id)
                await updateDoc(productRef, productData)
                await this.fetchProducts()
            } catch (error) {
                console.error('Error updating product:', error)
            } finally {
                this.loading = false
            }
        },

        async deleteProduct(id) {
            if (!confirm('Are you sure you want to delete this product?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-products', id))
                await this.fetchProducts()
            } catch (error) {
                console.error('Error deleting product:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
