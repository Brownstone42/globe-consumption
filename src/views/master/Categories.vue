<template>
    <div class="container is-fluid">
        <!-- Header -->
        <div class="level mb-4">
            <div class="level-left">
                <h1 class="title is-4">Categories Management</h1>
            </div>
            <div class="level-right">
                <button class="button is-primary" @click="openModal()">
                    <span class="icon"><i class="fas fa-plus"></i></span>
                    <span>Add Category</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="box">
            <div class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Category Name</th>
                            <th class="has-text-centered" style="width: 120px">Actions</th>
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
                        <tr v-else v-for="category in categories" :key="category.id">
                            <td>
                                <strong>{{ category.code }}</strong>
                            </td>
                            <td>{{ category.name }}</td>
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
                        <tr v-if="!loading && categories.length === 0">
                            <td colspan="3" class="has-text-centered has-text-grey py-5">
                                No categories found. Click "Add Category" to create one.
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
            form: {
                code: '',
                name: '',
            },
        }
    },
    computed: {
        ...mapState(useCategoryStore, ['categories', 'loading']),
    },
    methods: {
        ...mapActions(useCategoryStore, [
            'fetchCategories',
            'addCategory',
            'updateCategory',
            'deleteCategory',
        ]),

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
</style>
