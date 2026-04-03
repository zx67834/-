/**
 * CLI 默认 UNI_INPUT_DIR=src，@/ 会解析到 src/，但 uni_modules 常在项目根目录。
 * 在 src/uni_modules 创建指向根目录 uni_modules 的联接（Windows: junction，macOS/Linux: 目录软链）。
 * 复制项目时联接不会跟过来，需在 install 后执行本脚本。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const target = path.join(root, 'uni_modules')
const link = path.join(root, 'src', 'uni_modules')
const force = process.env.LINK_UNI_MODULES_FORCE === '1'

function sameTarget() {
  try {
    return fs.realpathSync(target) === fs.realpathSync(link)
  } catch {
    return false
  }
}

function main() {
  if (!fs.existsSync(target)) {
    console.warn('[link-uni-modules] 跳过：未找到根目录 uni_modules')
    return
  }

  if (fs.existsSync(link)) {
    if (sameTarget()) return
    if (!force) {
      console.warn(
        '[link-uni-modules] src/uni_modules 已存在但未指向根目录 uni_modules。'
      )
      console.warn(
        '[link-uni-modules] 可执行：set LINK_UNI_MODULES_FORCE=1 && node scripts/ensure-uni-modules.mjs'
      )
      return
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backup = path.join(root, 'src', `uni_modules_backup_${stamp}`)
    fs.renameSync(link, backup)
    console.log(`[link-uni-modules] 已备份冲突目录到: ${backup}`)
  }

  fs.mkdirSync(path.dirname(link), { recursive: true })
  if (process.platform === 'win32') {
    fs.symlinkSync(target, link, 'junction')
  } else {
    fs.symlinkSync(target, link, 'dir')
  }
  console.log('[link-uni-modules] 已创建 src/uni_modules → 根目录 uni_modules')
}

main()
