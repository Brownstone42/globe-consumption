import { createRouter, createWebHistory } from 'vue-router'
import Customers from '../views/master/Customers.vue'
import Categories from '../views/master/Categories.vue'
import Products from '../views/master/Products.vue'
import AddPO from '../views/po/AddPO.vue'
import ImportPO from '../views/po/ImportPO.vue'
import AddStockIn from '../views/po/AddStockIn.vue'
import UpdateStock from '../views/stock/UpdateStock.vue'
import MonthlyHistory from '../views/history/MonthlyHistory.vue'
import SalesReport from '../views/report/SalesReport.vue'
import SalesSummary from '../views/report/SalesSummary.vue'

const Dashboard = {
    template: '<h1 class="title">Dashboard Overview</h1><p>Welcome to Stock Management System.</p>',
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: Dashboard },
        { path: '/customers', name: 'customers', component: Customers },
        { path: '/categories', name: 'categories', component: Categories },
        { path: '/products', name: 'products', component: Products },
        { path: '/po/add', name: 'add-po', component: AddPO },
        { path: '/po/import', name: 'import-po', component: ImportPO },
        { path: '/po/stock-in', name: 'stock-in', component: AddStockIn },
        { path: '/stock/update', name: 'update-stock', component: UpdateStock },
        { path: '/history/sales', name: 'sales-history', component: MonthlyHistory },

        // New Report Routes
        {
            path: '/report/sales',
            name: 'sales-report',
            component: SalesReport,
        },
        {
            path: '/report/summary',
            name: 'sales-summary',
            component: SalesSummary,
        },
    ],
})

export default router
