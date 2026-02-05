<template>
    <div class="container is-fluid">
        <!-- Header ส่วนหัว -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Customer Management</h1>
            </div>
            <div class="level-right">
                <!-- Search Filter (Name) -->
                <div class="field mr-2 mb-0">
                    <div class="control has-icons-left">
                        <input
                            class="input"
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search name..."
                            @input="currentPage = 1"
                        />
                        <span class="icon is-small is-left">
                            <i class="fas fa-search"></i>
                        </span>
                    </div>
                </div>

                <!-- Search Filter (Code) -->
                <div class="field mr-4 mb-0">
                    <div class="control has-icons-left">
                        <input
                            class="input"
                            type="text"
                            v-model="searchCodeQuery"
                            placeholder="Search code..."
                            @input="currentPage = 1"
                        />
                        <span class="icon is-small is-left">
                            <i class="fas fa-tag"></i>
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
                    <span>Add Customer</span>
                </button>
            </div>
        </div>

        <!-- ตารางแสดงข้อมูล -->
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
                                Name
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
                            <th class="col-status">Status</th>
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
                        <tr v-else v-for="customer in paginatedCustomers" :key="customer.id">
                            <td class="has-text-overflow">
                                <strong>{{ customer.code }}</strong>
                            </td>
                            <td class="has-text-overflow">{{ customer.name }}</td>
                            <td>
                                <span
                                    class="tag"
                                    :class="
                                        customer.status === 'active' ? 'is-success' : 'is-light'
                                    "
                                >
                                    {{ customer.status }}
                                </span>
                            </td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(customer)"
                                        title="Edit"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteCustomer(customer.id)"
                                        title="Delete"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && filteredCustomers.length === 0">
                            <td colspan="4" class="has-text-centered has-text-grey py-5">
                                No customers found matching your criteria.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Show total counts -->
            <div class="is-size-7 has-text-grey mt-2" v-if="!loading">
                Showing {{ paginatedCustomers.length }} of {{ filteredCustomers.length }} customers
                (Sorted by {{ sortKey }} {{ sortOrder }})
            </div>
        </div>

        <!-- Modal Form (Add/Edit) -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        {{ isEditing ? 'Edit Customer' : 'Add Customer' }}
                    </p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="field">
                        <label class="label"
                            >Customer Code <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.code"
                                placeholder="e.g. CUST-001"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label class="label"
                            >Customer Name <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.name"
                                placeholder="Company Name / Full Name"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Status</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="form.status">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
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
import { useCustomerStore } from '../../stores/customers'

export default {
    name: 'CustomersView',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,
            searchQuery: '',
            searchCodeQuery: '',
            currentPage: 1,
            itemsPerPage: 10,
            sortKey: 'name', // เริ่มต้นด้วย name
            sortOrder: 'asc', // เริ่มต้นด้วย asc
            form: {
                code: '',
                name: '',
                status: 'active',
            },
        }
    },
    computed: {
        ...mapState(useCustomerStore, ['customers', 'loading']),

        filteredCustomers() {
            let result = [...this.customers]

            // 1. Filter by Name
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase()
                result = result.filter((c) => c.name && c.name.toLowerCase().includes(query))
            }

            // 2. Filter by Code
            if (this.searchCodeQuery) {
                const query = this.searchCodeQuery.toLowerCase()
                result = result.filter((c) => c.code && c.code.toLowerCase().includes(query))
            }

            // 3. Sort
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
            return Math.ceil(this.filteredCustomers.length / this.itemsPerPage) || 1
        },

        paginatedCustomers() {
            const start = (this.currentPage - 1) * this.itemsPerPage
            const end = start + this.itemsPerPage
            return this.filteredCustomers.slice(start, end)
        },
    },
    methods: {
        ...mapActions(useCustomerStore, [
            'fetchCustomers',
            'addCustomer',
            'updateCustomer',
            'deleteCustomer',
        ]),

        toggleSort(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortKey = key
                this.sortOrder = 'asc'
            }
            this.currentPage = 1 // Reset to first page on sort
        },

        openModal(customer = null) {
            if (customer) {
                // Edit mode
                this.isEditing = true
                this.editingId = customer.id
                // Clone object เพื่อป้องกันการแก้ค่าในตาราง real-time ก่อนกด save
                this.form = { ...customer }
            } else {
                // Add mode
                this.isEditing = false
                this.editingId = null
                this.form = {
                    code: '',
                    name: '',
                    status: 'active',
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            // Reset form เพื่อความสะอาดของ data
            this.form = { code: '', name: '', status: 'active' }
        },

        async submitForm() {
            // Basic Validation
            if (!this.form.code || !this.form.name) {
                alert('Please fill in Code and Name')
                return
            }

            if (this.isEditing) {
                await this.updateCustomer(this.editingId, this.form)
            } else {
                await this.addCustomer(this.form)
            }
            this.closeModal()
        },
    },
    mounted() {
        this.fetchCustomers()
    },
}
</script>

<style scoped>
/* ปรับแต่ง Table ให้ดูดีขึ้น */
.table td,
.table th {
    vertical-align: middle;
}

.is-fixed-layout {
    table-layout: fixed;
}

.col-code {
    width: 150px;
}

.col-name {
    width: auto; /* Take remaining space */
}

.col-status {
    width: 120px;
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

/* Adjustments for level on mobile */
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
        table-layout: auto; /* Fallback for mobile if columns are too many */
    }

    .col-code {
        width: 100px;
    }
}
</style>
