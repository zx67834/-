<template>
	<scroll-view class="page" scroll-y>
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		
		<view class="header-section fade-up">
			<view class="header-left">
				<view class="logo-badge">
					<uni-icons type="shield-filled" size="28" color="#fff"></uni-icons>
				</view>
				<view class="header-text">
					<view class="page-title">反诈知识库</view>
					<view class="page-subtitle">学习反诈知识，守护财产安全</view>
				</view>
			</view>
		</view>

		<view class="search-card fade-up">
			<view class="search-wrap">
				<uni-icons type="search" size="20" color="#8B91A3"></uni-icons>
				<input class="search-input" placeholder="搜索关键词..." v-model="searchQuery" @confirm="doSearch" />
				<view v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
					<uni-icons type="close" size="16" color="#A4A9B5"></uni-icons>
				</view>
			</view>
			<view class="filter-row">
				<view class="filter-item" @click="showCategoryPicker">
					<uni-icons type="pricetags" size="16" color="#6B7280"></uni-icons>
					<text class="filter-text">{{ selectedCategory }}</text>
					<uni-icons type="down" size="14" color="#9CA3AF"></uni-icons>
				</view>
				<view class="filter-item" @click="showSourcePicker">
					<uni-icons type="folder" size="16" color="#6B7280"></uni-icons>
					<text class="filter-text">{{ selectedSource }}</text>
					<uni-icons type="down" size="14" color="#9CA3AF"></uni-icons>
				</view>
				<view class="action-btn" @click="doSearch">
					<uni-icons type="search" size="16" color="#fff"></uni-icons>
					<text>搜索</text>
				</view>
			</view>
		</view>

		<view class="quick-actions fade-up">
			<view class="quick-card sync-card" @click="updateKnowledgeBase">
				<view class="quick-icon">
					<uni-icons type="loop" size="24" color="#fff"></uni-icons>
				</view>
				<view class="quick-text">
					<view class="quick-title">同步更新</view>
					<view class="quick-desc">获取最新案例</view>
				</view>
				<view v-if="updating" class="loading-dots">
					<view></view>
					<view></view>
					<view></view>
				</view>
			</view>
			<view class="quick-card add-card" @click="showAddEntryDialog">
				<view class="quick-icon">
					<uni-icons type="plus" size="24" color="#fff"></uni-icons>
				</view>
				<view class="quick-text">
					<view class="quick-title">新增条目</view>
					<view class="quick-desc">添加知识库内容</view>
				</view>
			</view>
		</view>

		<view class="stats-card fade-up">
			<view class="stats-header">
				<view class="stats-title">
					<uni-icons type="piechart" size="18" color="#2f64f5"></uni-icons>
					分类统计
				</view>
				<view class="stats-count">{{ filteredItems.length }} 条</view>
			</view>
			<scroll-view class="stats-scroll" scroll-x="true" show-scrollbar="false">
				<view class="stats-row">
					<view 
						v-for="stat in categoryStats" 
						:key="stat.name" 
						class="stat-tag"
						:class="{ active: selectedCategory === stat.name }"
						:style="{ '--tag-color': getCategoryColor(stat.name) }"
						@click="selectCategory(stat.name)"
					>
						<text class="stat-name">{{ stat.name }}</text>
						<text class="stat-num">{{ stat.count }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="knowledge-list fade-up">
			<view class="list-header">
				<view class="list-title">
					<uni-icons type="book" size="18" color="#2f64f5"></uni-icons>
					知识条目
				</view>
			</view>
			
			<view v-if="loading" class="loading-state">
				<view class="loading-spinner"></view>
				<text>加载中...</text>
			</view>
			
			<view v-else-if="error" class="error-state">
				<uni-icons type="info" size="48" color="#ef4444"></uni-icons>
				<text class="error-text">{{ error }}</text>
				<view class="retry-btn" @click="loadKnowledge">重试</view>
			</view>
			
			<view v-else>
				<view 
					v-for="item in filteredItems" 
					:key="item.id" 
					class="knowledge-item"
					@click="viewEntry(item)"
				>
					<view class="item-icon" :style="{ background: getCategoryColor(item.category) }">
						<uni-icons :type="getIconForCategory(item.category)" size="24" color="#fff"></uni-icons>
					</view>
					<view class="item-content">
						<view class="item-title">{{ item.title }}</view>
						<view class="item-desc">{{ item.description }}</view>
						<view class="item-meta">
							<view class="meta-tag category-tag" :style="{ background: getCategoryColor(item.category) + '15', color: getCategoryColor(item.category) }">
								{{ item.category }}
							</view>
							<view class="meta-tag source-tag">{{ item.source }}</view>
							<view class="meta-time">
								<uni-icons type="clock" size="12" color="#9CA3AF"></uni-icons>
								{{ formatDate(item.updatedAt) }}
							</view>
						</view>
					</view>
					<uni-icons type="right" size="18" color="#D1D5DB"></uni-icons>
				</view>
				
				<view v-if="filteredItems.length === 0" class="empty-state">
					<uni-icons type="info" size="64" color="#D1D5DB"></uni-icons>
					<text class="empty-text">未找到匹配的知识条目</text>
					<view class="reset-btn" @click="resetSearch">重置筛选</view>
				</view>
			</view>
		</view>

		<view class="cases-card fade-up">
			<view class="list-title">
				<uni-icons type="alert" size="18" color="#ef4444"></uni-icons>
				典型诈骗手法
			</view>
			<view class="case-item" v-for="c in scams" :key="c.id" @click="openCase(c)">
				<view class="case-icon" :style="{ background: getScamColor(c.id) + '15', color: getScamColor(c.id) }">
					<uni-icons :type="c.icon" size="22"></uni-icons>
				</view>
				<view class="case-content">
					<view class="case-title">{{ c.title }}</view>
					<view class="case-desc">{{ c.description }}</view>
				</view>
				<view class="case-badge" :class="c.frequency === '极高发' ? 'high' : 'medium'">
					{{ c.frequency }}
				</view>
			</view>
		</view>

		<view class="bottom-spacer"></view>

		<uni-popup :visible="showCategoryPopup" type="bottom" @change="showCategoryPopup = $event">
			<view class="picker-popup">
				<view class="picker-header">
					<text class="picker-cancel" @click="showCategoryPopup = false">取消</text>
					<text class="picker-title">选择分类</text>
					<text class="picker-confirm" @click="confirmCategory">确定</text>
				</view>
				<picker-view :value="[categoryIndex]" @change="onCategoryChange" class="picker-view">
					<picker-view-column>
						<view v-for="(item, index) in categories" :key="index" class="picker-item">{{ item }}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</uni-popup>

		<uni-popup :visible="showSourcePopup" type="bottom" @change="showSourcePopup = $event">
			<view class="picker-popup">
				<view class="picker-header">
					<text class="picker-cancel" @click="showSourcePopup = false">取消</text>
					<text class="picker-title">选择来源</text>
					<text class="picker-confirm" @click="confirmSource">确定</text>
				</view>
				<picker-view :value="[sourceIndex]" @change="onSourceChange" class="picker-view">
					<picker-view-column>
						<view v-for="(item, index) in sources" :key="index" class="picker-item">{{ item }}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</uni-popup>

		<uni-popup :visible="showAddDialog" @change="showAddDialog = $event" type="center" :mask-click="false">
			<view class="dialog-content">
				<view class="dialog-header">
					<view class="dialog-title">新增知识条目</view>
					<view class="dialog-close" @click="closeAddDialog">
						<uni-icons type="close" size="24" color="#999"></uni-icons>
					</view>
				</view>
				<scroll-view class="dialog-body" scroll-y>
					<view class="form-item">
						<view class="form-label">标题 <text class="required">*</text></view>
						<input v-model="newEntry.title" class="form-input" placeholder="请输入知识条目标题" />
					</view>
					<view class="form-item">
						<view class="form-label">描述</view>
						<textarea v-model="newEntry.description" class="form-textarea" placeholder="请输入知识条目描述" :maxlength="200" />
					</view>
					<view class="form-item">
						<view class="form-label">详细内容</view>
						<textarea v-model="newEntry.content" class="form-textarea form-textarea-large" placeholder="请输入知识条目详细内容" :maxlength="2000" />
					</view>
					<view class="form-item">
						<view class="form-label">分类 <text class="required">*</text></view>
						<view class="form-picker" @click="tempCategory = newEntry.category || '全部'; showCategoryPopup2 = true">
							<text :class="{ placeholder: !newEntry.category }">{{ newEntry.category || '请选择分类' }}</text>
							<uni-icons type="down" size="16" color="#9CA3AF"></uni-icons>
						</view>
					</view>
					<view class="form-item">
						<view class="form-label">来源 <text class="required">*</text></view>
						<view class="form-picker" @click="tempSource = newEntry.source || '全部'; showSourcePopup2 = true">
							<text :class="{ placeholder: !newEntry.source }">{{ newEntry.source || '请选择来源' }}</text>
							<uni-icons type="down" size="16" color="#9CA3AF"></uni-icons>
						</view>
					</view>
				</scroll-view>
				<view class="dialog-footer">
					<button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
					<button class="dialog-btn submit" @click="addEntry" :disabled="submitting">
						{{ submitting ? '提交中...' : '提交' }}
					</button>
				</view>
			</view>
		</uni-popup>

		<uni-popup :visible="showCategoryPopup2" type="bottom" @change="showCategoryPopup2 = $event">
			<view class="picker-popup">
				<view class="picker-header">
					<text class="picker-cancel" @click="showCategoryPopup2 = false">取消</text>
					<text class="picker-title">选择分类</text>
					<text class="picker-confirm" @click="confirmCategory2">确定</text>
				</view>
				<picker-view :value="[tempCategoryIndex]" @change="onCategoryChange2" class="picker-view">
					<picker-view-column>
						<view v-for="(item, index) in categories.filter(c => c !== '全部')" :key="index" class="picker-item">{{ item }}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</uni-popup>

		<uni-popup :visible="showSourcePopup2" type="bottom" @change="showSourcePopup2 = $event">
			<view class="picker-popup">
				<view class="picker-header">
					<text class="picker-cancel" @click="showSourcePopup2 = false">取消</text>
					<text class="picker-title">选择来源</text>
					<text class="picker-confirm" @click="confirmSource2">确定</text>
				</view>
				<picker-view :value="[tempSourceIndex]" @change="onSourceChange2" class="picker-view">
					<picker-view-column>
						<view v-for="(item, index) in sources.filter(s => s !== '全部')" :key="index" class="picker-item">{{ item }}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</uni-popup>
	</scroll-view>
</template>

<script>
export default {
	data() {
		return {
			searchQuery: '',
			selectedCategory: '全部',
			selectedSource: '全部',
			categories: ['全部', 'AI合成语音', '投资理财', '兼职刷单', '虚假征信', '冒充公检法', '网络购物', '情感诈骗', '法律法规', '黑产技术', '慈善诈骗', '虚假票务', '虚假充值', '网络钓鱼', '典型案例库'],
			sources: ['全部', '法律法规', '典型案例库', '警方通报', '用户上报', '专家分析', '百度反诈'],
			list: [],
			loading: false,
			error: null,
			updating: false,
			submitting: false,
			showCategoryPopup: false,
			showSourcePopup: false,
			showAddDialog: false,
			showCategoryPopup2: false,
			showSourcePopup2: false,
			categoryIndex: 0,
			sourceIndex: 0,
			tempCategory: '全部',
			tempSource: '全部',
			tempCategoryIndex: 0,
			tempSourceIndex: 0,
			newEntry: {
				title: '',
				description: '',
				content: '',
				category: '',
				source: ''
			},
			scams: [
				{ id: 1, title: 'AI合成语音诈骗', icon: 'mic', description: '利用AI模仿亲友声音，请求紧急转账', frequency: '高发' },
				{ id: 2, title: '投资理财诈骗', icon: 'chatbubble', description: '虚假高收益平台，诱导充值后无法提现', frequency: '高发' },
				{ id: 3, title: '兼职刷单诈骗', icon: 'compose', description: '以刷单返利为诱饵，骗取保证金', frequency: '极高发' }
			]
		}
	},
	computed: {
		filteredItems() {
			let items = this.list
			if (this.selectedCategory !== '全部') {
				items = items.filter(item => item.category === this.selectedCategory)
			}
			if (this.selectedSource !== '全部') {
				items = items.filter(item => item.source === this.selectedSource)
			}
			if (this.searchQuery) {
				const query = this.searchQuery.toLowerCase()
				items = items.filter(item =>
					item.title.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					(item.content && item.content.toLowerCase().includes(query))
				)
			}
			return items
		},
		categoryStats() {
			const stats = {}
			this.list.forEach(item => {
				if (!stats[item.category]) {
					stats[item.category] = { name: item.category, count: 0 }
				}
				stats[item.category].count++
			})
			return Object.values(stats)
		}
	},
	onLoad() {
		this.loadKnowledge()
	},
	methods: {
		loadKnowledge() {
			this.loading = true
			this.error = null
			uni.request({
				url: 'http://localhost:7007/api/knowledge',
				method: 'GET',
				success: (res) => {
					this.loading = false
					if (res.statusCode === 200 && res.data.success) {
						this.list = res.data.items
					} else {
						this.error = '获取数据失败'
					}
				},
				fail: (err) => {
					this.loading = false
					this.error = '网络连接失败'
					console.error('加载知识库失败:', err)
				}
			})
		},
		doSearch() {
			uni.showToast({
				title: `已搜索 ${this.filteredItems.length} 条`,
				icon: 'none'
			})
		},
		resetSearch() {
			this.searchQuery = ''
			this.selectedCategory = '全部'
			this.selectedSource = '全部'
		},
		selectCategory(name) {
			this.selectedCategory = name
		},
		showCategoryPicker() {
			this.tempCategory = this.selectedCategory
			this.categoryIndex = this.categories.indexOf(this.selectedCategory)
			this.showCategoryPopup = true
		},
		showSourcePicker() {
			this.tempSource = this.selectedSource
			this.sourceIndex = this.sources.indexOf(this.selectedSource)
			this.showSourcePopup = true
		},
		onCategoryChange(e) {
			this.categoryIndex = e.detail.value[0]
		},
		onSourceChange(e) {
			this.sourceIndex = e.detail.value[0]
		},
		confirmCategory() {
			this.selectedCategory = this.categories[this.categoryIndex]
			this.showCategoryPopup = false
		},
		confirmSource() {
			this.selectedSource = this.sources[this.sourceIndex]
			this.showSourcePopup = false
		},
		onCategoryChange2(e) {
			this.tempCategoryIndex = e.detail.value[0]
		},
		onSourceChange2(e) {
			this.tempSourceIndex = e.detail.value[0]
		},
		confirmCategory2() {
			const availableCategories = this.categories.filter(c => c !== '全部')
			this.newEntry.category = availableCategories[this.tempCategoryIndex]
			this.showCategoryPopup2 = false
		},
		confirmSource2() {
			const availableSources = this.sources.filter(s => s !== '全部')
			this.newEntry.source = availableSources[this.tempSourceIndex]
			this.showSourcePopup2 = false
		},
		viewEntry(item) {
			uni.navigateTo({
				url: `/pages/knowledge/detail/index?id=${item.id}`
			})
		},
		async updateKnowledgeBase() {
			this.updating = true
			try {
				const res = await uni.request({
					url: 'http://localhost:7007/api/knowledge/update',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: { count: 3 }
				})
				if (res[1].statusCode === 200 && res[1].data.success) {
					uni.showToast({
						title: `已添加 ${res[1].data.added} 条新条目`,
						icon: 'success'
					})
					this.loadKnowledge()
				} else {
					uni.showToast({
						title: '更新失败',
						icon: 'none'
					})
				}
			} catch (err) {
				uni.showToast({
					title: '网络连接失败',
					icon: 'none'
				})
			} finally {
				this.updating = false
			}
		},
		showAddEntryDialog() {
			this.newEntry = {
				title: '',
				description: '',
				content: '',
				category: '',
				source: ''
			}
			this.showAddDialog = true
		},
		closeAddDialog() {
			this.showAddDialog = false
		},
		async addEntry() {
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
			
			this.submitting = true
			try {
				const res = await uni.request({
					url: 'http://localhost:7007/api/knowledge',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: this.newEntry
				})
				if (res[1].statusCode === 200 && res[1].data.success) {
					uni.showToast({
						title: '添加成功',
						icon: 'success'
					})
					this.showAddDialog = false
					this.loadKnowledge()
				} else {
					uni.showToast({
						title: '添加失败',
						icon: 'none'
					})
				}
			} catch (err) {
				uni.showToast({
					title: '网络连接失败',
					icon: 'none'
				})
			} finally {
				this.submitting = false
			}
		},
		openCase(c) {
			uni.showToast({
				title: `案例：${c.title}`,
				icon: 'none'
			})
		},
		getIconForCategory(category) {
			const map = {
				'AI合成语音': 'mic',
				'投资理财': 'chart',
				'兼职刷单': 'wallet',
				'虚假征信': 'alert',
				'冒充公检法': 'contact',
				'网络购物': 'cart',
				'情感诈骗': 'heart',
				'法律法规': 'info',
				'黑产技术': 'laptop',
				'慈善诈骗': 'hand-heart',
				'虚假票务': 'ticket',
				'虚假充值': 'cellphone',
				'网络钓鱼': 'fish',
				'典型案例库': 'book-open'
			}
			return map[category] || 'book'
		},
		getCategoryColor(category) {
			const map = {
				'AI合成语音': '#8B5CF6',
				'投资理财': '#10B981',
				'兼职刷单': '#F59E0B',
				'虚假征信': '#EF4444',
				'冒充公检法': '#3B82F6',
				'网络购物': '#F97316',
				'情感诈骗': '#EC4899',
				'法律法规': '#6366F1',
				'黑产技术': '#6B7280',
				'慈善诈骗': '#14B8A6',
				'虚假票务': '#06B6D4',
				'虚假充值': '#0EA5E9',
				'网络钓鱼': '#22C55E',
				'典型案例库': '#3B82F6'
			}
			return map[category] || '#6366F1'
		},
		getScamColor(id) {
			const colors = ['#EF4444', '#F59E0B', '#10B981']
			return colors[(id - 1) % colors.length]
		},
		formatDate(dateString) {
			const date = new Date(dateString)
			const month = (date.getMonth() + 1).toString().padStart(2, '0')
			const day = date.getDate().toString().padStart(2, '0')
			return `${month}-${day}`
		}
	}
}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
		padding: 0 24rpx 0;
		box-sizing: border-box;
		position: relative;
		overflow-x: hidden;
	}

	.bg-glow {
		position: absolute;
		right: -180rpx;
		top: -100rpx;
		width: 520rpx;
		height: 520rpx;
		background: radial-gradient(circle, rgba(47, 100, 245, 0.18), rgba(47, 100, 245, 0));
		pointer-events: none;
		z-index: 0;
	}

	.status-holder {
		height: calc(var(--status-bar-height) + 20rpx);
	}

	.header-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;
		position: relative;
		z-index: 1;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.logo-badge {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 14rpx 32rpx rgba(47, 100, 245, 0.32);
	}

	.header-text {
		flex: 1;
	}

	.page-title {
		font-size: 36rpx;
		font-weight: 800;
		color: #1f2a44;
		line-height: 1.2;
	}

	.page-subtitle {
		font-size: 24rpx;
		color: #7d8cb1;
		margin-top: 4rpx;
	}

	.search-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 12rpx 32rpx rgba(27, 42, 91, 0.08);
		border: 1px solid rgba(230, 235, 245, 0.8);
		position: relative;
		z-index: 1;
	}

	.search-wrap {
		height: 88rpx;
		background: #f5f8ff;
		border-radius: 24rpx;
		padding: 0 24rpx;
		display: flex;
		align-items: center;
		border: 1px solid #e0e7f5;
	}

	.search-input {
		flex: 1;
		margin-left: 16rpx;
		font-size: 28rpx;
		color: #1f2a44;
	}

	.search-clear {
		padding: 8rpx;
	}

	.filter-row {
		display: flex;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.filter-item {
		flex: 1;
		height: 72rpx;
		background: #f8fafc;
		border-radius: 18rpx;
		padding: 0 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		border: 1px solid #e2e8f0;
	}

	.filter-text {
		font-size: 25rpx;
		color: #374151;
		font-weight: 500;
	}

	.action-btn {
		min-width: 120rpx;
		height: 72rpx;
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		color: #fff;
		font-size: 26rpx;
		font-weight: 600;
		box-shadow: 0 8rpx 20rpx rgba(47, 100, 245, 0.35);
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16rpx;
		margin-bottom: 20rpx;
		position: relative;
		z-index: 1;
	}

	.quick-card {
		border-radius: 24rpx;
		padding: 28rpx 24rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		position: relative;
		overflow: hidden;
	}

	.sync-card {
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
	}

	.add-card {
		background: linear-gradient(135deg, #10B981, #059669);
	}

	.quick-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		background: rgba(255, 255, 255, 0.25);
		backdrop-filter: blur(10rpx);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.quick-text {
		flex: 1;
	}

	.quick-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #fff;
	}

	.quick-desc {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.85);
		margin-top: 4rpx;
	}

	.loading-dots {
		display: flex;
		gap: 6rpx;
	}

	.loading-dots view {
		width: 10rpx;
		height: 10rpx;
		background: #fff;
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.loading-dots view:nth-child(1) { animation-delay: -0.32s; }
	.loading-dots view:nth-child(2) { animation-delay: -0.16s; }

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}

	.stats-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 12rpx 32rpx rgba(27, 42, 91, 0.08);
		border: 1px solid rgba(230, 235, 245, 0.8);
		position: relative;
		z-index: 1;
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.stats-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.stats-count {
		font-size: 24rpx;
		color: #2f64f5;
		font-weight: 700;
	}

	.stats-scroll {
		white-space: nowrap;
	}

	.stats-row {
		display: flex;
		gap: 12rpx;
		padding-bottom: 4rpx;
	}

	.stat-tag {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		padding: 14rpx 20rpx;
		border-radius: 999rpx;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.stat-tag.active {
		background: var(--tag-color);
		border-color: var(--tag-color);
	}

	.stat-name {
		font-size: 24rpx;
		color: #374151;
		font-weight: 500;
	}

	.stat-tag.active .stat-name {
		color: #fff;
	}

	.stat-num {
		font-size: 22rpx;
		font-weight: 700;
		color: var(--tag-color);
		background: rgba(255, 255, 255, 0.8);
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
	}

	.stat-tag.active .stat-num {
		background: rgba(255, 255, 255, 0.25);
		color: #fff;
	}

	.knowledge-list {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 12rpx 32rpx rgba(27, 42, 91, 0.08);
		border: 1px solid rgba(230, 235, 245, 0.8);
		position: relative;
		z-index: 1;
	}

	.list-header {
		margin-bottom: 16rpx;
	}

	.list-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 20rpx;
	}

	.loading-spinner {
		width: 60rpx;
		height: 60rpx;
		border: 4rpx solid #e5e7eb;
		border-top-color: #2f64f5;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16rpx;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-state text,
	.error-state text,
	.empty-state text {
		font-size: 26rpx;
		color: #9CA3AF;
	}

	.error-text {
		color: #ef4444 !important;
		margin: 16rpx 0;
	}

	.retry-btn,
	.reset-btn {
		margin-top: 20rpx;
		padding: 16rpx 32rpx;
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		color: #fff;
		border-radius: 16rpx;
		font-size: 26rpx;
		font-weight: 600;
	}

	.knowledge-item {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 24rpx 0;
		border-bottom: 1px solid #f0f4fb;
		transition: all 0.2s ease;
	}

	.knowledge-item:last-child {
		border-bottom: none;
	}

	.item-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2a44;
		margin-bottom: 6rpx;
		line-height: 1.4;
	}

	.item-desc {
		font-size: 24rpx;
		color: #6B7280;
		line-height: 1.5;
		margin-bottom: 10rpx;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 10rpx;
		flex-wrap: wrap;
	}

	.meta-tag {
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 500;
	}

	.category-tag {
		font-weight: 600;
	}

	.source-tag {
		background: #f3f4f6;
		color: #4B5563;
	}

	.meta-time {
		display: flex;
		align-items: center;
		gap: 4rpx;
		font-size: 20rpx;
		color: #9CA3AF;
	}

	.empty-text {
		color: #9CA3AF;
		margin: 16rpx 0;
		font-size: 26rpx;
	}

	.cases-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 12rpx 32rpx rgba(27, 42, 91, 0.08);
		border: 1px solid rgba(230, 235, 245, 0.8);
		position: relative;
		z-index: 1;
	}

	.case-item {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f4fb;
	}

	.case-item:last-child {
		border-bottom: none;
	}

	.case-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.case-content {
		flex: 1;
		min-width: 0;
	}

	.case-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #1f2a44;
		margin-bottom: 4rpx;
	}

	.case-desc {
		font-size: 22rpx;
		color: #6B7280;
		line-height: 1.4;
	}

	.case-badge {
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 700;
		flex-shrink: 0;
	}

	.case-badge.high {
		background: #fef2f2;
		color: #ef4444;
	}

	.case-badge.medium {
		background: #fffbeb;
		color: #f59e0b;
	}

	.bottom-spacer {
		height: 40rpx;
	}

	.picker-popup {
		background: #fff;
		border-radius: 32rpx 32rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 32rpx;
		border-bottom: 1px solid #f0f0f0;
	}

	.picker-cancel,
	.picker-confirm {
		font-size: 28rpx;
		padding: 10rpx 20rpx;
	}

	.picker-cancel {
		color: #999;
	}

	.picker-confirm {
		color: #2f64f5;
		font-weight: 600;
	}

	.picker-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #1f2a44;
	}

	.picker-view {
		height: 400rpx;
	}

	.picker-item {
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #333;
	}

	.dialog-content {
		width: 90%;
		max-width: 680rpx;
		background: #fff;
		border-radius: 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1px solid #f0f0f0;
	}

	.dialog-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.dialog-close {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dialog-body {
		padding: 32rpx;
		max-height: 70vh;
	}

	.form-item {
		margin-bottom: 28rpx;
	}

	.form-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2a44;
		margin-bottom: 14rpx;
	}

	.required {
		color: #ef4444;
	}

	.form-input {
		width: 100%;
		height: 88rpx;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 18rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
	}

	.form-textarea {
		width: 100%;
		min-height: 160rpx;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 18rpx;
		padding: 20rpx 24rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
		line-height: 1.6;
	}

	.form-textarea-large {
		min-height: 260rpx;
	}

	.form-picker {
		width: 100%;
		height: 88rpx;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 18rpx;
		padding: 0 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
	}

	.form-picker text {
		font-size: 28rpx;
		color: #333;
	}

	.form-picker .placeholder {
		color: #9CA3AF;
	}

	.dialog-footer {
		display: flex;
		gap: 20rpx;
		padding: 32rpx;
		border-top: 1px solid #f0f0f0;
	}

	.dialog-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 18rpx;
		font-size: 28rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
	}

	.dialog-btn.cancel {
		background: #f3f4f6;
		color: #4B5563;
	}

	.dialog-btn.submit {
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		color: #fff;
		box-shadow: 0 8rpx 20rpx rgba(47, 100, 245, 0.3);
	}

	.dialog-btn[disabled] {
		opacity: 0.6;
	}

	.fade-up {
		animation: fadeUp 0.5s ease both;
	}

	.fade-up:nth-child(1) { animation-delay: 0.05s; }
	.fade-up:nth-child(2) { animation-delay: 0.1s; }
	.fade-up:nth-child(3) { animation-delay: 0.15s; }
	.fade-up:nth-child(4) { animation-delay: 0.2s; }
	.fade-up:nth-child(5) { animation-delay: 0.25s; }
	.fade-up:nth-child(6) { animation-delay: 0.3s; }

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
