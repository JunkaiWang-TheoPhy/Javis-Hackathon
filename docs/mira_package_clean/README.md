# Mira 十页项目说明书

本压缩包包含：

- `main.tex`：LaTeX 源文件（XeLaTeX 编译）
- `Mira_正式十页说明书.pdf`：编译后的 PDF
- `assets/cover-banner.png`：封面横幅图
- `assets/social-value-table.png`：社会价值表格图
- `build.sh`：本地重新编译脚本

## 编译方式

在安装 `xelatex` 的环境中执行：

```bash
bash build.sh
```

或手动执行两次：

```bash
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex
```
