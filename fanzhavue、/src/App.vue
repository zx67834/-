<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
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
