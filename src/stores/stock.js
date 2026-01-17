import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

export const useStockStore = defineStore('stock', {
    state: () => ({
        loading: false,
        lastUpdates: {}, // State ใหม่: { productId: { quantity, countDate } }
    }),

    actions: {
        // Action ใหม่: ดึงข้อมูลการนับครั้งล่าสุดของทุกสินค้า
        async fetchLastStockUpdates() {
            this.loading = true
            try {
                // ดึงข้อมูลทั้งหมดโดยเรียงจากวันที่นับล่าสุดไปเก่าสุด
                const q = query(collection(db, 'con-stock-updates'), orderBy('countDate', 'desc'))
                const querySnapshot = await getDocs(q)

                const latestUpdates = {}
                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    // ถ้ายังไม่เคยบันทึกข้อมูลของ productId นี้ แปลว่าอันนี้คือล่าสุด
                    if (!latestUpdates[data.productId]) {
                        latestUpdates[data.productId] = {
                            quantity: data.quantity,
                            countDate: data.countDate,
                        }
                    }
                })
                this.lastUpdates = latestUpdates
            } catch (error) {
                console.error('Error fetching last stock updates:', error)
            } finally {
                this.loading = false
            }
        },

        // แก้ไข Action เดิม
        async recordStockUpdate(countDate, updates) {
            this.loading = true
            try {
                const batch = []
                for (const productId in updates) {
                    if (Object.hasOwnProperty.call(updates, productId)) {
                        const quantity = updates[productId]
                        // เพิ่มการตรวจสอบว่าเป็นตัวเลขและไม่ว่างเปล่า
                        if (quantity !== null && quantity !== '' && !isNaN(quantity)) {
                            batch.push(
                                addDoc(collection(db, 'con-stock-updates'), {
                                    productId: productId,
                                    quantity: Number(quantity),
                                    countDate: countDate,
                                    createdAt: serverTimestamp(),
                                }),
                            )
                        }
                    }
                }

                if (batch.length === 0) {
                    alert('No valid quantities entered.')
                    return
                }

                await Promise.all(batch)

                alert('Stock updated successfully!')

                // เรียก Action ใหม่เพื่อรีเฟรชข้อมูลล่าสุด
                await this.fetchLastStockUpdates()
            } catch (error) {
                console.error('Error recording stock update:', error)
                alert('Failed to update stock.')
            } finally {
                this.loading = false
            }
        },
    },
})
