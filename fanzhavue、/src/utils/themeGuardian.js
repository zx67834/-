/**
 * 当前登录账号是否为监护人（与 profile / guardian 页逻辑一致）
 */
export function readIsGuardianUser() {
	const v = uni.getStorageSync('is_logged_in')
	const logged = v === true || v === 1 || v === '1' || v === 'true'
	if (!logged) return false
	const accounts = uni.getStorageSync('user_accounts')
	if (!Array.isArray(accounts) || !accounts.length) return false
	let idx = Number(uni.getStorageSync('active_user_account_index') || 0)
	if (Number.isNaN(idx) || idx < 0) idx = 0
	const acc = accounts[idx] || accounts[0]
	return acc && acc.userType === '监护人'
}

/**
 * 微信小程序窗口背景（底部漏色区域等）
 */
export function applyMiniProgramBackground() {
	// #ifdef MP-WEIXIN
	if (typeof wx === 'undefined' || !wx.setBackgroundColor) return
	if (readIsGuardianUser()) {
		wx.setBackgroundColor({
			backgroundColor: '#fff5f5',
			backgroundColorTop: '#ffebee',
			backgroundColorBottom: '#fce4ec'
		})
	} else {
		wx.setBackgroundColor({
			backgroundColor: '#f6f8fc',
			backgroundColorTop: '#f3f6fc',
			backgroundColorBottom: '#f6f8fc'
		})
	}
	// #endif
}

/** 与 pages.json tabBar.list 顺序一致：首页、工具、语音助手、知识库、我的 */
const TAB_BAR_ITEMS_DEFAULT = [
	{ iconPath: 'static/首页 (1).png', selectedIconPath: 'static/首页tarbar点击.png' },
	{ iconPath: 'static/工具 (1).png', selectedIconPath: 'static/工具tarbar点击.png' },
	{ iconPath: 'static/语音助手 (1).png', selectedIconPath: 'static/语音助手tarbar点击.png' },
	{ iconPath: 'static/知识库 (1).png', selectedIconPath: 'static/知识库tarbar点击.png' },
	{ iconPath: 'static/我的 (1).png', selectedIconPath: 'static/我的tarbar点击.png' }
]

/** 监护人端红色 tab 图标（未选中/选中暂用同一套图，选中态主要靠 selectedColor 区分文案） */
const TAB_BAR_ITEMS_GUARDIAN = [
	{ iconPath: 'static/首页 (2)红色.png', selectedIconPath: 'static/首页 (2)红色.png' },
	{ iconPath: 'static/工具 (3)红色.png', selectedIconPath: 'static/工具 (3)红色.png' },
	{ iconPath: 'static/语音助手 (2)红色.png', selectedIconPath: 'static/语音助手 (2)红色.png' },
	{ iconPath: 'static/知识库 (3)红色.png', selectedIconPath: 'static/知识库 (3)红色.png' },
	{ iconPath: 'static/我的 (3)红色.png', selectedIconPath: 'static/我的 (3)红色.png' }
]

function applyTabBarIconsForIdentity() {
	if (typeof uni === 'undefined' || typeof uni.setTabBarItem !== 'function') return
	const list = readIsGuardianUser() ? TAB_BAR_ITEMS_GUARDIAN : TAB_BAR_ITEMS_DEFAULT
	list.forEach((item, index) => {
		try {
			uni.setTabBarItem({
				index,
				iconPath: item.iconPath,
				selectedIconPath: item.selectedIconPath
			})
		} catch (e) {
			// 非 tab 页等
		}
	})
}

/**
 * 根据当前登录身份切换原生 tabBar：配色 + 图标（监护人用 static 下 *红色.png）
 * 依赖 pages.json 中已配置 tabBar；在非 tab 页调用时部分端会静默失败，已 try/catch。
 */
export function applyTabBarStyleForIdentity() {
	if (typeof uni === 'undefined') return
	const guardian = readIsGuardianUser()
	const style = guardian
		? {
				color: '#8a8f99',
				selectedColor: '#c62828',
				backgroundColor: '#fff5f5',
				borderStyle: 'white'
			}
		: {
				color: '#8a8f99',
				selectedColor: '#2f80ff',
				backgroundColor: '#ffffff',
				borderStyle: 'black'
			}
	if (typeof uni.setTabBarStyle === 'function') {
		try {
			uni.setTabBarStyle(style)
		} catch (e) {
			// 当前非 tab 页或端不支持时忽略
		}
	}
	applyTabBarIconsForIdentity()
}
