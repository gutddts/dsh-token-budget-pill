# 发布到 GitHub 与 npm

这个仓库已经可以直接发布。需要两个授权：GitHub PAT 和 npm token；它们都必须由账号本人创建（需要登录 / 2FA），脚本无法代生成。

## 1. 创建 GitHub PAT

打开 <https://github.com/settings/tokens/new?scopes=repo&description=dsh-token-budget-pill>，勾选：

- `repo`（classic token 的完整仓库权限）

或者 fine-grained token：

- Repository access：All repositories
- Permissions：Administration 读+写（创建仓库）、Contents 读+写、Metadata 读

复制生成的 `ghp_...` / `github_pat_...`。

## 2. 创建 npm token

打开 <https://www.npmjs.com/settings/~/tokens> → **Generate New Token**：

- 选 **Classic Token → Automation**（最简单，适合新包首次发布）
- 或 **Granular Access Token**：Read and write；Packages 选 All packages（新包还没有可选的具体包）

复制生成的 `npm_...`。

## 3. 替换仓库地址中的用户名

把 `package.json`、`README.md` 中的 `gutddts` 替换成你的 GitHub 用户名：

```powershell
$user = "你的GitHub用户名"
Get-ChildItem package.json, README.md, LICENSE -File | ForEach-Object {
  (Get-Content $_.FullName -Raw).Replace('gutddts', $user) | Set-Content $_.FullName -NoNewline
}
```

## 4. 创建 GitHub 仓库并上传

在 <https://github.com/new> 新建仓库 `dsh-token-budget-pill`（不要勾选 README / .gitignore），然后任选一种：

### 图形界面上传

把本目录里的所有文件（含 `.github/`、`docs/`、`lib/`）拖进 GitHub 的 **uploading an existing file** 页面，提交即可。

### 命令行

```bash
git init
git add .
git commit -m "feat: dsh-token-budget-pill 1.0.0"
git branch -M main
git remote add origin https://github.com/你的用户名/dsh-token-budget-pill.git
git push -u origin main
```

## 5. 发布到 npm

```bash
npm login
npm publish --access public
```

或者直接在 GitHub 仓库的 **Actions → publish** 里运行，并先添加仓库 Secret `NPM_TOKEN`（值就是第 2 步的 npm token）。

发布后验证：

```bash
npm view dsh-token-budget-pill version
```

## 6. 别人如何安装

```bash
dsh plugin --profile web add dsh-token-budget-pill
dsh web
```

桌面版把 `web` 换成 `desktop`；也可以在图形的 **设置 → 插件 → 安装插件** 里输入包名。
