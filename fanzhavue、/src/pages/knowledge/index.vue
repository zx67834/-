<template>
	<scroll-view class="page" scroll-y>
		<view class="bg-glow"></view>
		<view class="panel glass-card">
			<view class="panel-title">知识库检索</view>
			<view class="search-wrap">
				<uni-icons type="search" size="16" color="#A0A6B4"></uni-icons>
				<input class="search-input" placeholder="输入关键词检索" v-model="keyword" />
			</view>
			<view class="picker-row">
				<view class="picker-col">
					<view class="picker-label">分类筛选</view>
					<picker mode="selector" :range="categories" :value="categoryIndex" @change="e => categoryIndex = Number(e.detail.value)">
						<view class="picker-value">{{ categories[categoryIndex] }}</view>
					</picker>
				</view>
				<view class="picker-col">
					<view class="picker-label">风险筛选</view>
					<picker mode="selector" :range="levels" :value="levelIndex" @change="e => levelIndex = Number(e.detail.value)">
						<view class="picker-value">{{ levels[levelIndex] }}</view>
					</picker>
				</view>
			</view>
			<view class="btn-row">
				<button class="btn primary" size="mini" @click="search">搜索</button>
				<button class="btn ghost" size="mini" @click="resetFilter">重置</button>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">知识条目</view>
			<view class="entry" v-for="item in filteredList" :key="item.id" hover-class="entry-hover" @click="viewEntry(item)">
				<view class="entry-main">
					<view class="entry-title">{{ item.title }}</view>
					<view class="entry-desc">{{ item.desc }}</view>
					<view class="entry-meta">{{ item.tag }} · 更新时间 {{ item.time }}</view>
				</view>
				<text class="entry-action">查看</text>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">分类统计</view>
			<view class="stat-item" v-for="s in stats" :key="s.name">
				<text>{{ s.name }}</text>
				<text class="badge">{{ s.count }}</text>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">知识库更新</view>
			<view class="update-desc">根据权威渠道自动同步最新反诈案例和策略。</view>
			<button class="full-btn primary" @click="updateNow">同步更新案例</button>
			<button class="full-btn dark" @click="showAddEntryDialog">增加条目</button>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">典型诈骗手法</view>
			<view class="case-item" v-for="c in cases" :key="c.title" @click="openCase(c)">
				<view class="case-title">{{ c.title }}</view>
				<view class="case-text">{{ c.text }}</view>
			</view>
		</view>

		<!-- 新增知识条目对话框 -->
		<uni-popup :visible="showAddDialog" @change="showAddDialog = $event" type="center" :mask-click="false">
				<view class="dialog-content">
					<view class="dialog-header">
						<view class="dialog-title">新增知识条目</view>
						<view class="dialog-close" @click="closeAddDialog">
							<uni-icons type="close" size="24" color="#999"></uni-icons>
						</view>
					</view>
					<view class="dialog-body">
						<view class="form-item">
							<view class="form-label">标题</view>
							<input v-model="newEntry.title" class="form-input" placeholder="请输入知识条目标题" />
						</view>
						<view class="form-item">
							<view class="form-label">描述</view>
							<textarea v-model="newEntry.description" class="form-textarea" placeholder="请输入知识条目描述" />
						</view>
						<view class="form-item">
							<view class="form-label">详细内容</view>
							<textarea v-model="newEntry.content" class="form-textarea form-textarea-large" placeholder="请输入知识条目详细内容" />
						</view>
						<view class="form-item">
							<view class="form-label">分类</view>
							<picker mode="selector" :range="categoryOptions" @change="e => newEntry.category = categoryOptions[e.detail.value]">
								<view class="form-picker">{{ newEntry.category || '请选择分类' }}</view>
							</picker>
						</view>
						<view class="form-item">
							<view class="form-label">来源</view>
							<picker mode="selector" :range="sourceOptions" @change="e => newEntry.source = sourceOptions[e.detail.value]">
								<view class="form-picker">{{ newEntry.source || '请选择来源' }}</view>
							</picker>
						</view>
					</view>
					<view class="dialog-footer">
						<button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
						<button class="dialog-btn submit" @click="addEntry">提交</button>
					</view>
				</view>
			</uni-popup>
		</scroll-view>
</template>

