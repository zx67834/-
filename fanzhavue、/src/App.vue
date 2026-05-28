<script>
	import { applyMiniProgramBackground, applyTabBarStyleForIdentity } from '@/utils/themeGuardian.js'
	import { pollGuardianHighRiskModals } from '@/utils/guardianRiskAlert.js'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			applyMiniProgramBackground()
			applyTabBarStyleForIdentity()
		},
		onShow: function() {
			console.log('App Show')
			applyMiniProgramBackground()
			applyTabBarStyleForIdentity()
			pollGuardianHighRiskModals()
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	page {
		background: radial-gradient(circle at top right, #eef4ff 0%, #f4f7fc 38%, #f6f8fc 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
		color: #1f2a44;
	}

	/* 监护人账号：页面根节点加 class theme-guardian，整体偏红 */
	.theme-guardian {
		background: linear-gradient(180deg, #fff8f8 0%, #ffeeee 42%, #fce8ea 100%) !important;
	}

	.theme-guardian .glass-card {
		border-color: rgba(198, 40, 40, 0.14);
		box-shadow: 0 12rpx 28rpx rgba(90, 20, 30, 0.07);
	}

	.theme-guardian .brand-title,
	.theme-guardian .title,
	.theme-guardian .page-title,
	.theme-guardian .panel-title {
		color: #7f1d1d !important;
	}

	.theme-guardian .logo-dot,
	.theme-guardian .icon-circle {
		background: linear-gradient(145deg, #ef5350, #c62828) !important;
		box-shadow: 0 12rpx 28rpx rgba(198, 40, 40, 0.35) !important;
	}

	.theme-guardian .detect-card {
		background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%) !important;
		box-shadow: 0 16rpx 36rpx rgba(183, 28, 28, 0.35) !important;
	}

	.theme-guardian .login-btn,
	.theme-guardian .confirm-btn,
	.theme-guardian .save-btn,
	.theme-guardian .analyze-btn,
	.theme-guardian .send-btn,
	.theme-guardian .submit,
	.theme-guardian .dialog-btn.submit {
		background: linear-gradient(135deg, #ef5350, #c62828) !important;
		border-color: #c62828 !important;
		color: #fff !important;
	}

	.theme-guardian .register-btn,
	.theme-guardian .ghost-btn {
		border-color: rgba(198, 40, 40, 0.35) !important;
		color: #c62828 !important;
	}

	.theme-guardian .level,
	.theme-guardian .safety-score .score-circle {
		background: linear-gradient(135deg, #ff8a80, #e53935) !important;
		color: #fff !important;
	}

	.theme-guardian .primary-btn {
		color: #c62828 !important;
		border-color: rgba(198, 40, 40, 0.45) !important;
	}

	.theme-guardian .bg-glow {
		background: radial-gradient(circle, rgba(239, 83, 80, 0.22), rgba(239, 83, 80, 0)) !important;
	}

	:root {
		--page-title-size: 42rpx;
		--page-title-weight: 700;
		--page-title-color: #1f2a44;
		--page-title-line-height: 1.2;
	}

	view,
	button,
	input {
		box-sizing: border-box;
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.86);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.8);
		box-shadow: 0 12rpx 30rpx rgba(29, 48, 92, 0.08);
	}

	.pressable {
		transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
	}

	.pressable:active {
		transform: scale(0.96);
		opacity: 0.85;
	}

	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.3s ease;
	}

	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}

	.slide-up-enter-active,
	.slide-up-leave-active {
		transition: all 0.3s ease;
	}

	.slide-up-enter-from {
		transform: translateY(50rpx);
		opacity: 0;
	}

	.slide-up-leave-to {
		transform: translateY(-50rpx);
		opacity: 0;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
