import { defineStore } from 'pinia'
import { db } from '../firebase'
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where,
    orderBy,
} from 'firebase/firestore'

export const useStockStore = defineStore('stock', {
    state: () => ({
        loading: false,
        lastUpdates: {}, // State: { productId: { quantity, countDate } }
    }),

    actions: {
        async fetchLastStockUpdates() {
            this.loading = true
            try {
                // Since we now maintain only one record per product, we can just fetch all
                const q = query(collection(db, 'con-stock-updates'))
                const querySnapshot = await getDocs(q)

                const latestUpdates = {}
                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    latestUpdates[data.productId] = {
                        quantity: data.quantity,
                        countDate: data.countDate,
                    }
                })
                this.lastUpdates = latestUpdates
            } catch (error) {
                console.error('Error fetching last stock updates:', error)
            } finally {
                this.loading = false
            }
        },

        async recordStockUpdate(countDate, updates) {
            this.loading = true
            try {
                const stockUpdatesRef = collection(db, 'con-stock-updates')

                // Process each product update
                for (const productId in updates) {
                    const quantity = updates[productId]
                    if (quantity !== null && quantity !== '' && !isNaN(quantity)) {
                        // 1. Check if a record for this productId exists (regardless of countDate)
                        const q = query(stockUpdatesRef, where('productId', '==', productId))
                        const existingSnap = await getDocs(q)

                        if (!existingSnap.empty) {
                            // 2. If exists, update that specific product record
                            const docRef = doc(db, 'con-stock-updates', existingSnap.docs[0].id)
                            await updateDoc(docRef, {
                                quantity: Number(quantity),
                                countDate: countDate, // Update to the new count date
                                updatedAt: serverTimestamp(),
                            })
                        } else {
                            // 3. If not exists, create the first record for this product
                            await addDoc(stockUpdatesRef, {
                                productId: productId,
                                quantity: Number(quantity),
                                countDate: countDate,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp(),
                            })
                        }
                    }
                }

                alert('Stock updated successfully! (1 record per product maintained)')
                await this.fetchLastStockUpdates()
            } catch (error) {
                console.error('Error recording stock update:', error)
                alert('Failed to update stock: ' + error.message)
            } finally {
                this.loading = false
            }
        },
    },
})
