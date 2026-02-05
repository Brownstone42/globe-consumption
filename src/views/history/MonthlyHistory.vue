<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div>
                <h1 class="title is-4">Monthly Sales History</h1>
                <p class="subtitle is-6">Manual entry for historical data (Forecast Base).</p>
            </div>
        </div>
        <div class="level mb-4">
            <!-- Pagination Controls -->
            <div class="field has-addons mr-4 mb-0" v-if="totalPages > 1">
                <p class="control">
                    <button class="button" @click="currentPage--" :disabled="currentPage === 1">
                        <span class="icon"><i class="fas fa-chevron-left"></i></span>
                    </button>
                </p>
                <p class="control">
                    <button class="button is-static">{{ currentPage }} / {{ totalPages }}</button>
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

            <div class="buttons">
                <button class="button is-info is-light" @click="openSyncModal()">
                    <span class="icon"><i class="fas fa-sync"></i></span>
                    <span>Sync from PO</span>
                </button>
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Monthly Record</span>
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="box mb-4">
            <div class="columns is-vcentered">
                <!-- Filter Month -->
                <div class="column">
                    <div class="field">
                        <label class="label">Filter Month</label>
                        <div class="control">
                            <input
                                class="input"
                                type="month"
                                v-model="filterMonth"
                                @input="currentPage = 1"
                            />
                        </div>
                    </div>
                </div>

                <!-- Filter Company -->
                <div class="column">
                    <div class="field">
                        <label class="label">Filter Company</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="filterCustomerId" @change="currentPage = 1">
                                    <option value="">All Companies</option>
                                    <option
                                        v-for="cust in sortedCustomers"
                                        :key="cust.id"
                                        :value="cust.id"
                                    >
                                        {{ cust.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filter Product -->
                <div class="column">
                    <div class="field">
                        <label class="label">Filter Product</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="filterProductId" @change="currentPage = 1">
                                    <option value="">All Products</option>
                                    <option
                                        v-for="prod in sortedProducts"
                                        :key="prod.id"
                                        :value="prod.id"
                                    >
                                        {{ prod.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clear Button -->
                <div class="column is-narrow">
                    <div class="field">
                        <label class="label is-hidden-mobile">&nbsp;</label>
                        <div class="control">
                            <button class="button is-light" @click="clearFilters">
                                <span class="icon"><i class="fas fa-times"></i></span>
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable is-fixed-layout">
                    <thead>
                        <tr>
                            <th class="col-month">Month</th>
                            <th class="col-company">Company Name</th>
                            <th class="col-product">Product Name</th>
                            <th class="col-qty has-text-right">Quantity</th>
                            <th class="col-status">Status</th>
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
                        <tr v-else v-for="item in paginatedHistories" :key="item.id">
                            <td>
                                <strong>{{ item.month }}</strong>
                            </td>
                            <td class="has-text-overflow">
                                {{ getCustomerName(item.customerId) }}
                            </td>
                            <td class="has-text-overflow">{{ getProductName(item.productId) }}</td>
                            <td class="has-text-right">{{ item.quantity }}</td>
                            <td>
                                <span
                                    class="tag"
                                    :class="item.status === 'inactive' ? 'is-light' : 'is-success'"
                                >
                                    {{ item.status || 'active' }}
                                </span>
                            </td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(item)"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteHistory(item.id)"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && filteredHistories.length === 0">
                            <td colspan="6" class="has-text-centered has-text-grey py-5">
                                No history records found for the selected filters.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Show total counts -->
            <div class="is-size-7 has-text-grey mt-2" v-if="!loading">
                Showing {{ paginatedHistories.length }} of {{ filteredHistories.length }} records
            </div>
        </div>

        <!-- Modal Form (Manual Entry) -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        {{ isEditing ? 'Edit Record' : 'Add Monthly Record' }}
                    </p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="field">
                        <label class="label">Month <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="month" v-model="form.month" />
                        </div>
                    </div>

                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label"
                                    >Company Code <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.customerId">
                                            <option value="" disabled>Select Code</option>
                                            <option
                                                v-for="cust in sortedCustomersByCode"
                                                :key="cust.id"
                                                :value="cust.id"
                                            >
                                                {{ cust.code }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label"
                                    >Company Name <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.customerId">
                                            <option value="" disabled>Select Name</option>
                                            <option
                                                v-for="cust in sortedCustomers"
                                                :key="cust.id"
                                                :value="cust.id"
                                            >
                                                {{ cust.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label"
                                    >Product Code <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.productId">
                                            <option value="" disabled>Select Code</option>
                                            <option
                                                v-for="prod in sortedProductsByCode"
                                                :key="prod.id"
                                                :value="prod.id"
                                            >
                                                {{ prod.code }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label"
                                    >Product Name <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.productId">
                                            <option value="" disabled>Select Name</option>
                                            <option
                                                v-for="prod in sortedProducts"
                                                :key="prod.id"
                                                :value="prod.id"
                                            >
                                                {{ prod.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label"
                                    >Total Quantity <span class="has-text-danger">*</span></label
                                >
                                <div class="control">
                                    <input
                                        class="input"
                                        type="number"
                                        v-model.number="form.quantity"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="column">
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

        <!-- Sync From PO Modal -->
        <div class="modal" :class="{ 'is-active': isSyncModalActive }">
            <div class="modal-background" @click="closeSyncModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Sync from PO</p>
                    <button class="delete" aria-label="close" @click="closeSyncModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="notification is-info is-light">
                        <p>
                            This will calculate total quantities from POs for the selected month and
                            save them to sales history.
                        </p>
                    </div>

                    <div class="field">
                        <label class="label">Select Month to Sync</label>
                        <div class="control">
                            <input
                                class="input"
                                type="month"
                                v-model="syncMonth"
                                :disabled="syncStep === 'preview'"
                            />
                        </div>
                    </div>

                    <!-- Step 1: Calculate Button -->
                    <div v-if="syncStep === 'input'" class="field mt-4">
                        <button
                            class="button is-info is-fullwidth"
                            @click="calculatePreview"
                            :class="{ 'is-loading': loading }"
                            :disabled="!syncMonth"
                        >
                            Calculate & Preview
                        </button>
                    </div>

                    <!-- Step 2: Preview & Confirm -->
                    <div v-if="syncStep === 'preview'" class="mt-4">
                        <div
                            v-if="previewData.existingCount > 0"
                            class="notification is-danger is-light"
                        >
                            <strong>Warning:</strong> Found {{ previewData.existingCount }} existing
                            records for {{ syncMonth }}.
                            <br />
                            Syncing is disabled to prevent overwriting manual data. Please delete
                            existing records first if you wish to proceed.
                        </div>

                        <div v-else>
                            <div class="level is-mobile mb-2">
                                <div class="level-item has-text-centered">
                                    <div>
                                        <p class="heading">POs Found</p>
                                        <p class="title">{{ previewData.poCount }}</p>
                                    </div>
                                </div>
                                <div class="level-item has-text-centered">
                                    <div>
                                        <p class="heading">Total Records</p>
                                        <p class="title">{{ previewData.records.length }}</p>
                                    </div>
                                </div>
                            </div>

                            <table class="table is-fullwidth is-narrow is-striped text-is-small">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Product</th>
                                        <th class="has-text-right">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(rec, idx) in previewData.records.slice(0, 5)"
                                        :key="idx"
                                    >
                                        <td>{{ getCustomerName(rec.customerId) }}</td>
                                        <td>{{ getProductName(rec.productId) }}</td>
                                        <td class="has-text-right">{{ rec.quantity }}</td>
                                    </tr>
                                    <tr v-if="previewData.records.length > 5">
                                        <td colspan="3" class="has-text-centered has-text-grey">
                                            ... and {{ previewData.records.length - 5 }} more items
                                        </td>
                                    </tr>
                                    <tr v-if="previewData.records.length === 0">
                                        <td colspan="3" class="has-text-centered">
                                            No PO items found.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <div v-if="syncStep === 'preview'" class="buttons is-right" style="width: 100%">
                        <button class="button" @click="syncStep = 'input'">Back</button>
                        <button
                            class="button is-success"
                            @click="confirmSync"
                            :disabled="
                                previewData.existingCount > 0 || previewData.records.length === 0
                            "
                            :class="{ 'is-loading': loading }"
                        >
                            Confirm & Save
                        </button>
                    </div>
                    <div v-else class="buttons is-right" style="width: 100%">
                        <button class="button" @click="closeSyncModal">Cancel</button>
                    </div>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useHistoryStore } from '../../stores/history'
import { useCustomerStore } from '../../stores/customers'
import { useProductStore } from '../../stores/products'

export default {
    name: 'MonthlyHistory',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,
            filterMonth: '',
            filterCustomerId: '',
            filterProductId: '',
            currentPage: 1,
            itemsPerPage: 10,
            form: {
                month: '',
                customerId: '',
                productId: '',
                quantity: 0,
                status: 'active', // Default value
            },

            // Sync Logic
            isSyncModalActive: false,
            syncMonth: '',
            syncStep: 'input', // 'input' | 'preview'
            previewData: {
                poCount: 0,
                records: [],
                existingCount: 0,
            },
        }
    },
    computed: {
        ...mapState(useHistoryStore, ['histories', 'loading']),
        ...mapState(useCustomerStore, ['customers', 'sortedCustomers', 'sortedCustomersByCode']),
        ...mapState(useProductStore, ['products', 'sortedProducts', 'sortedProductsByCode']),

        filteredHistories() {
            let results = [...this.histories]

            if (this.filterMonth) {
                results = results.filter((h) => h.month === this.filterMonth)
            }
            if (this.filterCustomerId) {
                results = results.filter((h) => h.customerId === this.filterCustomerId)
            }
            if (this.filterProductId) {
                results = results.filter((h) => h.productId === this.filterProductId)
            }

            results.sort((a, b) => b.month.localeCompare(a.month))

            return results
        },

        totalPages() {
            return Math.ceil(this.filteredHistories.length / this.itemsPerPage) || 1
        },

        paginatedHistories() {
            const start = (this.currentPage - 1) * this.itemsPerPage
            const end = start + this.itemsPerPage
            return this.filteredHistories.slice(start, end)
        },
    },
    methods: {
        ...mapActions(useHistoryStore, [
            'fetchHistories',
            'addHistory',
            'updateHistory',
            'deleteHistory',
        ]),
        ...mapActions(useCustomerStore, ['fetchCustomers']),
        ...mapActions(useProductStore, ['fetchProducts']),

        getCustomerName(id) {
            const found = this.customers.find((c) => c.id === id)
            return found ? found.name : '-'
        },
        getProductName(id) {
            const found = this.products.find((p) => p.id === id)
            return found ? found.name : '-'
        },

        openModal(item = null) {
            if (item) {
                this.isEditing = true
                this.editingId = item.id
                this.form = {
                    ...item,
                    status: item.status || 'active', // Ensure status exists
                }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    month: this.filterMonth || new Date().toISOString().slice(0, 7),
                    customerId: this.filterCustomerId || '',
                    productId: this.filterProductId || '',
                    quantity: 0,
                    status: 'active',
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { month: '', customerId: '', productId: '', quantity: 0, status: 'active' }
        },

        openSyncModal() {
            this.syncMonth = this.filterMonth || new Date().toISOString().slice(0, 7)
            this.syncStep = 'input'
            this.previewData = { poCount: 0, records: [], existingCount: 0 }
            this.isSyncModalActive = true
        },
        closeSyncModal() {
            this.isSyncModalActive = false
            this.syncStep = 'input'
        },
        async calculatePreview() {
            if (!this.syncMonth) return
            try {
                const store = useHistoryStore()
                const result = await store.syncFromPO(this.syncMonth, true)
                this.previewData = result
                this.syncStep = 'preview'
            } catch (error) {
                console.error(error)
                alert('Failed to calculate preview. See console for details.')
            }
        },
        async confirmSync() {
            if (!this.syncMonth) return
            try {
                const store = useHistoryStore()
                await store.syncFromPO(this.syncMonth, false)
                this.closeSyncModal()
                this.fetchHistories()
                alert('Sync completed successfully!')
            } catch (error) {
                console.error(error)
                alert(error.message)
            }
        },

        clearFilters() {
            this.filterMonth = ''
            this.filterCustomerId = ''
            this.filterProductId = ''
            this.currentPage = 1
        },

        async submitForm() {
            if (
                !this.form.month ||
                !this.form.customerId ||
                !this.form.productId ||
                this.form.quantity <= 0
            ) {
                alert('Please fill in all required fields.')
                return
            }

            if (this.isEditing) {
                await this.updateHistory(this.editingId, this.form)
            } else {
                await this.addHistory(this.form)
            }
            this.closeModal()
        },
    },
    mounted() {
        this.fetchHistories()
        this.fetchCustomers()
        this.fetchProducts()
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

.col-month {
    width: 120px;
}

.col-company {
    width: auto;
}

.col-product {
    width: auto;
}

.col-qty {
    width: 130px;
}

.col-status {
    width: 110px;
}

.col-actions {
    width: 120px;
}

.has-text-overflow {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.label.is-hidden-mobile {
    display: block;
}
@media screen and (max-width: 768px) {
    .label.is-hidden-mobile {
        display: none;
    }
    .is-fixed-layout {
        table-layout: auto;
    }
}
</style>
