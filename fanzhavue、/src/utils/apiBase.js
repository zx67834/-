/** 真机调试：把下面改成 ipconfig 里 WLAN 的 IPv4，如 http://172.18.195.62:7007 */

const DEBUG_API_BASE = 'http://172.18.195.62:7007'



/** 电脑模拟器调试可改回 http://127.0.0.1:7007 */

const SIMULATOR_API_BASE = 'http://127.0.0.1:7007'



/** 与系统设置「后端 API 根地址」一致；未设置时用 DEBUG_API_BASE */

export function getApiBaseUrl() {

	const custom = String(uni.getStorageSync('api_base_url') || '').trim()

	if (custom) return custom.replace(/\/+$/, '')

	// #ifdef MP-WEIXIN

	return DEBUG_API_BASE

	// #endif

	return SIMULATOR_API_BASE

}


