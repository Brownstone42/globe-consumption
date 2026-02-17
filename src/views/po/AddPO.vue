<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Purchase Order List</h1>
            </div>
            <div class="level-right">
                <div class="field is-grouped is-align-items-center">
                    <p class="control">
                        <span class="tag is-info is-light">
                            <span class="icon is-small mr-1"><i class="fas fa-info-circle"></i></span>
                            Please use <strong>Import PO (Excel)</strong> to add new orders.
                        </span>
                    </p>
                    <p class="control">
                        <button class="button is-primary" disabled title="Manual adding is disabled. Please use Import PO.">
                            <span class="icon"><i class="fas fa-plus"></i></span>
                            <span>Add PO</span>
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <!-- Warning Message -->
        <div class="notification is-warning is-light">
            <button class="delete" @click="(e) => e.target.parentElement.remove()"></button>
            <strong>Warning:</strong> Do NOT delete POs that belong to the same month as your last
            <strong>Stock Count (Update Stock)</strong>. The system needs these POs to accurately
            calculate remaining stock for that specific month.
        </div>

        <!-- Grouped Display -->
        <div v-if="loading" class="has-text-centered py-6">
            <span class="icon is-large"><i class="fas fa-spinner fa-pulse fa-2x"></i></span>
            <p>Loading Purchase Orders...</p>
        </div>

        <div v-else-if="Object.keys(groupedOrders).length === 0" class="box has-text-centered py-6 has-text-grey">
            <p>No Purchase Orders found.</p>
        </div>

        <div v-else>
            <!-- Loop Customers -->
            <div v-for="customer in groupedOrders" :key="customer.id" class="mb-6">
                <div class="notification is-dark mb-3 py-3">
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                        <div class="is-flex is-align-items-center">
                            <span class="icon is-medium mr-2"><i class="fas fa-user-tie fa-lg"></i></span>
                            <h3 class="title is-5 has-text-white mb-0">
                                {{ customer.name }} ({{ customer.code }})
                            </h3>
                        </div>
                    </div>
                </div>

                <!-- Loop POs for this Customer -->
                <div v-for="po in customer.pos" :key="po.number" class="box mb-4 p-0 overflow-hidden shadow-sm">
                    <!-- PO Header -->
                    <div class="has-background-light p-3 is-flex is-justify-content-space-between is-align-items-center border-bottom">
                        <div class="tags has-addons mb-0">
                            <span class="tag is-dark">PO No.</span>
                            <span class="tag is-info is-medium">{{ po.number }}</span>
                            <span class="tag is-white is-medium border-left">{{ formatDate(po.date) }}</span>
                        </div>
                        <div class="has-text-grey">
                            <strong>{{ po.items.length }}</strong> items
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div class="table-container">
                        <table class="table is-fullwidth is-striped is-hoverable mb-0">
                            <thead>
                                <tr style="background-color: #fafafa;">
                                    <th width="80" class="has-text-centered">Order</th>
                                    <th width="220">Product Code</th>
                                    <th>Product Name</th>
                                    <th width="100" class="has-text-right">Qty</th>
                                    <th width="120" class="has-text-centered">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in po.items" :key="item.id">
                                    <td class="has-text-centered">{{ item.order || '-' }}</td>
                                    <td>{{ getProductCode(item.productId) }}</td>
                                    <td>{{ getProductName(item.productId) }}</td>
                                    <td class="has-text-right has-text-weight-bold">{{ item.quantity }}</td>
                                    <td class="has-text-centered">
                                        <div class="buttons is-centered are-small">
                                            <button class="button is-info is-light" @click="openModal(item)">
                                                <span class="icon"><i class="fas fa-edit"></i></span>
                                            </button>
                                            <button class="button is-danger is-light" @click="deleteOrder(item.id)">
                                                <span class="icon"><i class="fas fa-trash"></i></span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Form (Only for Editing) -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card" style="overflow: visible">
                <header class="modal-card-head">
                    <p class="modal-card-title">{{ isEditing ? 'Edit Item' : 'Add PO Item' }}</p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body" style="overflow: visible">
                    <!-- PO Number -->
                    <div class="field">
                        <label class="label">PO Number (Order ID) <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="text" v-model="form.orderId" placeholder="SOXXXXXXX" />
                        </div>
                    </div>

                    <!-- Date -->
                    <div class="field">
                        <label class="label">Date <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <VueDatePicker v-model="form.date" :formats="{ input: 'yyyy/MM/dd' }" :auto-apply="true"></VueDatePicker>
                        </div>
                    </div>

                    <!-- Order/Sequence -->
                    <div class="field">
                        <label class="label">Order (Sequence) <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="number" v-model.number="form.order" placeholder="1, 2, 3..." />
                        </div>
                    </div>

                    <!-- Company -->
                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Company Code <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.customerId">
                                            <option value="" disabled>Select Code</option>
                                            <option v-for="cust in sortedCustomersByCode" :key="cust.id" :value="cust.id">
                                                {{ cust.code }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label">Company Name <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.customerId">
                                            <option value="" disabled>Select Name</option>
                                            <option v-for="cust in sortedCustomers" :key="cust.id" :value="cust.id">
                                                {{ cust.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Product -->
                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Product Code <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.productId">
                                            <option value="" disabled>Select Code</option>
                                            <option v-for="prod in sortedProductsByCode" :key="prod.id" :value="prod.id">
                                                {{ prod.code }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label">Product Name <span class="has-text-danger">*</span></label>
                                <div class="control">
                                    <div class="select is-fullwidth">
                                        <select v-model="form.productId">
                                            <option value="" disabled>Select Name</option>
                                            <option v-for="prod in sortedProducts" :key="prod.id" :value="prod.id">
                                                {{ prod.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quantity -->
                    <div class="field">
                        <label class="label">Quantity <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="number" v-model.number="form.quantity" placeholder="0" />
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success" @click="submitForm" :class="{ 'is-loading': loading }">
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
import { usePoStore } from '../../stores/po'
import { useCustomerStore } from '../../stores/customers'
import { useProductStore } from '../../stores/products'

export default {
    name: 'AddPO',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,
            form: {
                orderId: '',
                date: '',
                customerId: '',
                productId: '',
                quantity: 0,
                order: 1
            },
        }
    },
    computed: {
        ...mapState(usePoStore, ['orders', 'loading', 'sortedOrders']),
        ...mapState(useCustomerStore, ['customers', 'sortedCustomers', 'sortedCustomersByCode']),
        ...mapState(useProductStore, ['products', 'sortedProducts', 'sortedProductsByCode']),
        
        groupedOrders() {
            const groups = {}
            this.sortedOrders.forEach(item => {
                const custId = item.customerId
                if (!groups[custId]) {
                    const customer = this.customers.find(c => c.id === custId)
                    groups[custId] = {
                        id: custId,
                        name: customer ? customer.name : 'Unknown Customer',
                        code: customer ? customer.code : 'N/A',
                        pos: {}
                    }
                }
                
                const poNum = item.orderId || 'No PO'
                if (!groups[custId].pos[poNum]) {
                    groups[custId].pos[poNum] = {
                        number: poNum,
                        date: item.date,
                        items: []
                    }
                }
                groups[custId].pos[poNum].items.push(item)
            })

            Object.values(groups).forEach(cust => {
                Object.values(cust.pos).forEach(po => {
                    po.items.sort((a, b) => (a.order || 0) - (b.order || 0))
                })
            })

            return groups
        }
    },
    methods: {
        ...mapActions(usePoStore, ['fetchOrders', 'addOrder', 'updateOrder', 'deleteOrder']),
        ...mapActions(useCustomerStore, ['fetchCustomers']),
        ...mapActions(useProductStore, ['fetchProducts']),

        getCustomerName(id) {
            const found = this.customers.find((c) => c.id === id)
            return found ? found.name : '-'
        },
        getProductCode(id) {
            const found = this.products.find((p) => p.id === id)
            return found ? found.code : '-'
        },
        getProductName(id) {
            const found = this.products.find((p) => p.id === id)
            return found ? found.name : '-'
        },
        formatDate(dateVal) {
            if (!dateVal) return ''
            let date = dateVal
            if (dateVal && typeof dateVal.toDate === 'function') {
                date = dateVal.toDate()
            } else if (!(dateVal instanceof Date)) {
                date = new Date(dateVal)
            }
            if (isNaN(date.getTime())) return String(dateVal)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        getTodayString() {
            const d = new Date()
            return d.toISOString().split('T')[0]
        },

        openModal(order = null) {
            if (order) {
                this.isEditing = true
                this.editingId = order.id
                this.form = { ...order }
            } else {
                // This part is technically not reachable now as button is disabled, 
                // but kept for safety.
                this.isEditing = false
                this.editingId = null
                this.form = {
                    orderId: '',
                    date: this.getTodayString(),
                    customerId: '',
                    productId: '',
                    quantity: 0,
                    order: 1
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
        },

        async submitForm() {
            if (!this.form.orderId || !this.form.date || !this.form.customerId || !this.form.productId || this.form.quantity <= 0) {
                alert('Please fill in all required fields.')
                return
            }

            let dateToSave = this.form.date
            if (dateToSave instanceof Date) {
                dateToSave = dateToSave.toISOString().split('T')[0]
            }

            const dataToSave = {
                ...this.form,
                date: dateToSave,
            }

            if (this.isEditing) {
                await this.updateOrder(this.editingId, dataToSave)
            } else {
                await this.addOrder(dataToSave)
            }
            this.closeModal()
        },
    },
    mounted() {
        this.fetchOrders()
        this.fetchCustomers()
        this.fetchProducts()
    },
}
</script>

<style scoped>
.border-bottom { border-bottom: 1px solid #dbdbdb; }
.border-left { border-left: 1px solid #dbdbdb !important; }
.overflow-hidden { overflow: hidden; }
.shadow-sm { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.modal-card, .modal-card-body { overflow: visible !important; }
</style>
