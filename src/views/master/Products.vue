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
                            <th class="col-category">Category</th>
                            <th class="has-text-centered col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="4" class="has-text-centered py-5">
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
                                <span class="tag is-info is-light">
                                    {{ getCategoryName(product.categoryId) }}
                                </span>
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
                            <td colspan="4" class="has-text-centered has-text-grey py-5">
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
                categoryId: '',
            },
        }
    },
    computed: {
        ...mapState(useProductStore, ['products', 'loading']),
        ...mapState(useCategoryStore, ['categories']),

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

        getCategoryName(id) {
            const cat = this.categories.find((c) => c.id === id)
            return cat ? cat.name : '-'
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

        openModal(product = null) {
            if (product) {
                this.isEditing = true
                this.editingId = product.id
                this.form = { ...product }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    code: '',
                    name: '',
                    categoryId: '',
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { code: '', name: '', categoryId: '' }
        },

        async submitForm() {
            if (!this.form.code || !this.form.name || !this.form.categoryId) {
                alert('Please fill in Code, Name and Category')
                return
            }

            if (this.isEditing) {
                await this.updateProduct(this.editingId, this.form)
            } else {
                await this.addProduct(this.form)
            }
            this.closeModal()
        },
    },
    mounted() {
        this.fetchProducts()
        this.fetchCategories()
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
    width: 200px;
}

.col-name {
    width: auto;
}

.col-category {
    width: 180px;
}

.col-actions {
    width: 120px;
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
