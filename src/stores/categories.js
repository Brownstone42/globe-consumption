import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export const useCategoryStore = defineStore('categories', {
    state: () => ({
        categories: [],
        loading: false,
    }),

    actions: {
        // ดึงข้อมูลหมวดหมู่ทั้งหมด
        async fetchCategories() {
            this.loading = true
            try {
                const querySnapshot = await getDocs(collection(db, 'con-categories'))
                this.categories = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                this.loading = false
            }
        },

        // เพิ่มหมวดหมู่ใหม่
        async addCategory(categoryData) {
            this.loading = true
            try {
                await addDoc(collection(db, 'con-categories'), categoryData)
                await this.fetchCategories()
            } catch (error) {
                console.error('Error adding category:', error)
            } finally {
                this.loading = false
            }
        },

        // แก้ไขหมวดหมู่
        async updateCategory(id, categoryData) {
            this.loading = true
            try {
                const categoryRef = doc(db, 'con-categories', id)
                await updateDoc(categoryRef, categoryData)
                await this.fetchCategories()
            } catch (error) {
                console.error('Error updating category:', error)
            } finally {
                this.loading = false
            }
        },

        // ลบหมวดหมู่
        async deleteCategory(id) {
            if (!confirm('Are you sure you want to delete this category?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-categories', id))
                await this.fetchCategories()
            } catch (error) {
                console.error('Error deleting category:', error)
            } finally {
                this.loading = false
            }
        },
    },
})
