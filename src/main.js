import Vue from 'vue';
import App from './App.vue';
import axios from 'axios';
import {axiosBaseUrl} from './config/config'
import qs from 'qs';
import iView from 'iview';
import 'iview/dist/styles/iview.css';

Vue.config.productionTip = false;
Vue.use(iView);

Vue.prototype.$axios = axios;

// 设置axios默认属性
axios.defaults.baseURL = axiosBaseUrl;
axios.defaults.transformRequest = [data => { return qs.stringify(data) }];
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.withCredentials = true;

new Vue({
  render: h => h(App)
}).$mount('#app');
