<template>
    <div class="container is-fluid">
        <!-- Header & Actions -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Products Management</h1>
            </div>
            <div class="level-right">
                <!-- Search Filter -->
                <div class="field mr-4 mb-0">
                    <div class="control has-icons-left">
                        <input
                            class="input"
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search product name..."
                            @input="currentPage = 1"
                        />
                        <span class="icon is-small is-left">
                            <i class="fas fa-search"></i>
                        </span>
                    </div>
                </div>

                <!-- Category Dropdown Filter -->
                <div class="field mr-4 mb-0">
                    <div class="control">
                        <div class="select">
                            <select v-model="filterCategoryId" @change="currentPage = 1">
                                <option value="">All Categories</option>
                                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Pagination Controls -->
                <div class="field has-addons mr-4 mb-0" v-if="totalPages > 1">
                    <p class="control">
                        <button class="button" @click="currentPage--" :disabled="currentPage === 1">
                            <span class="icon"><i class="fas fa-chevron-left"></i></span>
                        </button>
                    </p>
                    <p class="control">
                        <button class="button is-static">
                            {{ currentPage }} / {{ totalPages }}
                        </button>
                    </p>
                    <p class="control">
                        <button
                            class="button"
                            @click="currentPage++"
                            :disabled="currentPage === totalPages"
                        >
                            <span class="icon"><i class="fas fa-chevron-right"></i></span>
                        </button>
                    </p>
                </div>

                <!-- Add Button -->
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Product</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable is-fixed-layout">
                    <thead>
                        <tr>
                            <th class="is-clickable col-code" @click="toggleSort('code')">
                                Code
                                <span class="icon is-small ml-1">
                                    <i
                                        v-if="sortKey !== 'code'"
                                        class="fas fa-sort has-text-grey-light"
                                    ></i>
                                    <i
                                        v-else
                                        :class="[
                                            'fas',
                                            sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down',
                                        ]"
                                    ></i>
                                </span>
                            </th>
                            <th class="is-clickable col-name" @click="toggleSort('name')">
                                Product Name
                                <span class="icon is-small ml-1">
                                    <i
                                        v-if="sortKey !== 'name'"
                                        class="fas fa-sort has-text-grey-light"
                                    ></i>
                                    <i
                                        v-else
                                        :class="[
                                            'fas',
                                            sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down',
                                        ]"
                                    ></i>
                                </span>
                            </th>
                            <th class="col-unit">Stock Unit</th>
                            <th class="col-category">Category</th>
                            <th class="col-supplier">Supplier</th>
                            <th class="has-text-centered col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="has-text-centered py-5">
                                <span class="icon is-large"
                                    ><i class="fas fa-spinner fa-pulse fa-2x"></i
                                ></span>
                                <p>Loading...</p>
                            </td>
                        </tr>
                        <tr v-else v-for="product in paginatedProducts" :key="product.id">
                            <td class="has-text-overflow">
                                <strong>{{ product.code }}</strong>
                            </td>
                            <td class="has-text-overflow">{{ product.name }}</td>
                            <td>
                                <span class="tag is-light is-warning" v-if="product.stockUnit">
                                    {{ product.stockUnit }}
                                </span>
                                <span v-else class="has-text-grey-light">Not set</span>
                            </td>
                            <td>
                                <span class="tag is-info is-light">
                                    {{ getCategoryName(product.categoryId) }}
                                </span>
                            </td>
                            <td>
                                {{ getSupplierName(product.supplierId) }}
                            </td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(product)"
                                        title="Edit"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteProduct(product.id)"
                                        title="Delete"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && filteredProducts.length === 0">
                            <td colspan="6" class="has-text-centered has-text-grey py-5">
                                No products found matching your criteria.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Show total counts -->
            <div class="is-size-7 has-text-grey mt-2" v-if="!loading">
                Showing {{ paginatedProducts.length }} of {{ filteredProducts.length }} products
                (Sorted by {{ sortKey }} {{ sortOrder }})
            </div>
        </div>

        <!-- Modal Form -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">{{ isEditing ? 'Edit Product' : 'Add Product' }}</p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="columns">
                        <div class="column is-6">
                            <div class="field">
                                <label class="label"
                                    >Product Code <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <input
                                        class="input"
                                        type="text"
                                        v-model="form.code"
                                        placeholder="e.g. PD-001"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="column is-6">
                            <div class="field">
                                <label class="label"
                                    >Stock Unit (Base) <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <input
                                        class="input"
                                        type="text"
                                        v-model="form.stockUnit"
                                        placeholder="e.g. Pcs, Box, Pack"
                                    />
                                </div>
                                <p class="help">The unit used for inventory counting</p>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label"
                            >Product Name <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.name"
                                placeholder="e.g. Wireless Mouse"
                            />
                        </div>
                    </div>

                    <div class="columns">
                        <div class="column is-6">
                            <div class="field">
                                <label class="label">Category <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.categoryId">
                                            <option value="" disabled>Select Category</option>
                                            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                                {{ cat.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="column is-6">
                            <div class="field">
                                <label class="label">Supplier <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.supplierId">
                                            <option value="" disabled>Select Supplier</option>
                                            <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                                                {{ sup.name }} ({{ sup.country }})
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- UOM Conversions -->
                    <hr />
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                        <label class="label mb-0">Unit Conversions (Optional)</label>
                        <button class="button is-small is-info" @click="addConversion">
                            <span class="icon is-small"><i class="fas fa-plus"></i></span>
                            <span>Add Mapping</span>
                        </button>
                    </div>
                    
                    <div v-if="form.conversions && form.conversions.length > 0">
                        <div v-for="(conv, index) in form.conversions" :key="index" class="box is-light p-3 mb-2">
                            <div class="columns is-vcentered is-mobile">
                                <div class="column">
                                    <div class="field">
                                        <label class="label is-size-7">If Purchase Unit is:</label>
                                        <div class="control">
                                            <input class="input is-small" type="text" v-model="conv.purchaseUnit" placeholder="e.g. Box">
                                        </div>
                                    </div>
                                </div>
                                <div class="column is-narrow has-text-centered pt-4">
                                    <span class="icon"><i class="fas fa-arrow-right"></i></span>
                                </div>
                                <div class="column">
                                    <div class="field">
                                        <label class="label is-size-7">Multiply by (Factor):</label>
                                        <div class="control">
                                            <input class="input is-small" type="number" step="0.0001" v-model.number="conv.factor">
                                        </div>
                                    </div>
                                </div>
                                <div class="column is-narrow pt-4">
                                    <button class="button is-small is-danger is-light" @click="removeConversion(index)">
                                        <span class="icon is-small"><i class="fas fa-times"></i></span>
                                    </button>
                                </div>
                            </div>
                            <p class="is-size-7 has-text-grey mt-1">
                                1 {{ conv.purchaseUnit || '?' }} = <strong>{{ conv.factor || 0 }}</strong> {{ form.stockUnit || 'Stock Units' }}
                            </p>
                        </div>
                    </div>
                    <div v-else class="has-text-centered py-4 has-background-light is-size-7 has-text-grey">
                        No custom unit conversions defined.
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button
                        class="button is-success"
                        @click="submitForm"
                        :class="{ 'is-loading': loading }"
                    >
                        Save changes
                    </button>
                    <button class="button" @click="closeModal">Cancel</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useProductStore } from '../../stores/products'
import { useCategoryStore } from '../../stores/categories'
import { useSupplierStore } from '../../stores/suppliers'
import jarvis from '../../utils/jarvis'

export default {
    name: 'ProductsView',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,

            // Filter & Sort & Pagination State
            searchQuery: '',
            filterCategoryId: '',
            sortKey: 'name',
            sortOrder: 'asc',
            currentPage: 1,
            itemsPerPage: 10,

            form: {
                code: '',
                name: '',
                stockUnit: '',
                categoryId: '',
                supplierId: '',
                conversions: []
            },
        }
    },
    computed: {
        ...mapState(useProductStore, ['products', 'loading']),
        ...mapState(useCategoryStore, ['categories']),
        ...mapState(useSupplierStore, ['suppliers']),

        filteredProducts() {
            let result = [...this.products]

            // 1. Filter by Search
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase()
                result = result.filter(
                    (p) =>
                        (p.name && p.name.toLowerCase().includes(query)) ||
                        (p.code && p.code.toLowerCase().includes(query)),
                )
            }

            // 2. Filter by Category
            if (this.filterCategoryId) {
                result = result.filter((p) => p.categoryId === this.filterCategoryId)
            }

            // 3. Sort
            result.sort((a, b) => {
                let valA = (a[this.sortKey] || '').toString().toLowerCase()
                let valB = (b[this.sortKey] || '').toString().toLowerCase()

                if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1
                return 0
            })

            return result
        },

        totalPages() {
            return Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1
        },

        paginatedProducts() {
            const start = (this.currentPage - 1) * this.itemsPerPage
            const end = start + this.itemsPerPage
            return this.filteredProducts.slice(start, end)
        },
    },
    methods: {
        ...mapActions(useProductStore, [
            'fetchProducts',
            'addProduct',
            'updateProduct',
            'deleteProduct',
        ]),
        ...mapActions(useCategoryStore, ['fetchCategories']),
        ...mapActions(useSupplierStore, ['fetchSuppliers']),

        getCategoryName(id) {
            const cat = this.categories.find((c) => c.id === id)
            return cat ? cat.name : '-'
        },

        getSupplierName(id) {
            const sup = this.suppliers.find((s) => s.id === id)
            return sup ? sup.name : '-'
        },

        toggleSort(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortKey = key
                this.sortOrder = 'asc'
            }
            this.currentPage = 1
        },

        addConversion() {
            if (!this.form.conversions) this.form.conversions = [];
            this.form.conversions.push({
                purchaseUnit: '',
                factor: 1
            });
        },

        removeConversion(index) {
            this.form.conversions.splice(index, 1);
        },

        openModal(product = null) {
            if (product) {
                this.isEditing = true
                this.editingId = product.id
                this.form = { 
                    code: product.code || '',
                    name: product.name || '',
                    stockUnit: product.stockUnit || '',
                    categoryId: product.categoryId || '',
                    supplierId: product.supplierId || '',
                    conversions: product.conversions ? JSON.parse(JSON.stringify(product.conversions)) : []
                }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    code: '',
                    name: '',
                    stockUnit: '',
                    categoryId: '',
                    supplierId: '',
                    conversions: []
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { code: '', name: '', stockUnit: '', categoryId: '', supplierId: '', conversions: [] }
        },

        async submitForm() {
            if (!this.form.code || !this.form.name || !this.form.categoryId || !this.form.supplierId || !this.form.stockUnit) {
                jarvis.toast('Please fill in all required fields (Code, Name, Stock Unit, Category, Supplier)', 'error')
                return
            }

            // Clean conversions
            if (this.form.conversions) {
                this.form.conversions = this.form.conversions.filter(c => c.purchaseUnit && c.factor);
            }

            try {
                if (this.isEditing) {
                    await this.updateProduct(this.editingId, this.form)
                } else {
                    await this.addProduct(this.form)
                }
                jarvis.toast(`Product ${this.isEditing ? 'updated' : 'added'} successfully`)
                this.closeModal()
            } catch (error) {
                jarvis.toast('Error saving product', 'error')
            }
        },
    },
    mounted() {
        this.fetchProducts()
        this.fetchCategories()
        this.fetchSuppliers()
    },
}
</script>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
}

.is-fixed-layout {
    table-layout: fixed;
}

.col-code {
    width: 140px;
}

.col-name {
    width: auto;
}

.col-unit {
    width: 100px;
}

.col-category {
    width: 130px;
}

.col-supplier {
    width: 130px;
}

.col-actions {
    width: 100px;
}

.has-text-overflow {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.is-clickable {
    cursor: pointer;
    user-select: none;
}

.is-clickable:hover {
    background-color: #f5f5f5;
}

.box.is-light {
    background-color: #f9f9f9;
    border: 1px solid #eee;
}

@media screen and (max-width: 768px) {
    .level-right {
        flex-direction: column;
        align-items: stretch;
    }
    .level-right .field {
        margin-right: 0 !important;
        margin-bottom: 0.75rem !important;
    }
    .is-fixed-layout {
        table-layout: auto;
    }
}
</style>
