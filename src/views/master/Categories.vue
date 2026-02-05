<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Categories Management</h1>
            </div>
            <div class="level-right">
                <!-- Search Filter -->
                <div class="field mr-4 mb-0">
                    <div class="control has-icons-left">
                        <input
                            class="input"
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search category name..."
                            @input="currentPage = 1"
                        />
                        <span class="icon is-small is-left">
                            <i class="fas fa-search"></i>
                        </span>
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
                    <span>Add Category</span>
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
                                Category Name
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
                            <th class="has-text-centered col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="3" class="has-text-centered py-5">
                                <span class="icon is-large"
                                    ><i class="fas fa-spinner fa-pulse fa-2x"></i
                                ></span>
                                <p>Loading...</p>
                            </td>
                        </tr>
                        <tr v-else v-for="category in paginatedCategories" :key="category.id">
                            <td class="has-text-overflow">
                                <strong>{{ category.code }}</strong>
                            </td>
                            <td class="has-text-overflow">{{ category.name }}</td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(category)"
                                        title="Edit"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteCategory(category.id)"
                                        title="Delete"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && filteredCategories.length === 0">
                            <td colspan="3" class="has-text-centered has-text-grey py-5">
                                No categories found matching your criteria.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Show total counts -->
            <div class="is-size-7 has-text-grey mt-2" v-if="!loading">
                Showing {{ paginatedCategories.length }} of
                {{ filteredCategories.length }} categories (Sorted by {{ sortKey }} {{ sortOrder }})
            </div>
        </div>

        <!-- Modal Form -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        {{ isEditing ? 'Edit Category' : 'Add Category' }}
                    </p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="field">
                        <label class="label"
                            >Category Code <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.code"
                                placeholder="e.g. CAT-001"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label class="label"
                            >Category Name <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.name"
                                placeholder="e.g. Raw Materials"
                            />
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
import { useCategoryStore } from '../../stores/categories'

export default {
    name: 'CategoriesView',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,
            searchQuery: '',
            currentPage: 1,
            itemsPerPage: 10,
            sortKey: 'name',
            sortOrder: 'asc',
            form: {
                code: '',
                name: '',
            },
        }
    },
    computed: {
        ...mapState(useCategoryStore, ['categories', 'loading']),

        filteredCategories() {
            let result = [...this.categories]

            // 1. Filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase()
                result = result.filter(
                    (c) =>
                        (c.name && c.name.toLowerCase().includes(query)) ||
                        (c.code && c.code.toLowerCase().includes(query)),
                )
            }

            // 2. Sort
            result.sort((a, b) => {
                const valA = (a[this.sortKey] || '').toString().toLowerCase()
                const valB = (b[this.sortKey] || '').toString().toLowerCase()

                if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1
                return 0
            })

            return result
        },

        totalPages() {
            return Math.ceil(this.filteredCategories.length / this.itemsPerPage) || 1
        },

        paginatedCategories() {
            const start = (this.currentPage - 1) * this.itemsPerPage
            const end = start + this.itemsPerPage
            return this.filteredCategories.slice(start, end)
        },
    },
    methods: {
        ...mapActions(useCategoryStore, [
            'fetchCategories',
            'addCategory',
            'updateCategory',
            'deleteCategory',
        ]),

        toggleSort(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortKey = key
                this.sortOrder = 'asc'
            }
            this.currentPage = 1
        },

        openModal(category = null) {
            if (category) {
                this.isEditing = true
                this.editingId = category.id
                this.form = { ...category }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    code: '',
                    name: '',
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { code: '', name: '' }
        },

        async submitForm() {
            if (!this.form.code || !this.form.name) {
                alert('Please fill in Code and Name')
                return
            }

            if (this.isEditing) {
                await this.updateCategory(this.editingId, this.form)
            } else {
                await this.addCategory(this.form)
            }
            this.closeModal()
        },
    },
    mounted() {
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
