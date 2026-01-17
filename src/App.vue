<template>
    <!-- 1. กรณี Login แล้ว : แสดง Dashboard Layout -->
    <div v-if="user" class="dashboard-layout">
        <MainHeader @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

        <div class="columns is-gapless mb-0">
            <!-- Sidebar Column (ซ่อนใน Mobile ถ้าไม่ได้เปิด) -->
            <div
                class="column is-2 is-hidden-touch"
                style="min-height: 100vh; background-color: #f5f5f5"
            >
                <Sidebar />
            </div>

            <!-- Mobile Sidebar (Drawer) -->
            <div
                v-if="isSidebarOpen"
                class="column is-full is-hidden-desktop"
                style="background-color: #f5f5f5"
            >
                <Sidebar />
            </div>

            <!-- Main Content Column -->
            <div class="column" style="background-color: #fff; min-height: 100vh">
                <div class="section">
                    <router-view></router-view>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. กรณียังไม่ Login : แสดงหน้า Login Screen -->
    <section v-else class="hero is-fullheight is-light">
        <div class="hero-body">
            <div class="container has-text-centered">
                <div class="column is-4 is-offset-4">
                    <div class="box">
                        <figure class="image is-64x64 is-inline-block mb-4">
                            <!-- Icon อะไรก็ได้ -->
                            <i class="fas fa-cubes fa-3x has-text-primary"></i>
                        </figure>
                        <h3 class="title has-text-grey">Login</h3>
                        <p class="subtitle has-text-grey">Please login to proceed.</p>

                        <button @click="login" class="button is-primary is-fullwidth is-large">
                            <span class="icon">
                                <i class="fab fa-google"></i>
                            </span>
                            <span>Login with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from './stores/auth'
import MainHeader from './components/mainHeader.vue'
import Sidebar from './components/Sidebar.vue'

export default {
    name: 'App',
    components: {
        MainHeader,
        Sidebar,
    },
    data() {
        return {
            isSidebarOpen: false,
        }
    },
    computed: {
        ...mapState(useAuthStore, ['user']),
    },
    methods: {
        ...mapActions(useAuthStore, ['login', 'initAuth']),
    },
    mounted() {
        this.initAuth()
    },
}
</script>

<style>
html,
body {
    height: 100%;
    overflow-y: hidden; /* ป้องกัน scroll ซ้อน */
}
.dashboard-layout {
    height: 100vh;
    overflow-y: auto;
}
</style>
