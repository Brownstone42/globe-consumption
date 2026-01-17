<template>
    <div class="container is-fluid">
        <!-- Header & Actions -->
        <div class="level mb-4">
            <div class="level-left">
                <div>
                    <h1 class="title is-4">Products Management</h1>
                    <!-- Filter Area -->
                    <div class="field is-horizontal mt-2">
                        <div class="field-label is-normal">
                            <label class="label">Filter:</label>
                        </div>
                        <div class="field-body">
                            <div class="field">
                                <div class="control">
                                    <div class="select">
                                        <select v-model="filterCategoryId">
                                            <option value="">All Categories</option>
                                            <option
                                                v-for="cat in categories"
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
                    </div>
                </div>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Product</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <!-- Clickable Header for Sorting -->
                            <th class="is-clickable" @click="toggleSort('code')">
                                Code
                                <span class="icon is-small ml-1" v-if="sortKey === 'code'">
                                    <i
                                        class="fas"
                                        :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"
                                    ></i>
                                </span>
                                <span class="icon is-small ml-1 has-text-grey-light" v-else>
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>

                            <th class="is-clickable" @click="toggleSort('name')">
                                Product Name
                                <span class="icon is-small ml-1" v-if="sortKey === 'name'">
                                    <i
                                        class="fas"
                                        :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"
                                    ></i>
                                </span>
                                <span class="icon is-small ml-1 has-text-grey-light" v-else>
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>

                            <th>Category</th>
                            <th class="has-text-centered" style="width: 120px">Actions</th>
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
                        <!-- Use computed property 'filteredProducts' instead of raw 'products' -->
                        <tr v-else v-for="product in filteredProducts" :key="product.id">
                            <td>
                                <strong>{{ product.code }}</strong>
                            </td>
                            <td>{{ product.name }}</td>
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

            // Filter & Sort State
            filterCategoryId: '',
            sortKey: 'code', // 'code' or 'name'
            sortOrder: 'asc', // 'asc' or 'desc'

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

        // Logic สำหรับ Filter และ Sort
        filteredProducts() {
            let result = [...this.products]

            // 1. Filter by Category
            if (this.filterCategoryId) {
                result = result.filter((p) => p.categoryId === this.filterCategoryId)
            }

            // 2. Sort by Key
            result.sort((a, b) => {
                let fieldA = (a[this.sortKey] || '').toString().toLowerCase()
                let fieldB = (b[this.sortKey] || '').toString().toLowerCase()

                if (fieldA < fieldB) return this.sortOrder === 'asc' ? -1 : 1
                if (fieldA > fieldB) return this.sortOrder === 'asc' ? 1 : -1
                return 0
            })

            return result
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

        // ฟังก์ชันสลับการเรียงลำดับ
        toggleSort(key) {
            if (this.sortKey === key) {
                // ถ้ากดซ้ำคอลัมน์เดิม ให้สลับ asc/desc
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                // ถ้ากดคอลัมน์ใหม่ ให้เริ่มที่ asc
                this.sortKey = key
                this.sortOrder = 'asc'
            }
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
.is-clickable {
    cursor: pointer;
    user-select: none; /* ป้องกันการ highlight text เวลาคลิกรัวๆ */
}
.is-clickable:hover {
    background-color: #f5f5f5;
    color: #3273dc; /* Bulma link color */
}
</style>
