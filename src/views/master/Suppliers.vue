<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Suppliers Management</h1>
            </div>
            <div class="level-right">
                <!-- Search Filter -->
                <div class="field mr-4 mb-0">
                    <div class="control has-icons-left">
                        <input
                            class="input"
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search supplier name..."
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
                    <span>Add Supplier</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable is-fixed-layout">
                    <thead>
                        <tr>
                            <th class="is-clickable col-name" @click="toggleSort('name')">
                                Supplier Name
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
                            <th class="is-clickable col-country" @click="toggleSort('country')">
                                Country
                                <span class="icon is-small ml-1">
                                    <i
                                        v-if="sortKey !== 'country'"
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
                        <tr v-else v-for="supplier in paginatedSuppliers" :key="supplier.id">
                            <td class="has-text-overflow">{{ supplier.name }}</td>
                            <td class="has-text-overflow">{{ supplier.country }}</td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(supplier)"
                                        title="Edit"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteSupplier(supplier.id)"
                                        title="Delete"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && filteredSuppliers.length === 0">
                            <td colspan="3" class="has-text-centered has-text-grey py-5">
                                No suppliers found matching your criteria.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Show total counts -->
            <div class="is-size-7 has-text-grey mt-2" v-if="!loading">
                Showing {{ paginatedSuppliers.length }} of
                {{ filteredSuppliers.length }} suppliers (Sorted by {{ sortKey }} {{ sortOrder }})
            </div>
        </div>

        <!-- Modal Form -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        {{ isEditing ? 'Edit Supplier' : 'Add Supplier' }}
                    </p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="field">
                        <label class="label"
                            >Supplier Name <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.name"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Country <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="form.country">
                                    <option value="TH">TH</option>
                                    <option value="MY">MY</option>
                                    <option value="CN">CN</option>
                                    <option value="KR">KR</option>
                                    <option value="TW">TW</option>
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
import { useSupplierStore } from '../../stores/suppliers'

export default {
    name: 'SuppliersView',
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
                name: '',
                country: 'TH',
            },
        }
    },
    computed: {
        ...mapState(useSupplierStore, ['suppliers', 'loading']),

        filteredSuppliers() {
            let result = [...this.suppliers]

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase()
                result = result.filter(
                    (s) =>
                        (s.name && s.name.toLowerCase().includes(query)) ||
                        (s.country && s.country.toLowerCase().includes(query)),
                )
            }

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
            return Math.ceil(this.filteredSuppliers.length / this.itemsPerPage) || 1
        },

        paginatedSuppliers() {
            const start = (this.currentPage - 1) * this.itemsPerPage
            const end = start + this.itemsPerPage
            return this.filteredSuppliers.slice(start, end)
        },
    },
    methods: {
        ...mapActions(useSupplierStore, [
            'fetchSuppliers',
            'addSupplier',
            'updateSupplier',
            'deleteSupplier',
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

        openModal(supplier = null) {
            if (supplier) {
                this.isEditing = true
                this.editingId = supplier.id
                this.form = { 
                    name: supplier.name,
                    country: supplier.country || 'TH'
                }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    name: '',
                    country: 'TH',
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { name: '', country: 'TH' }
        },

        async submitForm() {
            if (!this.form.name || !this.form.country) {
                alert('Please fill in all required fields')
                return
            }

            if (this.isEditing) {
                await this.updateSupplier(this.editingId, this.form)
            } else {
                await this.addSupplier(this.form)
            }
            this.closeModal()
        },
    },
    mounted() {
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

.col-name {
    width: auto;
}

.col-country {
    width: 150px;
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
