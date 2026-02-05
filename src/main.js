import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

import App from './App.vue'
import router from './router'

import 'bulma/css/bulma.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

const app = createApp(App)

app.component('VueDatePicker', VueDatePicker)

app.use(createPinia())
app.use(router)

app.mount('#app')
