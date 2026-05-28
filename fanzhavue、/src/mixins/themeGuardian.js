import { readIsGuardianUser, applyMiniProgramBackground, applyTabBarStyleForIdentity } from '@/utils/themeGuardian.js'
import { pollGuardianHighRiskModals } from '@/utils/guardianRiskAlert.js'

export default {
	data() {
		return {
			isGuardianTheme: false
		}
	},
	onShow() {
		this.refreshGuardianTheme()
		pollGuardianHighRiskModals()
	},
	methods: {
		/**
		 * Vue 3 下 accounts 等数据的 watch 写入 storage 在微任务中执行；
		 * 若同步调用本方法，readIsGuardianUser() 会读到旧缓存，导致小程序窗口背景色不更新。
		 */
		refreshGuardianTheme() {
			const apply = () => {
				this.isGuardianTheme = readIsGuardianUser()
				applyMiniProgramBackground()
				applyTabBarStyleForIdentity()
			}
			if (typeof this.$nextTick === 'function') {
				this.$nextTick(apply)
			} else {
				apply()
			}
		}
	}
}
