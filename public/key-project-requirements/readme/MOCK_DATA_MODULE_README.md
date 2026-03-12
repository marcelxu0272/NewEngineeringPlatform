# 模拟数据生成器模块说明

## 概述

本次重构将"生成岗位需求需求模拟数据"功能从 `index_v2.html` 中分离出来，作为独立的功能模块 `mock-data-generator.js`，便于项目维护和扩展。

## 文件结构

```
项目根目录/
├── index_v2.html                 # 主页面文件
├── mock-data-generator.js        # 模拟数据生成器模块（新增）
└── MOCK_DATA_MODULE_README.md    # 本说明文档（新增）
```

## 模块功能

### mock-data-generator.js

该模块提供以下功能：

1. **generateKeyPositionMockData()** - 生成岗位需求需求模拟数据
   - 返回包含多个项目的岗位需求数据数组
   - 包含 6 个不同类型的项目数据（EPC、PMC、设计、咨询等）
   - 每个项目包含完整的岗位信息、审批流程等

2. **generateHrMemoMockData()** - 生成HR备忘录模拟数据
   - 调用 `generateKeyPositionMockData()` 并返回整合后的数据
   - 可扩展添加其他类型的备忘录数据

## 使用方式

### 在 HTML 中引入

```html
<!-- Mock Data Generator Module -->
<script src="mock-data-generator.js"></script>
```

### 在 Vue 实例中调用

```javascript
// 方式 1: 直接调用
const mockData = window.MockDataGenerator.generateKeyPositionMockData();

// 方式 2: 在 Vue methods 中包装调用
methods: {
    generateKeyPositionMockData() {
        return window.MockDataGenerator.generateKeyPositionMockData();
    },
    generateHrMemoMockData() {
        this.hrMemos = window.MockDataGenerator.generateHrMemoMockData();
    }
}
```

## 重构前后对比

### 重构前
- 模拟数据生成函数直接定义在 `index_v2.html` 的 Vue 实例中
- 代码量大（约 580+ 行），影响主文件可读性
- 维护和测试不便

### 重构后
- 模拟数据生成逻辑独立到 `mock-data-generator.js` 文件
- 主文件代码更简洁，仅保留接口调用（约 5 行）
- 便于单独维护、测试和扩展
- 可在其他页面或模块中复用

## 功能验证

原有功能保持不变：

✅ 页面加载时自动生成模拟数据  
✅ 数据格式和内容完全一致  
✅ 所有依赖该数据的功能正常工作  
✅ 筛选、排序、审批流程等功能正常  

## 扩展指南

### 添加新的模拟数据

在 `mock-data-generator.js` 中添加新的函数：

```javascript
window.MockDataGenerator = {
    // 现有函数...
    
    // 新增函数
    generateCustomMockData() {
        return [
            // 你的自定义模拟数据
        ];
    }
};
```

### 修改现有模拟数据

直接编辑 `mock-data-generator.js` 文件中的数据结构，无需修改主 HTML 文件。

## 技术细节

- **命名空间**: 使用 `window.MockDataGenerator` 避免全局变量污染
- **兼容性**: 与现有 Vue 2.x 代码完全兼容
- **性能**: 按需调用，不影响页面加载性能
- **可维护性**: 独立模块便于版本控制和代码审查

## 注意事项

1. `mock-data-generator.js` 必须在 Vue 实例初始化之前加载
2. 确保 `window.MockDataGenerator` 对象在调用前已定义
3. 如需修改数据结构，请同时确保与使用该数据的代码兼容

## 维护建议

1. **数据更新**: 仅在 `mock-data-generator.js` 中维护模拟数据
2. **代码审查**: 独立文件便于代码审查和版本比对
3. **测试**: 可单独对模块进行单元测试
4. **文档**: 在模块中添加必要的注释说明数据结构

## 更新日期

2025-10-23

## 相关文件

- `index_v2.html` - 主页面文件
- `mock-data-generator.js` - 模拟数据生成器模块

