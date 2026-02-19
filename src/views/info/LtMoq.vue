<template>
    <div class="container is-fluid">
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Lead Time & MOQ</h1>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add LT & MOQ</span>
                </button>
            </div>
        </div>

        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Supplier</th>
                            <th class="has-text-centered">Lead Time</th>
                            <th class="has-text-centered">MOQ</th>
                            <th class="has-text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in moqList" :key="item.id">
                            <td>{{ getCategoryName(item.categoryId) }}</td>
                            <td>{{ item.supplier }}</td>
                            <td class="has-text-centered">{{ item.leadTime }}</td>
                            <td class="has-text-centered">{{ item.moq }}</td>
                            <td class="has-text-right">
                                <button class="button is-small is-info is-light mr-1" @click="openModal(item)">
                                    <span class="icon is-small"><i class="fas fa-edit"></i></span>
                                </button>
                                <button class="button is-small is-danger is-light" @click="confirmDelete(item)">
                                    <span class="icon is-small"><i class="fas fa-trash"></i></span>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="moqList.length === 0 && !loading">
                            <td colspan="5" class="has-text-centered has-text-grey py-5">No data found</td>
                        </tr>
                        <tr v-if="loading">
                            <td colspan="5" class="has-text-centered py-5">
                                <span class="icon"><i class="fas fa-spinner fa-pulse"></i></span> Loading...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div class="modal" :class="{ 'is-active': showModal }">
            <div class="modal-background" @click="closeModal"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">{{ isEditing ? 'Edit' : 'Add' }} LT & MOQ</p>
                    <button class="delete" aria-label="close" @click="closeModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="field">
                        <label class="label">Category</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select v-model="form.categoryId" required>
                                    <option value="" disabled>Select Category</option>
                                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                        {{ cat.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <label class="label">Supplier Name</label>
                        <div class="control">
                            <input class="input" type="text" v-model="form.supplier" placeholder="Supplier name" required>
                        </div>
                    </div>
                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Lead Time</label>
                                <div class="control">
                                    <input class="input" type="text" v-model="form.leadTime" placeholder="e.g. 7 days, 2 weeks" required>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label">MOQ</label>
                                <div class="control">
                                    <input class="input" type="text" v-model="form.moq" placeholder="e.g. 1,000 บาท, 50 ชิ้น" required>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success" @click="saveMoq" :class="{ 'is-loading': saving }">Save changes</button>
                    <button class="button" @click="closeModal">Cancel</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useMoqStore } from '../../stores/moq'
import { useCategoryStore } from '../../stores/categories'
import Jarvis from '../../utils/jarvis'

export default {
    name: 'LtMoq',
    data() {
        return {
            showModal: false,
            isEditing: false,
            saving: false,
            form: {
                id: null,
                categoryId: '',
                supplier: '',
                leadTime: '',
                moq: ''
            }
        }
    },
    computed: {
        ...mapState(useMoqStore, ['moqList', 'loading']),
        ...mapState(useCategoryStore, ['categories'])
    },
    methods: {
        ...mapActions(useMoqStore, ['fetchMoqList', 'addMoq', 'updateMoq', 'deleteMoq']),
        ...mapActions(useCategoryStore, ['fetchCategories']),

        getCategoryName(id) {
            const cat = this.categories.find(c => c.id === id)
            return cat ? cat.name : 'Unknown'
        },

        openModal(item = null) {
            if (item) {
                this.isEditing = true
                this.form = { ...item }
            } else {
                this.isEditing = false
                this.form = {
                    id: null,
                    categoryId: '',
                    supplier: '',
                    leadTime: '',
                    moq: ''
                }
            }
            this.showModal = true
        },

        closeModal() {
            this.showModal = false
        },

        async saveMoq() {
            if (!this.form.categoryId || !this.form.supplier) {
                Jarvis.alert('Please fill in all required fields')
                return
            }

            this.saving = true
            try {
                if (this.isEditing) {
                    const { id, ...data } = this.form
                    await this.updateMoq(id, data)
                } else {
                    const { id, ...data } = this.form
                    await this.addMoq(data)
                }
                this.closeModal()
                Jarvis.toast('Saved successfully')
            } catch (error) {
                Jarvis.error('Error saving data: ' + error.message)
            } finally {
                this.saving = false
            }
        },

        async confirmDelete(item) {
            if (await Jarvis.confirm(`Are you sure you want to delete LT & MOQ for ${this.getCategoryName(item.categoryId)}?`)) {
                try {
                    await this.deleteMoq(item.id)
                    Jarvis.toast('Deleted successfully')
                } catch (error) {
                    Jarvis.error('Error deleting: ' + error.message)
                }
            }
        }
    },
    async mounted() {
        if (this.moqList.length === 0) await this.fetchMoqList()
        if (this.categories.length === 0) await this.fetchCategories()
    }
}
</script>
