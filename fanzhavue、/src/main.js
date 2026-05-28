
// #ifndef VUE3
import Vue from 'vue'
import App from './App'
import themeGuardianMixin from './mixins/themeGuardian.js'

Vue.config.productionTip = false
Vue.mixin(themeGuardianMixin)

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import App from './App.vue'
import themeGuardianMixin from './mixins/themeGuardian.js'
export function createApp() {
  const app = createSSRApp(App)
  app.mixin(themeGuardianMixin)
  return {
    app
  }
}
// #endif