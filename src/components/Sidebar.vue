<template>
    <aside class="menu p-4" style="background-color: #f5f5f5; height: 100%; min-height: 100vh">
        <p class="menu-label">General</p>
        <ul class="menu-list">
            <li>
                <router-link to="/" active-class="is-active">Dashboard</router-link>
            </li>
        </ul>

        <!-- เพิ่มส่วนนี้ -->
        <p class="menu-label">Stock</p>
        <ul class="menu-list">
            <li>
                <router-link to="/stock/update" active-class="is-active">Update Stock</router-link>
            </li>
        </ul>
        <!-- จบส่วนที่เพิ่ม -->

        <p class="menu-label">Purchase Order</p>
        <ul class="menu-list">
            <li>
                <router-link to="/po/add" active-class="is-active">Add PO</router-link>
            </li>
        </ul>

        <p class="menu-label">Master Data</p>
        <ul class="menu-list">
            <li>
                <router-link to="/customers" active-class="is-active">Customers</router-link>
            </li>
            <li>
                <router-link to="/categories" active-class="is-active">Categories</router-link>
            </li>
            <li>
                <router-link to="/products" active-class="is-active">Products</router-link>
            </li>
        </ul>
    </aside>
</template>

<script>
export default {
    name: 'Sidebar',
}
</script>

<style scoped>
.menu-list a.is-active {
    background-color: #00d1b2;
    color: #fff;
}
</style>
