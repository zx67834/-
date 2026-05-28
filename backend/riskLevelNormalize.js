/**
 * 反诈分析：校准模型分级倾向 + 统一 risk_level 写法
 */

const RISK_CALIBRATION_RULES = `【风险分级必须遵守】
- low：日常问候、闲聊、正常学习/工作/生活内容、与诈骗无关；或无明显可疑点。
- medium：存在营销诱导、模糊话术或轻度可疑，但未出现转账、验证码、密码、假冒公检法/银行等强证据。
- high：仅当内容明确包含典型诈骗强特征（如冒充公检法/银行/客服、索要验证码或密码、要求向私人账户紧急转账、虚假中奖先付费等），且与原文直接对应时，才可判定为 high。
禁止对普通内容「宁可错杀」一律标为 high；若无上述强特征，risk_level 不得为 high。
risk_level 字段必须是英文小写之一：high、medium、low（不要输出中文）。`;

/**
 * @param {unknown} raw
 * @returns {'high'|'medium'|'low'}
 */
function normalizeRiskLevel(raw) {
  if (raw == null || raw === '') return 'low';
  const t = String(raw).trim();
  const s = t.toLowerCase();

  if (s === 'high' || s === 'h') return 'high';
  if (s === 'medium' || s === 'm' || s === 'mid' || s === 'moderate') return 'medium';
  if (s === 'low' || s === 'l' || s === 'none' || s === 'safe' || s === 'minimal') return 'low';

  if (t === '高' || t === '高风险' || s === '高风险') return 'high';
  if (t === '中' || t === '中风险' || s === '中风险') return 'medium';
  if (t === '低' || t === '低风险' || s === '低风险') return 'low';

  if (/高风险/.test(t)) return 'high';
  if (/中风险/.test(t)) return 'medium';
  if (/低风险/.test(t)) return 'low';

  if (/极高|严重|危急/.test(t)) return 'high';
  if (/中等|一般可疑/.test(t)) return 'medium';

  // 单字谨慎匹配，避免「高中」等误判
  if (/^高$|风险[^低中]*高/.test(t)) return 'high';
  if (/^中$/.test(t)) return 'medium';
  if (/^低$/.test(t)) return 'low';

  return 'low';
}

/**
 * @param {object|null|undefined} analysis
 * @returns {object}
 */
function normalizeAnalysisRisk(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    return {
      risk_level: 'low',
      confidence: 0.5,
      reasons: ['分析结果异常'],
      suggestions: ['请更换表述后重试或人工复核'],
      summary: '未能完成有效分级'
    };
  }
  const out = { ...analysis };
  out.risk_level = normalizeRiskLevel(analysis.risk_level);
  return out;
}

module.exports = {
  RISK_CALIBRATION_RULES,
  normalizeRiskLevel,
  normalizeAnalysisRisk
};
