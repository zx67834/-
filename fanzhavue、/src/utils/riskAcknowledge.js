/** 用户点击「已知晓」的通知 id，不再弹窗提醒（本地持久化，最多保留 400 条） */
const RISK_ACK_NOTIFY_IDS = 'risk_acknowledged_notify_ids'

export function getRiskAckSet() {
	const raw = uni.getStorageSync(RISK_ACK_NOTIFY_IDS)
	const arr = Array.isArray(raw) ? raw : []
	return new Set(arr.map((x) => String(x)))
}

export function acknowledgeRiskNotifyId(id) {
	if (id == null || id === '') return
	const s = getRiskAckSet()
	s.add(String(id))
	uni.setStorageSync(RISK_ACK_NOTIFY_IDS, [...s].slice(-400))
}

export function isRiskNotifyAcknowledged(id) {
	if (id == null || id === '') return false
	return getRiskAckSet().has(String(id))
}
