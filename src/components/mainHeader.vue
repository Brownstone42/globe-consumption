<template>
    <nav class="navbar is-white has-shadow" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="#">
                <span class="icon-text">
                    <span class="icon">
                        <i class="fas fa-cubes has-text-primary"></i>
                    </span>
                    <span class="has-text-weight-bold ml-2">Stock Manager</span>
                </span>
            </a>

            <!-- ปุ่ม Hamburger สำหรับ Mobile (จะไป toggle sidebar ใน App.vue แทน) -->
            <a
                role="button"
                class="navbar-burger"
                aria-label="menu"
                aria-expanded="false"
                @click="$emit('toggle-sidebar')"
            >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </a>
        </div>

        <div class="navbar-menu">
            <div class="navbar-end">
                <div class="navbar-item">
                    <!-- User Profile & Logout -->
                    <div v-if="user" class="buttons">
                        <figure class="image is-32x32 mr-3" v-if="user.photoURL">
                            <img class="is-rounded" :src="user.photoURL" alt="User" />
                        </figure>
                        <span class="mr-3 has-text-weight-medium is-hidden-touch">
                            {{ user.displayName }}
                        </span>
                        <button @click="logout" class="button is-danger is-outlined is-small">
                            <span class="icon"><i class="fas fa-sign-out-alt"></i></span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '../stores/auth'

export default {
    name: 'MainHeader',
    emits: ['toggle-sidebar'], // บอกว่า component นี้จะส่ง event ออกไป
    computed: {
        ...mapState(useAuthStore, ['user']),
    },
    methods: {
        ...mapActions(useAuthStore, ['logout', 'initAuth']),
    },
    mounted() {
        this.initAuth()
    },
}
</script>

<style scoped></style>
