<template>
  <div id="app">
    <Navigation />

    <router-view />

    <div class="bg-blue font-sans h-44 text-white p-10">
      <router-link to="/faq" class="px-1"> FAQ </router-link>
      <button @click="gotoContact" class="px-1 focus:outline-none">
        お問い合わせ
      </button>
      <p class="text-xs">開発・運営 © 2021 @pengin_enginner ペンギン丸</p>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'
import Navigation from '@/components/Navigation.vue'
import VueSocialSharing from 'vue-social-sharing'

Vue.use(VueClipboard, VueSocialSharing)
export default {
  components: {
    Navigation,
  },
  methods: {
    gotoContact() {
      window.open(`https://forms.gle/1uCV8gduy8PZu4jE9`)
    },
  },
}
</script>
<style>
#app {
  text-align: center;
  color: #2c3e50;
  @apply font-sans;
}
.description {
  @apply font-bold text-gray-900 text-xl text-blue-500;
}
.main_button {
  @apply inline-block px-6 py-2 font-medium leading-6 text-center text-white uppercase transition bg-blue-400 rounded shadow hover:shadow-lg hover:bg-indigo-500 focus:outline-none;
}
.submit_button {
  @apply mt-4 inline-block px-6 py-2 font-medium leading-6 text-center text-white uppercase transition bg-indigo-500 rounded shadow hover:shadow-lg hover:bg-indigo-800 focus:outline-none;
}
.delete-button {
  @apply inline-block px-4 py-1 font-medium leading-6 text-center transition text-red-500 border-4 transition border-red-500  transition bg-transparent rounded shadow hover:shadow-lg hover:bg-red-500 hover:text-white focus:shadow-lg focus:bg-red-500 focus:text-white focus:outline-none;
}
.upload_button {
  @apply inline-block px-4 py-2 font-medium leading-6 text-center text-blue-500 uppercase transition bg-transparent border-2 border-blue-500 rounded-md hover:bg-blue-100 focus:outline-none;
}
.input-form {
  @apply px-2 py-1 border border-blue-200 hover:border-blue-400 rounded-sm placeholder-gray-300 outline-none;
}
</style>
