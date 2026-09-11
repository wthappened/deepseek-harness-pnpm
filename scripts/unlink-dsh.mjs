// 从 pnpm 全局 bin 目录移除 dsh / dsh.CMD / dsh.ps1 启动器。
//
// 与 link-dsh.mjs 对称：link 负责按绝对路径生成 shim，unlink 负责删除。
// 卸载时可能 node_modules 已被删除，所以本脚本不依赖 dsh 包本身，
// 只需要 pnpm bin -g 定位目录即可运行。
//
// 为避免误删用户自己的同名命令，仅删除内容里指向 @deepseek-ai/dsh 的 shim。

import { execSync } from 'node:child_process'
import { rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// pnpm 全局 bin 目录
let binDir
try {
  const out = execSync('pnpm bin -g', { encoding: 'utf8' })
  binDir = out.trim().split(/\r?\n/).filter(Boolean).pop()
} catch {
  binDir = ''
}
if (!binDir) {
  console.error('错误：无法从 pnpm 获取全局 bin 目录（pnpm bin -g 失败）。')
  process.exit(1)
}

const marker = '@deepseek-ai/dsh'
const names = ['dsh', 'dsh.CMD', 'dsh.ps1']
let removed = 0

for (const name of names) {
  const dest = join(binDir, name)
  if (!existsSync(dest)) continue

  let content = ''
  try { content = readFileSync(dest, 'utf8') } catch { /* 读不到就当作不匹配 */ }
  const normalized = content.replace(/\\/g, '/').toLowerCase()
  if (!normalized.includes(marker)) {
    console.log(`跳过 ${dest}（不是 dsh 启动器）`)
    continue
  }

  rmSync(dest)
  console.log(`已删除 ${dest}`)
  removed++
}

if (removed === 0) console.log('没有需要删除的 dsh 启动器。')
else console.log(`共删除 ${removed} 个 dsh 启动器。`)
