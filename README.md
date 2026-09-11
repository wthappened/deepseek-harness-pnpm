# dsh-runtime

给 [@deepseek-ai/dsh](https://github.com/deepseek-ai/deepseek-harness) 用的 pnpm **hoisted** 运行时 + 全局启动器安装器。

## 为什么需要这个项目

官方 `@deepseek-ai/dsh` 没法用 `pnpm add -g @deepseek-ai/dsh` 装、也没法 `pnpm dlx @deepseek-ai/dsh web` 跑，因为：

- dsh 的 cordis-plugin-loader 用**裸 `import()`** 加载兄弟插件包，解析基准是 loader 自身所在的 node_modules 树；
- pnpm 默认的 isolated（符号链接）布局下，loader 只能看到自己的直接依赖，兄弟插件包全部 `ERR_MODULE_NOT_FOUND`。

本项目用 `nodeLinker: hoisted` 把 dsh 装成它假设的扁平布局，再在 pnpm 全局 bin 目录生成指向本地入口**绝对路径**的 `dsh` / `dsh.CMD` / `dsh.ps1`，于是任何终端里都能直接 `dsh web`。

## 安装

任选与你终端匹配的一种：

```bat
:: CMD
install.cmd
```
```powershell
# PowerShell（执行策略可能拦截未签名脚本，用 Bypass 跑一次）
powershell -ExecutionPolicy Bypass -File .\install.ps1
```
```bash
# Git Bash / WSL
bash install.sh
```

三者等价：`pnpm install`（hoisted）→ 解析 dsh 入口 → 在 `pnpm bin -g` 目录生成三个启动器 → `dsh --version` 冒烟测试。

## 卸载

```bat
uninstall.cmd
```
```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```
```bash
bash uninstall.sh
```

删除三个全局启动器 + 本地 `node_modules`。**先关掉正在运行的 dsh**，否则 node_modules 会因文件占用删不掉。只想临时移除命令而保留依赖，可单独跑 `node scripts/unlink-dsh.mjs`。

## 升级 dsh 版本

改 [package.json](package.json) 里 `@deepseek-ai/dsh` 的版本号，重新跑一次 install 即可。`pnpm-workspace.yaml` 用 `@deepseek-ai/*` 通配豁免 minimumReleaseAge，不需要随版本改动。

## 说明

- 生成的启动器内嵌**安装时的 node 绝对路径**（`process.execPath`），换用 nvm/fnm 切换 node 版本后需重跑 install 刷新。
- 原生模块（node-pty / koffi / fs-ext）需要能编译或有对应 node 版本的预编译二进制。**建议用 LTS node（20/22/24）**；过新的 node 可能没有预编译二进制，要本地编译工具链。
- 三个 shell 包装脚本只负责环境检查和装/删 node_modules；真正的启动器增删逻辑集中在 [scripts/link-dsh.mjs](scripts/link-dsh.mjs) 和 [scripts/unlink-dsh.mjs](scripts/unlink-dsh.mjs)，三端共用。
