<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Stock In (Purchase to Stock)</h1>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Stock In</span>
                </button>
            </div>
        </div>

        <div class="notification is-info is-light">
            Record items purchased to replenish your stock. These will be added to your current
            stock calculation if they were received after the last stock count.
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Reference/Invoice</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th class="has-text-centered">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="5" class="has-text-centered py-5">
                                <span class="icon is-large"
                                    ><i class="fas fa-spinner fa-pulse fa-2x"></i
                                ></span>
                                <p>Loading...</p>
                            </td>
                        </tr>
                        <tr v-else v-for="record in stockInRecords" :key="record.id">
                            <td>{{ formatDate(record.date) }}</td>
                            <td>{{ record.reference || '-' }}</td>
                            <td>{{ getProductName(record.productId) }}</td>
                            <td class="has-text-weight-bold has-text-success">
                                +{{ formatNumber(record.quantity) }}
                            </td>
                            <td class="has-text-centered">
                                <div class="buttons is-centered are-small">
                                    <button
                                        class="button is-info is-light"
                                        @click="openModal(record)"
                                    >
                                        <span class="icon"><i class="fas fa-edit"></i></span>
                                    </button>
                                    <button
                                        class="button is-danger is-light"
                                        @click="deleteRecord(record.id)"
                                    >
                                        <span class="icon"><i class="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && stockInRecords.length === 0">
                            <td colspan="5" class="has-text-centered has-text-grey py-5">
                                No Stock In records found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Form -->
        <div class="modal" :class="{ 'is-active': isModalActive }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card" style="overflow: visible">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        {{ isEditing ? 'Edit Stock In' : 'Add Stock In' }}
                    </p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body" style="overflow: visible">
                    <!-- Date -->
                    <div class="field">
                        <label class="label"
                            >Received Date <span class="has-text-danger">*</span></label
                        >
                        <div class="control">
                            <VueDatePicker
                                v-model="form.date"
                                :formats="{ input: 'yyyy/MM/dd' }"
                                :auto-apply="true"
                            ></VueDatePicker>
                        </div>
                    </div>

                    <!-- Reference -->
                    <div class="field">
                        <label class="label">Reference / Invoice No.</label>
                        <div class="control">
                            <input
                                class="input"
                                type="text"
                                v-model="form.reference"
                                placeholder="e.g. INV-2023-001"
                            />
                        </div>
                    </div>

                    <!-- Product Selectors -->
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
                                                v-for="prod in sortedByCode"
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
                                                v-for="prod in sortedByName"
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
import { useStockInStore } from '../../stores/stockIn'
import { useProductStore } from '../../stores/products'
import Jarvis from '../../utils/jarvis'

export default {
    name: 'AddStockIn',
    data() {
        return {
            isModalActive: false,
            isEditing: false,
            editingId: null,
            form: {
                date: '',
                productId: '',
                quantity: 0,
                reference: '',
            },
        }
    },
    computed: {
        ...mapState(useStockInStore, ['stockInRecords', 'loading']),
        ...mapState(useProductStore, ['products']),
        
        sortedByCode() {
            return [...this.products].sort((a, b) => 
                String(a.code).localeCompare(String(b.code))
            )
        },
        sortedByName() {
            return [...this.products].sort((a, b) => 
                String(a.name).localeCompare(String(b.name))
            )
        }
    },
    methods: {
        ...mapActions(useStockInStore, [
            'fetchStockInRecords',
            'addStockIn',
            'updateStockIn',
            'deleteStockIn',
        ]),
        ...mapActions(useProductStore, ['fetchProducts']),

        getProductName(id) {
            const found = this.products.find((p) => p.id === id)
            return found ? found.name : '-'
        },
        formatDate(dateStr) {
            if (!dateStr) return ''
            if (typeof dateStr === 'string') return dateStr.split('T')[0]
            if (dateStr instanceof Date) {
                return dateStr.toISOString().split('T')[0]
            }
            return ''
        },
        formatNumber(val) {
            if (val === undefined || val === null) return '0'
            return val.toLocaleString()
        },
        getTodayString() {
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },
        openModal(record = null) {
            if (record) {
                this.isEditing = true
                this.editingId = record.id
                this.form = { ...record }
            } else {
                this.isEditing = false
                this.editingId = null
                this.form = {
                    date: this.getTodayString(),
                    productId: '',
                    quantity: 0,
                    reference: '',
                }
            }
            this.isModalActive = true
        },
        closeModal() {
            this.isModalActive = false
        },
        async deleteRecord(id) {
            if (await Jarvis.confirm('Are you sure you want to delete this record?')) {
                await this.deleteStockIn(id)
                Jarvis.toast('Deleted successfully')
            }
        },
        async submitForm() {
            if (!this.form.date || !this.form.productId || this.form.quantity <= 0) {
                Jarvis.alert('Please fill in all required fields.')
                return
            }

            // Convert Date object to string if necessary for consistency
            if (this.form.date instanceof Date) {
                this.form.date = this.formatDate(this.form.date)
            }

            try {
                if (this.isEditing) {
                    await this.updateStockIn(this.editingId, this.form)
                } else {
                    await this.addStockIn(this.form)
                }
                this.closeModal()
                Jarvis.toast('Saved successfully')
            } catch (error) {
                Jarvis.error(error.message)
            }
        },
    },
    mounted() {
        this.fetchStockInRecords()
        this.fetchProducts()
    },
}
</script>

<style scoped>
.modal-card,
.modal-card-body {
    overflow: visible !important;
}
</style>
