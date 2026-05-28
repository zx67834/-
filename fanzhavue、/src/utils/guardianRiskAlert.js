import { getApiBaseUrl } from '@/utils/apiBase.js'
import { acknowledgeRiskNotifyId, isRiskNotifyAcknowledged } from '@/utils/riskAcknowledge.js'

let lastPollAt = 0

function getCurrentAccount() {
	const accounts = uni.getStorageSync('user_accounts') || []
	const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
	return accounts[idx] || {}
}

function isLoggedIn() {
	const f = uni.getStorageSync('is_logged_in')
	return f === true || f === 1 || f === '1' || f === 'true'
}

function isGuardianAccount(acc) {
	return Boolean(acc && acc.userType === '监护人')
}

function parseJsonMaybe(raw) {
	if (raw == null || raw === '') return {}
	if (typeof raw === 'object' && !Array.isArray(raw)) return raw
	if (typeof raw === 'string') {
		try {
			return JSON.parse(raw)
		} catch {
			return {}
		}
	}
	return {}
}

function isHighGuardianNotify(item) {
	if (!item) return false
	if (item.type === 'guardian-notify') return true
	const t = String(item.title || '')
	const body = String(item.message || item.content || '')
	return t.includes('高风险') || body.includes('高风险')
}

/**
 * 监护人登录后：拉取通知，对未读的高风险 guardian 通知弹系统弹窗（去重按通知 id）。
 */
export function pollGuardianHighRiskModals() {
	if (!isLoggedIn()) return
	const acc = getCurrentAccount()
	if (!isGuardianAccount(acc)) return
	const email = String(acc.email || '').trim().toLowerCase()
	if (!email) return

	const now = Date.now()
	if (now - lastPollAt < 2800) return
	lastPollAt = now

	const base = getApiBaseUrl()
	const url = `${base}/api/notifications?email=${encodeURIComponent(email)}`

	uni.request({
		url,
		method: 'GET',
		success: (raw) => {
			const statusOk =
				raw.statusCode === 200 || raw.statusCode === '200' || Number(raw.statusCode) === 200
			const data = parseJsonMaybe(raw.data)
			if (!statusOk || data.success === false) return

			const items = Array.isArray(data.items) ? data.items : []
			const candidates = items
				.filter(isHighGuardianNotify)
				.filter((x) => x.id != null && !isRiskNotifyAcknowledged(x.id))
				.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

			let seen = uni.getStorageSync('guardian_high_notify_seen_ids')
			if (!Array.isArray(seen)) seen = []
			const seenSet = new Set(seen.map((x) => Number(x)).filter((n) => !Number.isNaN(n)))

			const next = candidates.find((x) => x.id != null && !seenSet.has(Number(x.id)))
			if (!next) return

			const body = next.content || next.message || '被监护人触发高风险检测，请尽快联系本人核实。'
			uni.showModal({
				title: next.title || '高风险核验通知',
				content: `${body}\n\n点击「已知晓」后不再弹窗提醒该条；「查看预警」可进入预警中心处理。`,
				showCancel: true,
				cancelText: '查看预警',
				confirmText: '已知晓',
				success: (res) => {
					seenSet.add(Number(next.id))
					const arr = [...seenSet].filter((n) => !Number.isNaN(n)).slice(-200)
					uni.setStorageSync('guardian_high_notify_seen_ids', arr)
					if (res.confirm) {
						acknowledgeRiskNotifyId(next.id)
					} else {
						uni.navigateTo({ url: '/pages/alerts/index' })
					}
				}
			})
		}
	})
}
