import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

// Helper function to get dates for the last 12 months
const getLast12Months = () => {
    const months = []
    const date = new Date()
    date.setDate(1)

    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        months.push(`${year}-${month}`)
        date.setMonth(date.getMonth() - 1)
    }
    return months.reverse()
}

// Helper to normalize date to YYYY-MM-DD string
const normalizeDate = (dateVal) => {
    if (!dateVal) return null
    let date = dateVal
    if (typeof dateVal.toDate === 'function') {
        date = dateVal.toDate()
    } else if (!(dateVal instanceof Date)) {
        date = new Date(dateVal)
    }
    if (isNaN(date.getTime())) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const useSummaryReportStore = defineStore('summaryReport', {
    state: () => ({
        loading: false,
        summaryData: [], // Array of { id, name, categoryId, categoryName, stock, sales: { "YYYY-MM": qty } }
        monthHeaders: [],
    }),

    actions: {
        async generateSummaryReport() {
            this.loading = true
            this.summaryData = []

            try {
                const reportMonths = getLast12Months()
                this.monthHeaders = reportMonths
                const currentMonthStr = reportMonths[reportMonths.length - 1]

                // 1. Fetch Customers (We need all of them now for mapping names/IDs)
                const customerSnap = await getDocs(collection(db, 'con-customers'))
                // No longer filtering active customers at this level
                const allCustomerMap = {}
                customerSnap.docs.forEach((doc) => {
                    allCustomerMap[doc.id] = doc.data()
                })

                // 2. Fetch Categories
                const categorySnap = await getDocs(collection(db, 'con-categories'))
                const categories = categorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

                // 3. Fetch Products
                const productSnap = await getDocs(collection(db, 'con-products'))
                const products = productSnap.docs.map((doc) => {
                    const data = doc.data()
                    let catId = data.categoryId
                    if (catId && typeof catId !== 'string' && catId.id) {
                        catId = catId.id
                    }
                    return { id: doc.id, ...data, categoryId: catId }
                })

                // 4. Fetch Sales History for the target months
                const historyQuery = query(
                    collection(db, 'con-monthly-sales'),
                    where('month', '>=', reportMonths[0]),
                    where('month', '<=', reportMonths[reportMonths.length - 1]),
                )
                const historySnap = await getDocs(historyQuery)
                const historyData = historySnap.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter((h) => h.status !== 'inactive') // NEW LOGIC: Filter based on record status, not customer status

                // 5. Fetch All Current Month POs
                const startOfMonthStr = `${currentMonthStr}-01`
                const poQuery = query(
                    collection(db, 'con-po'),
                    where('date', '>=', startOfMonthStr),
                )
                const poSnap = await getDocs(poQuery)
                const poData = poSnap.docs.map((doc) => doc.data()) // No filter by active customer, include all current month POs

                // 6. Fetch Stock Updates for all products
                const stockUpdatesQuery = query(
                    collection(db, 'con-stock-updates'),
                    orderBy('countDate', 'desc'),
                )
                const stockUpdatesSnap = await getDocs(stockUpdatesQuery)
                const latestStockUpdates = {}
                stockUpdatesSnap.forEach((doc) => {
                    const d = doc.data()
                    if (!latestStockUpdates[d.productId]) {
                        latestStockUpdates[d.productId] = d
                    }
                })

                // 7. Fetch all Stock In, POs, and History for accurate stock calculation
                const [allStockInSnap, allPoSnap, allHistorySnap] = await Promise.all([
                    getDocs(collection(db, 'con-stock-in')),
                    getDocs(collection(db, 'con-po')),
                    getDocs(collection(db, 'con-monthly-sales')),
                ])

                const allStockInData = allStockInSnap.docs.map((doc) => doc.data())
                const allPoData = allPoSnap.docs.map((doc) => doc.data())
                const allHistoryData = allHistorySnap.docs.map((doc) => doc.data())

                // Helper to calculate stock for a product (Physical stock is always subtracted regardless of "active/inactive" status in report)
                const calculateStock = (productId) => {
                    const lastUpdate = latestStockUpdates[productId]
                    if (!lastUpdate) return 'N/A'

                    let stock = lastUpdate.quantity
                    let countDate = normalizeDate(lastUpdate.countDate)

                    if (!countDate) return 'N/A'
                    const countMonth = countDate.slice(0, 7)

                    allStockInData
                        .filter(
                            (si) =>
                                si.productId === productId && normalizeDate(si.date) > countDate,
                        )
                        .forEach((si) => (stock += si.quantity))

                    allHistoryData
                        .filter((h) => h.productId === productId && h.month > countMonth)
                        .forEach((h) => (stock -= h.quantity))

                    allPoData
                        .filter((po) => po.productId === productId)
                        .forEach((po) => {
                            const normalizedPoDate = normalizeDate(po.date)
                            if (!normalizedPoDate) return
                            const m = normalizedPoDate.slice(0, 7)
                            if (m === countMonth) {
                                if (normalizedPoDate > countDate) stock -= po.quantity
                            } else if (m > countMonth) {
                                stock -= po.quantity
                            }
                        })

                    return stock
                }

                // 8. Aggregate Data for all products
                const productSummary = products.map((p) => {
                    const sales = {}
                    reportMonths.forEach((m) => (sales[m] = 0))

                    // Add history sales (only those not marked inactive)
                    historyData
                        .filter((h) => h.productId === p.id)
                        .forEach((h) => {
                            if (sales[h.month] !== undefined) {
                                sales[h.month] += h.quantity
                            }
                        })

                    // Add current month POs
                    poData
                        .filter((po) => po.productId === p.id)
                        .forEach((po) => {
                            const normalizedPoDate = normalizeDate(po.date)
                            if (normalizedPoDate) {
                                const m = normalizedPoDate.slice(0, 7)
                                if (sales[m] !== undefined) {
                                    sales[m] += po.quantity
                                }
                            }
                        })

                    return {
                        id: p.id,
                        name: p.name,
                        categoryId: p.categoryId,
                        categoryName: categoryMap.get(p.categoryId) || 'Unknown',
                        stock: calculateStock(p.id),
                        sales: sales,
                    }
                })

                this.summaryData = productSummary.sort((a, b) => a.name.localeCompare(b.name, 'th'))
            } catch (error) {
                console.error('Error generating summary report:', error)
                alert('Failed to generate summary report: ' + error.message)
            } finally {
                this.loading = false
            }
        },
    },
})
