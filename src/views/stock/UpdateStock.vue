<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <div>
                    <h1 class="title is-4">Update Stock Count</h1>
                    <p class="subtitle is-6">Enter the actual counted quantity for each product.</p>
                </div>
            </div>
        </div>

        <div class="box">
            <!-- Controls: Date and Filter -->
            <div class="columns is-vcentered">
                <div class="column is-narrow">
                    <div class="field">
                        <label class="label">Count Date</label>
                        <div class="control" style="width: 250px">
                            <!-- VueDatePicker implementation -->
                            <VueDatePicker
                                v-model="countDate"
                                :formats="{ input: 'yyyy/MM/dd' }"
                                :auto-apply="true"
                            ></VueDatePicker>
                        </div>
                    </div>
                </div>
                <div class="column is-narrow">
                    <div class="field">
                        <label class="label">Filter by Category</label>
                        <div class="control">
                            <div class="select">
                                <select v-model="filterCategoryId">
                                    <option value="">All Categories</option>
                                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                        {{ cat.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table of Products -->
            <div class="table-container mt-4">
                <table class="table is-fullwidth is-hoverable">
                    <thead>
                        <tr>
                            <th style="width: 15%">Product Code</th>
                            <th>Product Name</th>
                            <th style="width: 15%">Last Update Date</th>
                            <th style="width: 12%">Last Quantity</th>
                            <th style="width: 15%">New Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="productLoading || stockLoading">
                            <td colspan="5" class="has-text-centered py-5">
                                <span class="icon is-large"
                                    ><i class="fas fa-spinner fa-pulse fa-2x"></i
                                ></span>
                                <p>Loading Data...</p>
                            </td>
                        </tr>
                        <!-- Use filteredProducts computed property -->
                        <tr v-else v-for="product in filteredProducts" :key="product.id">
                            <td>
                                <strong>{{ product.code }}</strong>
                            </td>
                            <td>{{ product.name }}</td>
                            <td>
                                <span class="tag is-light">{{
                                    formatDate(getLastUpdate(product.id).countDate) || 'N/A'
                                }}</span>
                            </td>
                            <td class="has-text-right has-text-weight-bold">
                                {{ getLastUpdate(product.id).quantity ?? 'N/A' }}
                            </td>
                            <td>
                                <div class="control">
                                    <input
                                        class="input"
                                        type="number"
                                        v-model.number="stockQuantities[product.id]"
                                        placeholder="Enter count"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!productLoading && filteredProducts.length === 0">
                            <td colspan="5" class="has-text-centered has-text-grey py-5">
                                No products found for the selected category.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Save Button -->
            <div class="field mt-5">
                <div class="control">
                    <button
                        class="button is-primary is-fullwidth is-large"
                        @click="saveStock"
                        :class="{ 'is-loading': stockLoading }"
                        :disabled="
                            Object.values(stockQuantities).every((v) => v === null || v === '')
                        "
                    >
                        Save All Stock Updates
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useProductStore } from '../../stores/products'
import { useStockStore } from '../../stores/stock'
import { useCategoryStore } from '../../stores/categories'
// REMOVED local import

export default {
    name: 'UpdateStock',
    // REMOVED local components
    data() {
        return {
            countDate: this.getTodayString(),
            stockQuantities: {},
            filterCategoryId: '',
        }
    },
    computed: {
        ...mapState(useProductStore, {
            products: 'products',
            productLoading: 'loading',
        }),
        ...mapState(useStockStore, {
            lastUpdates: 'lastUpdates',
            stockLoading: 'loading',
        }),
        ...mapState(useCategoryStore, ['categories']),

        filteredProducts() {
            if (!this.filterCategoryId) {
                return this.products
            }
            return this.products.filter((p) => p.categoryId === this.filterCategoryId)
        },
    },
    methods: {
        ...mapActions(useProductStore, ['fetchProducts']),
        ...mapActions(useStockStore, ['recordStockUpdate', 'fetchLastStockUpdates']),
        ...mapActions(useCategoryStore, ['fetchCategories']),

        getTodayString() {
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        formatDate(dateVal) {
            if (!dateVal) return ''

            let date = dateVal
            // Handle Firestore Timestamp
            if (dateVal && typeof dateVal.toDate === 'function') {
                date = dateVal.toDate()
            }
            // Handle String or Number
            else if (!(dateVal instanceof Date)) {
                date = new Date(dateVal)
            }

            if (isNaN(date.getTime())) return ''

            // Format as YYYY-MM-DD
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        getLastUpdate(productId) {
            return this.lastUpdates[productId] || {}
        },

        async saveStock() {
            if (!this.countDate) {
                alert('Please select a count date.')
                return
            }

            // Filter to only save what is currently visible
            const visibleProductIds = this.filteredProducts.map((p) => p.id)
            const updatesToSave = Object.keys(this.stockQuantities)
                .filter((key) => visibleProductIds.includes(key))
                .reduce((obj, key) => {
                    obj[key] = this.stockQuantities[key]
                    return obj
                }, {})

            const hasValues = Object.values(updatesToSave).some((val) => val !== null && val !== '')
            if (!hasValues) {
                alert('Please enter at least one stock quantity for the products shown.')
                return
            }

            if (
                confirm(`Are you sure you want to save these stock counts for ${this.countDate}?`)
            ) {
                await this.recordStockUpdate(this.countDate, updatesToSave)
                this.stockQuantities = {}
            }
        },
    },
    mounted() {
        this.fetchProducts()
        this.fetchLastStockUpdates()
        this.fetchCategories()
    },
}
</script>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
}
</style>