<script>
export default {
	data() {
			return {
				keyword: '',
				categories: ['全部'],
				levels: ['全部', '低', '中', '高'],
				categoryIndex: 0,
				levelIndex: 0,
				list: [],
				stats: [],
				cases: [{
					title: '冒充公检法',
					text: '伪造通缉令，要求转账到“安全账户”。'
				},
				{
					title: '虚假投资理财',
					text: '先小额返利建立信任，再诱导大额投入。'
				}
				],
				loading: false,
				// 新增知识条目对话框
				showAddDialog: false,
				newEntry: {
					title: '',
					description: '',
					content: '',
					category: '',
					source: ''
				},
				// 分类选项
				categoryOptions: ['网络购物', '情感诈骗', '投资理财', '兼职刷单', '虚假征信', '冒充公检法', 'AI合成语音', '法律法规'],
				// 来源选项
				sourceOptions: ['警方通报', '典型案例库', '专家分析', '官方发布', '用户举报']
			}
		},
	computed: {
		filteredList() {
			const c = this.categories[this.categoryIndex]
			const l = this.levels[this.levelIndex]
			return this.list.filter(item => {
				const passKeyword = this.keyword ? item.title.includes(this.keyword) || item.desc.includes(this.keyword) : true
				const passCategory = c === '全部' ? true : item.tag === c
				const passLevel = l === '全部' ? true : item.level === l
				return passKeyword && passCategory && passLevel
			})
		}
	},
	onLoad() {
		// 页面加载时加载知识库数据
		this.loadKnowledge()
	},
	methods: {
		// 加载知识库数据
		loadKnowledge() {
			this.loading = true
			uni.request({
				url: 'http://localhost:7007/api/knowledge',
				method: 'GET',
				success: (res) => {
					this.loading = false
					if (res.statusCode === 200 && res.data.success) {
						// 处理知识库数据
						this.list = res.data.items.map(item => ({
							id: item.id,
							title: item.title,
							desc: item.description,
							tag: item.category,
							time: this.formatDate(item.updatedAt),
							level: '中' // 默认为中风险，可根据实际数据调整
						}))
						// 生成分类列表
						const categoriesSet = new Set(['全部'])
						res.data.items.forEach(item => {
							categoriesSet.add(item.category)
						})
						this.categories = Array.from(categoriesSet)
						// 生成分类统计
						const categoryCount = {}
						res.data.items.forEach(item => {
							categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
						})
						this.stats = Object.entries(categoryCount).map(([name, count]) => ({
							name,
							count
						}))
					} else {
						uni.showToast({
							title: '加载知识库失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					this.loading = false
					uni.showToast({
						title: '网络连接失败',
						icon: 'none'
					})
					console.error('加载知识库失败:', err)
				}
			})
		},
		// 格式化日期
		formatDate(dateString) {
			const date = new Date(dateString)
			const month = (date.getMonth() + 1).toString().padStart(2, '0')
			const day = date.getDate().toString().padStart(2, '0')
			return `${month}/${day}`
		},
		// 搜索知识库
		search() {
			const category = this.categories[this.categoryIndex]
			const search = this.keyword
			
			this.loading = true
			uni.request({
				url: 'http://localhost:7007/api/knowledge',
				method: 'GET',
				data: {
					category: category === '全部' ? '' : category,
					search: search
				},
				success: (res) => {
					this.loading = false
					if (res.statusCode === 200 && res.data.success) {
						this.list = res.data.items.map(item => ({
							id: item.id,
							title: item.title,
							desc: item.description,
							tag: item.category,
							time: this.formatDate(item.updatedAt),
							level: '中'
						}))
						uni.showToast({
							title: `命中 ${this.list.length} 条`,
							icon: 'none'
						})
					} else {
						uni.showToast({
							title: '搜索失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					this.loading = false
					uni.showToast({
						title: '网络连接失败',
						icon: 'none'
					})
					console.error('搜索失败:', err)
				}
			})
		},
		// 重置筛选
		resetFilter() {
			this.keyword = ''
			this.categoryIndex = 0
			this.levelIndex = 0
			this.loadKnowledge()
		},
		// 更新知识库
		updateNow() {
			uni.showLoading({
				title: '更新中...'
			})
			uni.request({
				url: 'http://localhost:7007/api/knowledge/update',
				method: 'POST',
				header: {
					'Content-Type': 'application/json'
				},
				data: {
					count: 3
				},
				success: (res) => {
					uni.hideLoading()
					if (res.statusCode === 200 && res.data.success) {
						uni.showToast({
							title: `已添加 ${res.data.added} 条新知识条目`,
							icon: 'none'
						})
						// 重新加载知识库
						this.loadKnowledge()
					} else {
						uni.showToast({
							title: '更新失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					uni.hideLoading()
					uni.showToast({
						title: '网络连接失败',
						icon: 'none'
					})
					console.error('更新知识库失败:', err)
				}
			})
		},
		// 查看详情
		viewDetail() {
			uni.showToast({
				title: '详情页开发中',
				icon: 'none'
			})
		},
		// 查看知识条目
		viewEntry(item) {
			// 跳转到知识详情页面
			uni.navigateTo({
				url: `/pages/knowledge/detail/index?id=${item.id}`
			})
		},
		// 打开案例
		openCase(c) {
			uni.showToast({
				title: `案例：${c.title}`,
				icon: 'none'
			})
		},
		// 显示新增知识条目对话框
		showAddEntryDialog() {
			// 重置表单
			this.newEntry = {
				title: '',
				description: '',
				content: '',
				category: '',
				source: ''
			}
			this.showAddDialog = true
		},
		// 关闭新增知识条目对话框
		closeAddDialog() {
			this.showAddDialog = false
		},
		// 提交新增知识条目
		addEntry() {
			// 验证表单
			if (!this.newEntry.title) {
				uni.showToast({
					title: '请输入标题',
					icon: 'none'
				})
				return
			}
			if (!this.newEntry.category) {
				uni.showToast({
					title: '请选择分类',
					icon: 'none'
				})
				return
			}
			if (!this.newEntry.source) {
				uni.showToast({
					title: '请选择来源',
					icon: 'none'
				})
				return
			}
			
			// 调用后端 API 添加知识条目
			uni.showLoading({
				title: '提交中...'
			})
			uni.request({
				url: 'http://localhost:7007/api/knowledge',
				method: 'POST',
				header: {
					'Content-Type': 'application/json'
				},
				data: {
					title: this.newEntry.title,
					description: this.newEntry.description,
					content: this.newEntry.content,
					category: this.newEntry.category,
					source: this.newEntry.source
				},
				success: (res) => {
					uni.hideLoading()
					if (res.statusCode === 200 && res.data.success) {
						uni.showToast({
							title: '添加成功',
							icon: 'success'
						})
						// 关闭对话框
						this.showAddDialog = false
						// 重新加载知识库
						this.loadKnowledge()
					} else {
						uni.showToast({
							title: '添加失败，请稍后重试',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					uni.hideLoading()
					uni.showToast({
						title: '网络连接失败',
						icon: 'none'
					})
					console.error('添加知识条目失败:', err)
				}
			})
		}
	}
}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: calc(var(--status-bar-height) + 20rpx) 16rpx 30rpx;
		box-sizing: border-box;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		right: -90rpx;
		top: 80rpx;
		width: 260rpx;
		height: 260rpx;
		background: radial-gradient(circle, rgba(132, 169, 255, 0.2), rgba(132, 169, 255, 0));
		pointer-events: none;
	}

	.panel {
		border-radius: 14rpx;
		padding: 16rpx;
		margin-bottom: 14rpx;
		box-shadow: 0 6rpx 16rpx rgba(24, 39, 75, 0.05);
	}

	.panel-title {
		font-size: 27rpx;
		font-weight: 700;
		color: #1f2a44;
		margin-bottom: 12rpx;
	}

	.search-wrap {
		height: 68rpx;
		border: 1px solid #edf0f5;
		border-radius: 10rpx;
		padding: 0 12rpx;
		display: flex;
		align-items: center;
	}

	.search-input {
		flex: 1;
		margin-left: 10rpx;
		font-size: 24rpx;
	}

	.picker-row {
		display: flex;
		gap: 12rpx;
		margin-top: 12rpx;
	}

	.picker-col {
		flex: 1;
	}

	.picker-label {
		font-size: 21rpx;
		color: #9ba3b8;
	}

	.picker-value {
		margin-top: 6rpx;
		height: 62rpx;
		line-height: 62rpx;
		padding: 0 12rpx;
		border-radius: 10rpx;
		background: #f7f9fd;
		font-size: 24rpx;
		color: #5f6880;
	}

	.btn-row {
		display: flex;
		gap: 10rpx;
		margin-top: 12rpx;
	}

	.btn {
		min-width: 120rpx;
		border-radius: 8rpx;
	}

	.btn.primary {
		background: #2f80ff;
		color: #fff;
	}

	.btn.ghost {
		background: #fff;
		color: #4f5872;
		border: 1px solid #dfe6f3;
	}

	.entry {
		display: flex;
		justify-content: space-between;
		gap: 12rpx;
		padding: 12rpx 0;
		border-bottom: 1px solid #f0f2f7;
		transition: transform 0.18s ease, opacity 0.18s ease;
	}

	.entry:last-child {
		border-bottom: 0;
	}

	.entry-hover {
		opacity: 0.9;
		transform: translateY(-2rpx);
	}

	.entry-main {
		flex: 1;
	}

	.entry-title {
		font-size: 25rpx;
		font-weight: 600;
		color: #24304a;
	}

	.entry-desc {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #8b92a5;
		line-height: 1.5;
	}

	.entry-meta {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #a0a7ba;
	}

	.entry-action {
		color: #2f80ff;
		font-size: 22rpx;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 0;
		font-size: 24rpx;
		color: #36405a;
	}

	.badge {
		width: 34rpx;
		height: 34rpx;
		border-radius: 50%;
		text-align: center;
		line-height: 34rpx;
		background: #eef2fb;
		color: #768099;
		font-size: 20rpx;
	}

	.update-desc {
		font-size: 22rpx;
		color: #8b92a5;
		margin-bottom: 10rpx;
	}

	.full-btn {
		height: 70rpx;
		line-height: 70rpx;
		border-radius: 10rpx;
		font-size: 24rpx;
		margin-top: 8rpx;
	}

	.full-btn.primary {
		background: #2f80ff;
		color: #fff;
	}

	.full-btn.dark {
		background: #3a3f4d;
		color: #fff;
	}

	.case-item {
		padding: 10rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.case-item:last-child {
		border-bottom: 0;
	}

	.case-title {
		font-size: 24rpx;
		color: #26314c;
		font-weight: 600;
	}

	.case-text {
					margin-top: 4rpx;
					font-size: 22rpx;
					color: #8e96aa;
				}

				/* 新增知识条目对话框样式 */
				.dialog-content {
					width: 90%;
					max-width: 600rpx;
					background: #fff;
					border-radius: 20rpx;
					padding: 24rpx;
					box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
				}

				.dialog-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 24rpx;
				}

				.dialog-title {
					font-size: 30rpx;
					font-weight: 700;
					color: #202a43;
				}

				.dialog-close {
					width: 60rpx;
					height: 60rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					transition: background-color 0.2s;
				}

				.dialog-close:hover {
					background-color: #f0f0f0;
				}

				.dialog-body {
					margin-bottom: 24rpx;
				}

				.form-item {
					margin-bottom: 20rpx;
				}

				.form-label {
					font-size: 24rpx;
					font-weight: 600;
					color: #202a43;
					margin-bottom: 8rpx;
				}

				.form-input {
					width: 100%;
					height: 70rpx;
					border: 1px solid #e6ecf8;
					border-radius: 10rpx;
					padding: 0 16rpx;
					font-size: 24rpx;
					color: #333;
				}

				.form-textarea {
					width: 100%;
					height: 120rpx;
					border: 1px solid #e6ecf8;
					border-radius: 10rpx;
					padding: 16rpx;
					font-size: 24rpx;
					color: #333;
					resize: none;
				}

				.form-textarea-large {
					height: 200rpx;
				}

				.form-picker {
					width: 100%;
					height: 70rpx;
					border: 1px solid #e6ecf8;
					border-radius: 10rpx;
					padding: 0 16rpx;
					font-size: 24rpx;
					color: #333;
					display: flex;
					align-items: center;
				}

				.dialog-footer {
					display: flex;
					gap: 16rpx;
				}

				.dialog-btn {
					flex: 1;
					height: 70rpx;
					border-radius: 10rpx;
					font-size: 24rpx;
					font-weight: 600;
				}

				.dialog-btn.cancel {
					background: #f0f2f7;
					color: #666;
				}

				.dialog-btn.submit {
					background: #2f80ff;
					color: #fff;
				}
			</style>