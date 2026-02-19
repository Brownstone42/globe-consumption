<template>
    <div>
        <h1 class="title is-4">Sales Summary Report</h1>

        <!-- Controls -->
        <div class="box mb-5">
            <div class="columns is-multiline">
                <!-- Category Filter -->
                <div class="column is-one-third">
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

                <!-- Product Filter (Search) -->
                <div class="column is-one-third">
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
                <table class="table is-bordered is-striped is-hoverable is-narrow">
                    <thead>
                        <tr class="has-background-light">
                            <th class="sticky-name">Product Name</th>
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
                            <td class="has-text-weight-semibold sticky-name">{{ item.name }}</td>
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

export default {
    name: 'SalesSummary',
    data() {
        return {
            filterCategory: 'all',
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
        filteredData() {
            return this.reportStore.summaryData.filter((item) => {
                const matchesCategory =
                    this.filterCategory === 'all' ||
                    String(item.categoryId) === String(this.filterCategory)

                const matchesSearch = item.name
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase())

                return matchesCategory && matchesSearch
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
        await this.categoryStore.fetchCategories()
        await this.reportStore.generateSummaryReport()
    },
}
</script>

<style scoped>
.table-container {
    overflow-x: auto;
    max-height: 70vh;
}

.table th,
.table td {
    white-space: nowrap;
}

/* Base sticky styling */
.sticky-name,
.sticky-stock {
    position: sticky;
    z-index: 1;
    background-color: white !important;
}

/* Product Name column - first column */
.sticky-name {
    left: 0;
    min-width: 250px;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Stock column - second column */
.sticky-stock {
    left: 250px; /* Offset by the width of sticky-name */
    min-width: 80px;
    max-width: 80px;
    box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1); /* Shadow to separate frozen columns from scrollable ones */
}

/* Hover effects for sticky columns */
tr:hover .sticky-name,
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
thead th.sticky-stock {
    z-index: 3; /* Must be higher than body cells and other headers */
}

/* Responsive adjustments if needed */
@media screen and (max-width: 768px) {
    .sticky-name {
        min-width: 150px;
        max-width: 150px;
    }
    .sticky-stock {
        left: 150px;
    }
}
</style>
