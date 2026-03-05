# scripts 目录

放与工程平台相关的**脚本和原始数据**，不参与 Next 应用运行时。

- **app.csv**、**skill.csv**、**sme.csv** - 原始 CSV 数据，可用于导入或离线分析
- **sme_converter.ipynb** - Jupyter 笔记本，用于 SME 等数据转换

需要跑 seed 时，数据来源是 `lib/data/` 下的 TS/TSX，不是本目录的 CSV。
