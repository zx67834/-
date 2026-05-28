<template>
	<view class="sec-redirect">
		<view class="sec-hint">正在打开安全报告…</view>
	</view>
</template>

<script>
	export default {
		onLoad() {
			uni.redirectTo({
				url: '/pages/report/index',
				fail: () => {
					uni.navigateTo({ url: '/pages/report/index' })
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.sec-redirect {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f7fb;
	}
	.sec-hint {
		font-size: 28rpx;
		color: #63708c;
	}
</style>
