<template>
    <div>
        <h1 class="title is-4">Sales Summary Report</h1>

        <!-- Controls -->
        <div class="box mb-5">
            <div class="columns is-multiline">
                <!-- Category Filter -->
                <div class="column is-one-quarter">
                    <div class="field">
                        <label class="label">Filter by Category</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="filterCategory">
                                    <option value="all">All Categories</option>
                                    <option
                                        v-for="cat in categoryStore.categories"
                                        :key="cat.id"
                                        :value="cat.id"
                                    >
                                        {{ cat.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Supplier Filter -->
                <div class="column is-one-quarter">
                    <div class="field">
                        <label class="label">Filter by Supplier</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="filterSupplier">
                                    <option value="all">All Suppliers</option>
                                    <option
                                        v-for="sup in supplierStore.suppliers"
                                        :key="sup.id"
                                        :value="sup.id"
                                    >
                                        {{ sup.name }} ({{ sup.country }})
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Product Filter (Search) -->
                <div class="column is-half">
                    <div class="field">
                        <label class="label">Search Product</label>
                        <div class="control has-icons-left">
                            <input
                                class="input"
                                type="text"
                                v-model="searchQuery"
                                placeholder="Product name or code..."
                            />
                            <span class="icon is-small is-left">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <p class="is-size-7 has-text-grey">
                * This report shows total sales for each product, excluding inactive customers.
            </p>
        </div>

        <!-- Report Table -->
        <div class="box">
            <div v-if="reportStore.loading" class="has-text-centered p-5">
                <span class="icon is-large"><i class="fas fa-spinner fa-pulse fa-3x"></i></span>
                <p class="mt-4">Generating summary report, please wait...</p>
            </div>

            <div v-else-if="filteredData.length === 0" class="has-text-centered p-5">
                <p class="has-text-grey">No products found matching your criteria.</p>
            </div>

            <div v-else class="table-container">
                <table class="table is-bordered is-striped is-hoverable is-narrow is-fullwidth">
                    <thead>
                        <tr class="has-background-light">
                            <th class="sticky-name">Product Name</th>
                            <th class="sticky-supplier">Supplier</th>
                            <th class="has-text-centered sticky-stock">Stock</th>
                            <th
                                v-for="month in reportStore.monthHeaders"
                                :key="month"
                                class="has-text-centered"
                            >
                                {{ formatMonth(month) }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredData" :key="item.id">
                            <td class="has-text-weight-semibold sticky-name" :title="item.name">{{ item.name }}</td>
                            <td class="sticky-supplier" :title="item.supplierName + (item.supplierCountry ? ' (' + item.supplierCountry + ')' : '')">
                                {{ item.supplierName }} {{ item.supplierCountry ? '(' + item.supplierCountry + ')' : '' }}
                            </td>
                            <td
                                class="has-text-right sticky-stock"
                                :class="getStockColor(item.stock)"
                            >
                                {{ formatNumber(item.stock) }}
                            </td>
                            <td
                                v-for="month in reportStore.monthHeaders"
                                :key="month"
                                class="has-text-right"
                            >
                                {{ formatNumber(item.sales[month] || 0) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { useSummaryReportStore } from '../../stores/summaryReport'
import { useCategoryStore } from '../../stores/categories'
import { useSupplierStore } from '../../stores/suppliers'

export default {
    name: 'SalesSummary',
    data() {
        return {
            filterCategory: 'all',
            filterSupplier: 'all',
            searchQuery: '',
        }
    },
    computed: {
        reportStore() {
            return useSummaryReportStore()
        },
        categoryStore() {
            return useCategoryStore()
        },
        supplierStore() {
            return useSupplierStore()
        },
        filteredData() {
            return this.reportStore.summaryData.filter((item) => {
                const matchesCategory =
                    this.filterCategory === 'all' ||
                    String(item.categoryId) === String(this.filterCategory)
                
                const matchesSupplier = 
                    this.filterSupplier === 'all' ||
                    String(item.supplierId) === String(this.filterSupplier)

                const matchesSearch = item.name
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase())

                return matchesCategory && matchesSupplier && matchesSearch
            })
        },
    },
    methods: {
        formatMonth(monthStr) {
            const [year, month] = monthStr.split('-')
            const date = new Date(year, month - 1)
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        },
        formatNumber(val) {
            if (val === undefined || val === null) return '0'
            return val.toLocaleString()
        },
        getStockColor(stock) {
            if (typeof stock !== 'number') return ''
            if (stock < 0) return 'has-text-danger'
            if (stock === 0) return 'has-text-warning'
            return 'has-text-success'
        },
    },
    async mounted() {
        await Promise.all([
            this.categoryStore.fetchCategories(),
            this.supplierStore.fetchSuppliers(),
            this.reportStore.generateSummaryReport()
        ])
    },
}
</script>

<style scoped>
.table-container {
    overflow: auto;
    max-height: 70vh;
    padding-bottom: 8px;
}

.table th,
.table td {
    white-space: nowrap;
}

/* Base sticky styling */
.sticky-name,
.sticky-supplier,
.sticky-stock {
    position: sticky;
    z-index: 1;
    background-color: white !important;
}

/* Product Name column - first column */
.sticky-name {
    left: 0;
    min-width: 350px;
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Supplier column - second column */
.sticky-supplier {
    left: 350px; /* Offset by the width of sticky-name */
    min-width: 250px;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Stock column - third column */
.sticky-stock {
    left: 600px; /* Offset by width of sticky-name + sticky-supplier (350+250) */
    min-width: 80px;
    max-width: 80px;
    box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
}

/* Hover effects for sticky columns */
tr:hover .sticky-name,
tr:hover .sticky-supplier,
tr:hover .sticky-stock {
    background-color: #fafafa !important;
}

/* Header sticky styling */
thead th {
    position: sticky;
    top: 0;
    background-color: #f5f5f5 !important;
    z-index: 2;
}

thead th.sticky-name,
thead th.sticky-supplier,
thead th.sticky-stock {
    z-index: 3;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
    .sticky-name {
        min-width: 150px;
        max-width: 150px;
    }
    .sticky-supplier {
        left: 150px;
        min-width: 150px;
        max-width: 150px;
    }
    .sticky-stock {
        left: 300px;
    }
}
</style>
