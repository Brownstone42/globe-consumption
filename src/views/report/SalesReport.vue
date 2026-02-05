<template>
    <div>
        <!-- Header -->
        <h1 class="title is-4">Customer Sales Report</h1>

        <!-- Controls -->
        <div class="box mb-5">
            <div class="columns is-vcentered">
                <!-- Product Selector -->
                <div class="column">
                    <div class="field">
                        <label class="label">Select Product</label>
                        <div class="control">
                            <div
                                class="select is-fullwidth"
                                :class="{ 'is-loading': productStore.loading }"
                            >
                                <select v-model="selectedProduct" @change="onProductSelect">
                                    <option :value="null" disabled>
                                        -- Please select a product --
                                    </option>
                                    <option
                                        v-for="product in productStore.sortedProducts"
                                        :key="product.id"
                                        :value="product.id"
                                    >
                                        {{ product.name }} ({{ product.code }})
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current Stock Display -->
                <div class="column is-narrow">
                    <div class="field">
                        <label class="label">Current Stock</label>
                        <div class="control">
                            <p class="is-size-4 has-text-weight-bold" :class="stockColor">
                                <span v-if="reportStore.loading" class="icon is-small"
                                    ><i class="fas fa-spinner fa-pulse"></i
                                ></span>
                                <span v-else>{{ reportStore.currentStock }}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Table -->
        <div v-if="selectedProduct" class="box">
            <div v-if="reportStore.loading" class="has-text-centered p-5">
                <span class="icon is-large"><i class="fas fa-spinner fa-pulse fa-3x"></i></span>
                <p class="mt-4">Generating report, please wait...</p>
            </div>

            <div
                v-else-if="
                    !reportStore.reportData || Object.keys(reportStore.reportData).length === 0
                "
                class="has-text-centered p-5"
            >
                <p class="has-text-grey">
                    No sales data found for this product in the last 12 months.
                </p>
            </div>

            <div v-else class="table-container">
                <table class="table is-bordered is-striped is-hoverable is-narrow">
                    <thead>
                        <tr class="has-background-light">
                            <th class="is-sticky-col">Customer</th>
                            <th
                                v-for="month in reportStore.monthHeaders"
                                :key="month"
                                class="has-text-centered is-sticky-header"
                            >
                                {{ formatMonth(month) }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(salesByMonth, customerName) in reportStore.reportData"
                            :key="customerName"
                        >
                            <td class="has-text-weight-semibold is-sticky-col">
                                {{ customerName }}
                            </td>
                            <td
                                v-for="month in reportStore.monthHeaders"
                                :key="month"
                                class="has-text-right"
                            >
                                <template v-if="salesByMonth[month]">
                                    <span
                                        :class="{
                                            'has-text-danger has-text-weight-bold':
                                                salesByMonth[month].isInactive,
                                        }"
                                        :title="
                                            salesByMonth[month].isInactive
                                                ? 'This record is inactive'
                                                : ''
                                        "
                                    >
                                        {{ salesByMonth[month].quantity }}
                                    </span>
                                </template>
                                <template v-else>0</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="is-size-7 has-text-grey mt-2">
                *
                <span class="has-text-danger has-text-weight-bold">Red color numbers</span> indicate
                that the sales record for that month is marked as inactive and is excluded from the
                summary report.
            </p>
        </div>

        <!-- Initial Prompt -->
        <div v-else class="has-text-centered p-5">
            <p class="is-size-5 has-text-grey">Please select a product to generate a report.</p>
        </div>
    </div>
</template>

<script>
import { useProductStore } from '../../stores/products'
import { useReportStore } from '../../stores/report'

export default {
    name: 'SalesReport',
    data() {
        return {
            selectedProduct: null,
        }
    },
    computed: {
        productStore() {
            return useProductStore()
        },
        reportStore() {
            return useReportStore()
        },
        stockColor() {
            const stock = this.reportStore.currentStock
            if (typeof stock !== 'number') return ''
            if (stock < 0) return 'has-text-danger'
            if (stock === 0) return 'has-text-warning'
            return 'has-text-success'
        },
    },
    methods: {
        onProductSelect() {
            if (this.selectedProduct) {
                this.reportStore.generateSalesReport(this.selectedProduct)
            }
        },
        formatMonth(monthStr) {
            const [year, month] = monthStr.split('-')
            const date = new Date(year, month - 1)
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        },
    },
    mounted() {
        this.productStore.fetchProducts()
    },
}
</script>

<style scoped>
.table-container {
    overflow-x: auto;
}

.table-container .table {
    table-layout: fixed;
}

.table th.is-sticky-header,
.table td {
    min-width: 100px;
    text-align: right;
    word-wrap: break-word;
}

.table th.is-sticky-header {
    position: sticky;
    top: 0;
    z-index: 1;
}

.table th.is-sticky-col,
.table td.is-sticky-col {
    position: sticky;
    left: 0;
    background-color: #f5f5f5;
    z-index: 2;
    width: 180px;
    min-width: 180px;
    text-align: left;
}

tr:hover .is-sticky-col {
    background-color: #e9e9e9 !important;
}

.is-sticky-col {
    background-color: hsl(0, 0%, 96%);
}
tr .is-sticky-col {
    background-color: #fff;
}
</style>
