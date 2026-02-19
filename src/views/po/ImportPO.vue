<template>
    <div class="container is-fluid">
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Import Purchase Orders</h1>
            </div>
            <div class="level-right">
                <div class="file is-primary">
                    <label class="file-label">
                        <input class="file-input" type="file" @change="handleFileUpload" accept=".xlsx, .xls">
                        <span class="file-cta">
                            <span class="file-icon">
                                <i class="fas fa-upload"></i>
                            </span>
                            <span class="file-label">
                                Choose a file…
                            </span>
                        </span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Instructions -->
        <div class="notification is-info is-light">
            <p><strong>Instructions:</strong> Upload Excel file. Format: <strong>ARXXXXX</strong> in Col A, <strong>SOXXXXXXX</strong> in Col D (Date in Col E), <strong>Product lines</strong> (Seq in Col G, Code in Col H, Qty in Col J).</p>
        </div>

        <div v-if="loadingCustomers || loadingProducts || loading" class="notification is-warning is-light">
            <span class="icon"><i class="fas fa-spinner fa-pulse"></i></span>
            <span>Processing database... Please wait.</span>
        </div>

        <!-- Preview Area -->
        <div v-if="previewData.length > 0">
            <div class="level box py-3 mb-4">
                <div class="level-left">
                    <div>
                        <h2 class="subtitle mb-0">Found {{ previewData.length }} POs ({{ validItemsCount }} / {{ totalItemsCount }} valid items)</h2>
                        <p class="is-size-7 has-text-grey mt-1">
                            <span class="has-text-info">● New items</span> | 
                            <span class="has-text-warning-dark">● Duplicate (will be updated)</span>
                        </p>
                    </div>
                </div>
                <div class="level-right">
                    <button class="button is-success" @click="saveImportedData" :disabled="validItemsCount === 0" :class="{ 'is-loading': loading }">
                        <span class="icon"><i class="fas fa-save"></i></span>
                        <span>Process {{ validItemsCount }} Items</span>
                    </button>
                    <button class="button is-light ml-2" @click="clearPreview">Clear</button>
                </div>
            </div>

            <!-- Group by Customer -->
            <div v-for="(customerGroup, custCode) in groupedByCustomer" :key="custCode" class="mb-6">
                <div class="notification is-dark mb-3 py-3">
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                        <div class="is-flex is-align-items-center">
                            <span class="icon is-medium mr-2"><i class="fas fa-user-tie fa-lg"></i></span>
                            <h3 class="title is-5 has-text-white mb-0">
                                {{ customerGroup.customerName }} ({{ custCode }})
                            </h3>
                            <span v-if="!customerGroup.customerExists" class="tag is-danger ml-3">Customer Not Found</span>
                        </div>
                        <span class="tag is-light">{{ customerGroup.pos.length }} POs</span>
                    </div>
                </div>

                <!-- PO Cards -->
                <div v-for="(po, poIdx) in customerGroup.pos" :key="poIdx" class="box mb-4 p-0 overflow-hidden" :class="{'border-danger': hasProductError(po)}">
                    <div class="has-background-light p-3 is-flex is-justify-content-space-between is-align-items-center border-bottom">
                        <div class="tags has-addons mb-0">
                            <span class="tag is-dark">PO No.</span>
                            <span class="tag is-info is-medium">{{ po.poNumber }}</span>
                            <span class="tag is-white is-medium border-left">{{ po.poDate }}</span>
                        </div>
                        <div class="has-text-grey-dark">
                            <strong>{{ po.items.length }}</strong> items
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="table is-fullwidth is-striped is-hoverable mb-0">
                            <thead>
                                <tr style="background-color: #fafafa;">
                                    <th width="50" class="has-text-centered">Order</th>
                                    <th width="220">Product Code</th>
                                    <th>Product Name</th>
                                    <th width="100" class="has-text-right">Qty</th>
                                    <th width="120" class="has-text-centered">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, itemIdx) in po.items" :key="itemIdx" :class="{'has-background-danger-light': !item.exists}">
                                    <td class="has-text-centered">{{ item.order }}</td>
                                    <td :class="{'has-text-danger has-text-weight-bold': !item.exists}">{{ item.productCode }}</td>
                                    <td :class="{'has-text-danger': !item.exists}">{{ item.productName }}</td>
                                    <td class="has-text-right has-text-weight-bold">{{ item.quantity }}</td>
                                    <td class="has-text-centered">
                                        <template v-if="!item.exists">
                                            <span class="tag is-danger">Not Found</span>
                                        </template>
                                        <template v-else>
                                            <span v-if="item.isDuplicate" class="tag is-warning is-light" title="Item exists - will be overwritten">
                                                <span class="icon is-small mr-1"><i class="fas fa-sync-alt"></i></span> Overwrite
                                            </span>
                                            <span v-else class="tag is-success is-light">
                                                <span class="icon is-small mr-1"><i class="fas fa-plus"></i></span> New
                                            </span>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="fileProcessed && previewData.length === 0" class="notification is-warning is-light">
            <p>No valid data found. Check your Excel file structure.</p>
        </div>
    </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { mapState, mapActions } from 'pinia'
