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
    where,
    writeBatch,
} from 'firebase/firestore'

export const useHistoryStore = defineStore('history', {
    state: () => ({
        histories: [],
        loading: false,
    }),

    actions: {
        async fetchHistories() {
            this.loading = true
            try {
                // เรียงตามเดือนล่าสุดก่อน
                const q = query(collection(db, 'con-monthly-sales'), orderBy('month', 'desc'))
                const querySnapshot = await getDocs(q)
                this.histories = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            } catch (error) {
                console.error('Error fetching sales history:', error)
            } finally {
                this.loading = false
            }
        },

        async addHistory(historyData) {
            this.loading = true
            try {
                // บันทึก historyData ที่ส่งมาจาก form ตรงๆ (ซึ่งรวมถึง status ที่คุณเลือก)
                await addDoc(collection(db, 'con-monthly-sales'), historyData)
                await this.fetchHistories()
            } catch (error) {
                console.error('Error adding history:', error)
            } finally {
                this.loading = false
            }
        },

        async updateHistory(id, historyData) {
            this.loading = true
            try {
                const historyRef = doc(db, 'con-monthly-sales', id)
                await updateDoc(historyRef, historyData)
                await this.fetchHistories()
            } catch (error) {
                console.error('Error updating history:', error)
            } finally {
                this.loading = false
            }
        },

        async deleteHistory(id) {
            if (!confirm('Are you sure you want to delete this record?')) return

            this.loading = true
            try {
                await deleteDoc(doc(db, 'con-monthly-sales', id))
                await this.fetchHistories()
            } catch (error) {
                console.error('Error deleting history:', error)
            } finally {
                this.loading = false
            }
        },

        async syncFromPO(targetMonth, previewOnly = true) {
            this.loading = true
            try {
                // 1. Check existing data for this month
                const historyRef = collection(db, 'con-monthly-sales')
                const qExist = query(historyRef, where('month', '==', targetMonth))
                const existingSnapshot = await getDocs(qExist)

                if (existingSnapshot.docs.length > 0 && !previewOnly) {
                    // If data exists and we are in save mode (not preview), we abort as per requirement
                    throw new Error(`Data for ${targetMonth} already exists. Cannot overwrite.`)
                }

                // 2. Query POs in date range
                // targetMonth format: "YYYY-MM"
                const startDate = `${targetMonth}-01`
                // Find last day of month
                const [year, month] = targetMonth.split('-').map(Number)
                const lastDay = new Date(year, month, 0).getDate()
                const endDate = `${targetMonth}-${lastDay}`

                const poRef = collection(db, 'con-po')
                const qPO = query(
                    poRef,
                    where('date', '>=', startDate),
                    where('date', '<=', endDate),
                )
                const poSnapshot = await getDocs(qPO)

                // 3. Aggregate Data
                // Map Key: "customerId_productId" -> Quantity
                const aggMap = {}
                let poCount = 0

                poSnapshot.forEach((doc) => {
                    const po = doc.data()
                    poCount++

                    // Handle Single Item Structure (current implementation)
                    if (po.productId && po.customerId) {
                        const key = `${po.customerId}_${po.productId}`
                        if (!aggMap[key]) {
                            aggMap[key] = {
                                customerId: po.customerId,
                                productId: po.productId,
                                quantity: 0,
                            }
                        }
                        aggMap[key].quantity += Number(po.quantity) || 0
                    }

                    // Fallback: Handle potential array structure (if exists in future)
                    else if (po.items && Array.isArray(po.items)) {
                        po.items.forEach((item) => {
                            const key = `${po.customerId}_${item.productId}`
                            if (!aggMap[key]) {
                                aggMap[key] = {
                                    customerId: po.customerId,
                                    productId: item.productId,
                                    quantity: 0,
                                }
                            }
                            aggMap[key].quantity += Number(item.quantity) || 0
                        })
                    }
                })

                const results = Object.values(aggMap).map((item) => ({
                    ...item,
                    month: targetMonth,
                    status: 'active', // สำหรับการ sync จาก PO ให้เป็น active โดยปริยาย
                }))

                if (previewOnly) {
                    return {
                        poCount,
                        records: results,
                        existingCount: existingSnapshot.docs.length,
                    }
                }

                // 4. Save to Database (Batch write)
                // We only reach here if existingSnapshot.docs.length === 0 based on requirement
                if (results.length > 0) {
                    const batch = writeBatch(db)
                    results.forEach((record) => {
                        const docRef = doc(collection(db, 'con-monthly-sales'))
                        batch.set(docRef, record)
                    })
                    await batch.commit()
                    await this.fetchHistories()
                }

                return { success: true, count: results.length }
            } catch (error) {
                console.error('Error syncing from PO:', error)
                throw error
            } finally {
                this.loading = false
            }
        },
    },
})
