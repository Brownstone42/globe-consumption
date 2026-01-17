import { createRouter, createWebHistory } from 'vue-router'
import Customers from '../views/master/Customers.vue'
import Categories from '../views/master/Categories.vue'
import Products from '../views/master/Products.vue'
import AddPO from '../views/po/AddPO.vue'
import UpdateStock from '../views/stock/UpdateStock.vue' // เพิ่ม Import

const Dashboard = {
    template: '<h1 class="title">Dashboard Overview</h1><p>Welcome to Stock Management System.</p>',
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // ... (routes เดิม)
        {
            path: '/customers',
            name: 'customers',
            component: Customers,
        },
        {
            path: '/categories',
            name: 'categories',
            component: Categories,
        },
        {
            path: '/products',
            name: 'products',
            component: Products,
        },
        {
            path: '/po/add',
            name: 'add-po',
            component: AddPO,
        },
        // เพิ่ม Route นี้
        {
            path: '/stock/update',
            name: 'update-stock',
            component: UpdateStock,
        },
    ],
})

export default router
