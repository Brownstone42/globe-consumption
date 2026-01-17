<template>
    <div class="container is-fluid">
        <!-- Header ส่วนหัว -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Customer Management</h1>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Customer</span>
                </button>
            </div>
        </div>

        <!-- ตารางแสดงข้อมูล -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Status</th>
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
                        <tr v-else v-for="customer in customers" :key="customer.id">
                            <td>
                                <strong>{{ customer.code }}</strong>
                            </td>
                            <td>{{ customer.name }}</td>
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
                        <tr v-if="!loading && customers.length === 0">
                            <td colspan="4" class="has-text-centered has-text-grey py-5">
                                No customers found. Click "Add Customer" to create one.
                            </td>
                        </tr>
                    </tbody>
                </table>
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
            form: {
                code: '',
                name: '',
                status: 'active',
            },
        }
    },
    computed: {
        ...mapState(useCustomerStore, ['customers', 'loading']),
    },
    methods: {
        ...mapActions(useCustomerStore, [
            'fetchCustomers',
            'addCustomer',
            'updateCustomer',
            'deleteCustomer',
        ]),

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
</style>
