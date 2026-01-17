<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Purchase Order List</h1>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add PO</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Company Name</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th class="has-text-centered">Actions</th>
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
                        <tr v-else v-for="order in orders" :key="order.id">
                            <td>
                                <strong>{{ order.orderId }}</strong>
                            </td>
                            <td>{{ formatDate(order.date) }}</td>
                            <td>{{ getCustomerName(order.customerId) }}</td>
                            <td>{{ getProductName(order.productId) }}</td>
                            <td>{{ order.quantity }}</td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(order)"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteOrder(order.id)"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && orders.length === 0">
                            <td colspan="6" class="has-text-centered has-text-grey py-5">
                                No Purchase Orders found.
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
                    <p class="modal-card-title">{{ isEditing ? 'Edit PO' : 'Add PO' }}</p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <!-- 1. Order ID -->
                    <div class="field">
                        <label class="label">Order ID <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.orderId"
                                placeholder="e.g. PO-2023-001"
                            />
                        </div>
                    </div>

                    <!-- 2. Date -->
                    <div class="field">
                        <label class="label">Date <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="date" v-model="form.date" />
                        </div>
                    </div>

                    <!-- 3 & 4. Company (Code & Name) -->
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
                                                v-for="cust in customers"
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
                                                v-for="cust in customers"
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

                    <!-- 5 & 6. Product (Code & Name) -->
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
                                                v-for="prod in products"
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
                                                v-for="prod in products"
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

                    <!-- Quantity -->
                    <div class="field">
                        <label class="label">Quantity <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input
                                class="input"
                                type="number"
                                v-model.number="form.quantity"
                                placeholder="0"
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
            },
        }
    },
    computed: {
        ...mapState(usePoStore, ['orders', 'loading']),
        ...mapState(useCustomerStore, ['customers']),
        ...mapState(useProductStore, ['products']),
    },
    methods: {
        ...mapActions(usePoStore, ['fetchOrders', 'addOrder', 'updateOrder', 'deleteOrder']),
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
        formatDate(dateStr) {
            if (!dateStr) return ''
            const date = new Date(dateStr)
            if (isNaN(date)) return dateStr
            return date.toLocaleDateString('en-CA') // YYYY-MM-DD
        },

        openModal(order = null) {
            if (order) {
                this.isEditing = true
                this.editingId = order.id
                this.form = { ...order }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    orderId: '',
                    date: new Date().toISOString().substr(0, 10),
                    customerId: '',
                    productId: '',
                    quantity: 0,
                }
            }
            this.isModalActive = true
        },

        closeModal() {
            this.isModalActive = false
            this.form = { orderId: '', date: '', customerId: '', productId: '', quantity: 0 }
        },

        async submitForm() {
            if (
                !this.form.orderId ||
                !this.form.date ||
                !this.form.customerId ||
                !this.form.productId ||
                this.form.quantity <= 0
            ) {
                alert('Please fill in all required fields and ensure quantity is greater than 0.')
                return
            }

            if (this.isEditing) {
                await this.updateOrder(this.editingId, this.form)
            } else {
                await this.addOrder(this.form)
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
.table td,
.table th {
    vertical-align: middle;
}
</style>
