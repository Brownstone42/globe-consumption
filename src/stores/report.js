import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

// Helper function to get dates for the last 12 months (Local Time Safe)
const getLast12Months = () => {
    const months = []
    const date = new Date()
    date.setDate(1) // Start from the 1st of the current month

    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        months.push(`${year}-${month}`) // "YYYY-MM"
        // Go back one month
        date.setMonth(date.getMonth() - 1)
    }
    return months.reverse() // Oldest first
}

export const useReportStore = defineStore('report', {
    state: () => ({
        loading: false,
        reportData: null, // { customerName: { month: { quantity, isInactive } } }
        currentStock: 0,
        monthHeaders: [],
    }),

    actions: {
        async generateSalesReport(productId) {
            if (!productId) {
                this.reportData = null
                return
            }

            this.loading = true
            this.reportData = null

            try {
                // 1. Get all customers to build rows
                const customerSnap = await getDocs(collection(db, 'con-customers'))
                const customers = customerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                const customerMap = new Map(customers.map((c) => [c.id, c.name]))

                // 2. Define date range (Local Time Safe)
                const today = new Date()
                const currentYear = today.getFullYear()
                const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
                const currentMonthStr = `${currentYear}-${currentMonth}` // "YYYY-MM"

                const reportMonths = getLast12Months()
                this.monthHeaders = reportMonths

                // 3. Fetch data
                // 3a. Past months from Sales History
                const historyQuery = query(
                    collection(db, 'con-monthly-sales'),
                    where('productId', '==', productId),
                    where(
                        'month',
                        'in',
                        reportMonths.filter((m) => m !== currentMonthStr),
                    ),
                )
                const historySnap = await getDocs(historyQuery)
                const historyData = historySnap.docs.map((doc) => doc.data())

                // 3b. Current month from Purchase Orders (Sales)
                const startOfMonthStr = `${currentYear}-${currentMonth}-01`
                const poQuery = query(
                    collection(db, 'con-po'),
                    where('productId', '==', productId),
                    where('date', '>=', startOfMonthStr),
                )
                const poSnap = await getDocs(poQuery)
                const poData = poSnap.docs.map((doc) => doc.data())

                // 4. Process and aggregate data
                const aggregatedData = new Map()

                // Process history data
                historyData.forEach((rec) => {
                    const customerName = customerMap.get(rec.customerId) || 'Unknown Customer'
                    if (!aggregatedData.has(customerName)) {
                        aggregatedData.set(customerName, {})
                    }

                    // If multiple records for same month (should not happen normally but handle it)
                    const current = aggregatedData.get(customerName)[rec.month] || {
                        quantity: 0,
                        isInactive: false,
                    }

                    aggregatedData.get(customerName)[rec.month] = {
                        quantity: current.quantity + rec.quantity,
                        isInactive: current.isInactive || rec.status === 'inactive',
                    }
                })

                // Process current month PO data
                poData.forEach((po) => {
                    const customerName = customerMap.get(po.customerId) || 'Unknown Customer'
                    if (!aggregatedData.has(customerName)) {
                        aggregatedData.set(customerName, {})
                    }
                    const current = aggregatedData.get(customerName)[currentMonthStr] || {
                        quantity: 0,
                        isInactive: false,
                    }

                    aggregatedData.get(customerName)[currentMonthStr] = {
                        quantity: current.quantity + po.quantity,
                        isInactive: false, // PO is always active as it's real sale
                    }
                })

                this.reportData = Object.fromEntries(aggregatedData.entries())

                // 5. Calculate Current Stock
                await this.calculateCurrentStock(productId)
            } catch (error) {
                console.error('Error generating sales report:', error)
                alert('Failed to generate report.')
            } finally {
                this.loading = false
            }
        },

        async calculateCurrentStock(productId) {
            // 5a. Get the latest stock update
            const stockUpdateQuery = query(
                collection(db, 'con-stock-updates'),
                where('productId', '==', productId),
                orderBy('countDate', 'desc'),
                limit(1),
            )
            const stockUpdateSnap = await getDocs(stockUpdateQuery)

            if (stockUpdateSnap.empty) {
                this.currentStock = 'N/A'
                return
            }

            const lastUpdate = stockUpdateSnap.docs[0].data()
            let stock = lastUpdate.quantity

            // Safe date handling
            let countDate = lastUpdate.countDate
            if (countDate && typeof countDate.toDate === 'function') {
                const d = countDate.toDate()
                const year = d.getFullYear()
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const day = String(d.getDate()).padStart(2, '0')
                countDate = `${year}-${month}-${day}`
            } else if (countDate instanceof Date) {
                const year = countDate.getFullYear()
                const month = String(countDate.getMonth() + 1).padStart(2, '0')
                const day = String(countDate.getDate()).padStart(2, '0')
                countDate = `${year}-${month}-${day}`
            }

            if (typeof countDate !== 'string') {
                this.currentStock = 'Error (Date)'
                return
            }

            const countMonth = countDate.slice(0, 7)

            try {
                // 5b. Fetch Sales History for months > countMonth
                const historyQuery = query(
                    collection(db, 'con-monthly-sales'),
                    where('productId', '==', productId),
                    where('month', '>', countMonth),
                )
                const historySnap = await getDocs(historyQuery)
                const historyMap = {}
                historySnap.forEach((doc) => {
                    const data = doc.data()
                    historyMap[data.month] = (historyMap[data.month] || 0) + data.quantity
                })

                // 5c. Fetch Sales POs after countDate
                const salesPoQuery = query(
                    collection(db, 'con-po'),
                    where('productId', '==', productId),
                    where('date', '>', countDate),
                )
                const salesPoSnap = await getDocs(salesPoQuery)
                const salesByMonth = {}
                salesPoSnap.forEach((doc) => {
                    const data = doc.data()
                    const m = data.date.slice(0, 7)
                    salesByMonth[m] = (salesByMonth[m] || 0) + data.quantity
                })

                // 5d. Fetch STOCK IN (Purchases) after countDate
                const stockInQuery = query(
                    collection(db, 'con-stock-in'),
                    where('productId', '==', productId),
                    where('date', '>', countDate),
                )
                const stockInSnap = await getDocs(stockInQuery)
                let totalStockIn = 0
                stockInSnap.forEach((doc) => {
                    totalStockIn += doc.data().quantity
                })

                // --- Calculate Final Stock ---

                // Add Stock In
                stock += totalStockIn

                // Subtract Sales from the count month
                if (salesByMonth[countMonth]) {
                    stock -= salesByMonth[countMonth]
                }

                // Subtract Sales from future months
                const futureMonths = new Set([
                    ...Object.keys(historyMap),
                    ...Object.keys(salesByMonth).filter((m) => m > countMonth),
                ])

                futureMonths.forEach((m) => {
                    if (historyMap[m] !== undefined) {
                        stock -= historyMap[m]
                    } else if (salesByMonth[m] !== undefined) {
                        stock -= salesByMonth[m]
                    }
                })

                this.currentStock = stock
            } catch (error) {
                console.error('Error calculating stock:', error)
                this.currentStock = 'Error'
            }
        },
    },
})