import { usePoStore } from '../../stores/po'
import { useCustomerStore } from '../../stores/customers'
import { useProductStore } from '../../stores/products'
import { db } from '../../firebase'
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import Jarvis from '../../utils/jarvis'

export default {
    name: 'ImportPO',
    data() {
        return {
            previewData: [],
            fileProcessed: false,
            loadingCustomers: false,
            loadingProducts: false
        }
    },
    computed: {
        ...mapState(usePoStore, ['orders', 'loading']),
        ...mapState(useCustomerStore, ['customers']),
        ...mapState(useProductStore, ['products']),
        
        groupedByCustomer() {
            const groups = {}
            this.previewData.forEach(po => {
                const custCode = po.customer.code
                if (!groups[custCode]) {
                    groups[custCode] = {
                        customerName: po.customer.name,
                        customerExists: po.customer.exists,
                        pos: []
                    }
                }
                groups[custCode].pos.push(po)
            })
            return groups
        },

        hasErrors() {
            return this.previewData.some(po => 
                !po.customer.exists || po.items.some(item => !item.exists)
            )
        },
        totalItemsCount() {
            return this.previewData.reduce((acc, po) => acc + po.items.length, 0)
        },
        validItemsCount() {
            let count = 0;
            this.previewData.forEach(po => {
                if (po.customer.exists) {
                    po.items.forEach(item => {
                        if (item.exists && item.quantity > 0) count++;
                    });
                }
            });
            return count;
        }
    },
    methods: {
        ...mapActions(usePoStore, ['fetchOrders']),
        ...mapActions(useCustomerStore, ['fetchCustomers']),
        ...mapActions(useProductStore, ['fetchProducts']),

        hasProductError(po) {
            return po.items.some(item => !item.exists)
        },

        async handleFileUpload(event) {
            const file = event.target.files[0]
            if (!file) return

            this.fileProcessed = false
            this.previewData = []

            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
                    if (!workbook.SheetNames.length) return
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
                    this.processRows(rows)
                    this.fileProcessed = true
                } catch (error) {
                    console.error('Error processing Excel file:', error)
                    Jarvis.error('Error reading Excel file: ' + error.message)
                }
            }
            reader.readAsArrayBuffer(file)
            event.target.value = ''
        },

        formatThaiDate(value) {
            if (value === null || value === undefined || value === '') return '-'
            let day, month, year;
            if (value instanceof Date) {
                day = value.getDate();
                month = value.getMonth() + 1;
                year = value.getFullYear();
            } else {
                const dateStr = String(value).trim()
                const parts = dateStr.split(/[\/\-]/)
                if (parts.length === 3) {
                    if (parts[2].length === 4 || parseInt(parts[2]) > 31) {
                        year = parseInt(parts[2])
                        const p0 = parseInt(parts[0]); const p1 = parseInt(parts[1])
                        if (p0 > 12) { day = p0; month = p1; }
                        else if (p1 > 12) { day = p1; month = p0; }
                        else { month = p0; day = p1; }
                    } else if (parts[0].length === 4 || parseInt(parts[0]) > 31) {
                        year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
                    } else {
                        year = parseInt(parts[2]); month = parseInt(parts[0]); day = parseInt(parts[1]);
                    }
                } else return dateStr
            }
            if (year < 100) {
                if (year > 40) year += 2500; else year += 2000;
            }
            if (year > 2400) year = year - 543
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        },

        processRows(rows) {
            const customerRegex = /AR\d{5}/
            const poRegex = /SO\d{7}/
            const groupedPOs = []
            let currentCustomer = null
            let currentPO = null
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i]
                const colAValue = String(row[0] || '').trim()
                const customerMatch = colAValue.match(customerRegex)
                
                if (customerMatch) {
                    const customerCode = customerMatch[0]
                    const customer = this.customers.find(c => String(c.code || '').trim() === customerCode)
                    currentCustomer = {
                        code: customerCode,
                        name: customer ? customer.name : '-',
                        exists: !!customer,
                        id: customer ? customer.id : null
                    }
                    currentPO = null
                    continue
                }

                const colDValue = String(row[3] || '').trim()
                const poMatch = colDValue.match(poRegex)
                
                if (poMatch && currentCustomer) {
                    currentPO = {
                        customer: { ...currentCustomer },
                        poNumber: poMatch[0],
                        poDate: this.formatThaiDate(row[4]),
                        items: []
                    }
                    groupedPOs.push(currentPO)
                    continue
                }

                const colGValue = String(row[6] || '').trim()
                if (colGValue && !isNaN(colGValue) && parseInt(colGValue) > 0 && currentPO) {
                    const productCode = String(row[7] || '').trim()
                    if (productCode) {
                        const product = this.products.find(p => String(p.code || '').trim() === productCode)
                        const orderNum = parseInt(colGValue)
                        
                        // Check for duplicate in existing database
                        const existingOrder = this.orders.find(o => 
                            o.orderId === currentPO.poNumber && 
                            o.order === orderNum
                        )

                        currentPO.items.push({
                            order: orderNum,
                            productCode: productCode,
                            productName: product ? product.name : '-',
                            exists: !!product,
                            productId: product ? product.id : null,
                            quantity: parseFloat(row[9] || 0),
                            isDuplicate: !!existingOrder,
                            existingId: existingOrder ? existingOrder.id : null
                        })
                    }
                }
            }
            this.previewData = groupedPOs
        },

        clearPreview() {
            this.previewData = []
            this.fileProcessed = false
        },

        async saveImportedData() {
            if (this.validItemsCount === 0) {
                Jarvis.alert('No valid items to process.')
                return
            }

            const duplicates = this.previewData.reduce((count, po) => {
                return count + po.items.filter(item => item.isDuplicate).length
            }, 0)

            const message = duplicates > 0 
                ? `Found ${duplicates} existing items. These will be updated with new data. Continue?`
                : `Save ${this.validItemsCount} new items to database?`

            if (!await Jarvis.confirm(message)) return

            try {
                const batch = writeBatch(db)
                const poCollection = collection(db, 'con-po')

                this.previewData.forEach(po => {
                    if (po.customer.exists && po.customer.id) {
                        po.items.forEach(item => {
                            if (item.exists && item.productId && item.quantity > 0) {
                                let docRef;
                                if (item.isDuplicate && item.existingId) {
                                    // Update existing
                                    docRef = doc(db, 'con-po', item.existingId)
                                } else {
                                    // Create new
                                    docRef = doc(poCollection)
                                }

                                const dataToSave = {
                                    orderId: po.poNumber,
                                    date: po.poDate,
                                    customerId: po.customer.id,
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    order: item.order,
                                    updatedAt: serverTimestamp()
                                }

                                // Only set createdAt for new items to avoid "undefined" error in batch.set
                                if (!item.isDuplicate) {
                                    dataToSave.createdAt = serverTimestamp()
                                }

                                batch.set(docRef, dataToSave, { merge: true })
                            }
                        })
                    }
                })

                await batch.commit()
                Jarvis.success(`Successfully processed ${this.validItemsCount} items!`)
                this.clearPreview()
                await this.fetchOrders()
            } catch (error) {
                console.error('Error processing data:', error)
                Jarvis.error('Error: ' + error.message)
            }
        }
    },
    async mounted() {
        if (this.orders.length === 0) await this.fetchOrders()
        if (this.customers.length === 0) {
            this.loadingCustomers = true
            try { await this.fetchCustomers() } finally { this.loadingCustomers = false }
        }
        if (this.products.length === 0) {
            this.loadingProducts = true
            try { await this.fetchProducts() } finally { this.loadingProducts = false }
        }
    }
}
</script>

<style scoped>
.border-bottom { border-bottom: 1px solid #dbdbdb; }
.border-left { border-left: 1px solid #dbdbdb !important; }
.overflow-hidden { overflow: hidden; }
.border-danger { border: 2px solid #ff3860 !important; }
.has-background-danger-light { background-color: #feecf0 !important; }
</style>
