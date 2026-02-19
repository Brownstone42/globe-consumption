<template>
    <aside class="menu p-4" style="background-color: #f5f5f5; height: 100%; min-height: 100vh">
        <p class="menu-label">General</p>
        <ul class="menu-list">
            <li>
                <router-link to="/" active-class="is-active">Dashboard</router-link>
            </li>
        </ul>

        <!-- New Info Menu -->
        <p class="menu-label">Info</p>
        <ul class="menu-list">
            <li>
                <router-link to="/info/lt-moq" active-class="is-active">LT & MOQ</router-link>
            </li>
        </ul>

        <!-- New Report Menu -->
        <p class="menu-label">Report</p>
        <ul class="menu-list">
            <li>
                <router-link to="/report/summary" active-class="is-active"
                    >Sales Summary</router-link
                >
            </li>
            <li>
                <router-link to="/report/sales" active-class="is-active"
                    >Customer Sales</router-link
                >
            </li>
        </ul>

        <p class="menu-label">History</p>
        <ul class="menu-list">
            <li>
                <router-link to="/history/sales" active-class="is-active"
                    >Sales History</router-link
                >
            </li>
        </ul>

        <p class="menu-label">Stock</p>
        <ul class="menu-list">
            <li>
                <router-link to="/stock/update" active-class="is-active">Update Stock</router-link>
            </li>
        </ul>

        <p class="menu-label">Purchase Order</p>
        <ul class="menu-list">
            <li>
                <router-link to="/po/add" active-class="is-active">View PO (Sales)</router-link>
            </li>
            <li>
                <router-link to="/po/import" active-class="is-active">Import PO (Excel)</router-link>
            </li>
            <li>
                <router-link to="/po/stock-in" active-class="is-active"
                    >Stock In (Purchase)</router-link
                >
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
