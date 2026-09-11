// 在 pnpm 全局 bin 目录生成 dsh / dsh.CMD / dsh.ps1 三个启动器，并做一次冒烟测试。
//
// 官方 @deepseek-ai/dsh 不能用 `pnpm add -g` 直接装（它用裸 import() 加载兄弟
// 插件，依赖 hoisted 扁平布局），所以本项目用 hoisted 布局把它装到本地
// node_modules，再由本脚本生成指向本地入口“绝对路径”的全局 shim。
//
// pnpm install 只会在 node_modules/.bin 里生成“相对路径”的 shim，复制到全局
// 目录后相对路径就断了，因此这里必须重新按绝对路径生成。

import { execSync, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { join, resolve, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..')

// 1. 解析 dsh 的真实入口：优先读包的 bin 字段（命令名 dsh），回退到 lib/bin.js。
function resolveEntry() {
  try {
    const pkgPath = require.resolve('@deepseek-ai/dsh/package.json', { paths: [projectRoot] })
    const pkg = require(pkgPath)
    const pkgDir = resolve(pkgPath, '..')
    const bin = pkg.bin
    const rel = typeof bin === 'string' ? bin : bin?.dsh ?? (bin && Object.values(bin)[0])
    if (rel) return resolve(pkgDir, rel)
  } catch {
    // 忽略，走回退
  }
  return join(projectRoot, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
}

const entry = resolveEntry()
if (!existsSync(entry)) {
  console.error(`错误：找不到 dsh 入口 ${entry}，请先成功执行 pnpm install。`)
  process.exit(1)
}

// 2. 取 pnpm 全局 bin 目录（权威来源，shim 放这里能否被 PATH 命中就看它）。
let binDir
try {
  const out = execSync('pnpm bin -g', { encoding: 'utf8' })
  binDir = out.trim().split(/\r?\n/).filter(Boolean).pop()
} catch {
  binDir = ''
}
if (!binDir) {
  console.error('错误：无法从 pnpm 获取全局 bin 目录（pnpm bin -g 失败）。请先运行 pnpm setup。')
  process.exit(1)
}
mkdirSync(binDir, { recursive: true })

// 3. 按平台生成三个 shim。node 用安装时的绝对路径（process.execPath），这样即使
//    dsh 从没有 node 的上下文（GUI、计划任务）启动也能工作。
//    注意 ps1 用绝对路径必须加 & 调用运算符，否则 PowerShell 会把它当字符串输出。
const nodePosix = process.execPath.replace(/\\/g, '/')
const nodeWin = process.execPath.replace(/\//g, '\\')
const entryPosix = entry.replace(/\\/g, '/')
const entryWin = entry.replace(/\//g, '\\')

const shims = {
  'dsh': `#!/bin/sh\nexec "${nodePosix}" "${entryPosix}" "$@"\n`,
  'dsh.CMD': `@echo off\r\n"${nodeWin}" "${entryWin}" %*\r\nexit /b %errorlevel%\r\n`,
  'dsh.ps1': `#!/usr/bin/env pwsh\n& "${nodeWin}" "${entryWin}" @args\nexit $LASTEXITCODE\n`,
}

for (const [name, content] of Object.entries(shims)) {
  const dest = join(binDir, name)
  writeFileSync(dest, content)
  try { chmodSync(dest, 0o755) } catch { /* Windows 无执行位，忽略 */ }
}

console.log('已生成 dsh 启动器：')
console.log('  node  ->', process.execPath)
console.log('  entry ->', entryWin)
for (const name of Object.keys(shims)) console.log('  ' + join(binDir, name))

// 4. 提醒 PATH：shim 所在目录不在 PATH 时，dsh 命令仍然用不了。
const norm = p => resolve(p).toLowerCase()
const onPath = (process.env.PATH ?? '')
  .split(delimiter)
  .map(s => s.trim())
  .filter(Boolean)
  .some(p => norm(p) === norm(binDir))
if (!onPath) {
  console.log('')
  console.log(`提示：${binDir} 不在当前 PATH 中，直接输入 dsh 可能无效。`)
  console.log('可运行 pnpm setup，或手动把该目录加入 PATH 后重开终端。')
}

// 5. 冒烟测试：用刚确定的入口跑一次 --version，失败则整个安装判为失败。
try {
  const ver = execFileSync(process.execPath, [entry, '--version'], { encoding: 'utf8' }).trim()
  console.log('')
  console.log('dsh --version ->', ver || '(无输出)')
} catch (e) {
  console.error('')
  console.error('错误：dsh --version 冒烟测试失败：', e.message)
  process.exit(1)
}
