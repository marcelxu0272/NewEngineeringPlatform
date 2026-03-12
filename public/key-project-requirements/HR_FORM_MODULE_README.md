# 人力需求表单模块 (HR Form Module)

## 📋 概述

`hr-form-module.js` 是一个独立的 JavaScript 模块，用于管理关键岗位人力需求的创建、编辑、验证和批量导入功能。

## 🎯 设计目标

- **代码分离**：将表单相关的业务逻辑从主 Vue 应用中分离出来
- **可维护性**：集中管理表单相关功能，便于维护和更新
- **可复用性**：模块化设计，便于在其他页面或项目中复用
- **清晰性**：每个函数职责明确，易于理解和测试

## 📦 模块结构

### 1. 数据结构管理

#### `getInitialFormData()`
返回表单的初始数据结构，包含所有必需字段的默认值。

```javascript
const formData = window.HRFormModule.getInitialFormData();
```

#### `createNewPosition()`
创建新岗位对象，包含完整的字段定义和默认的审批流程。

```javascript
const position = window.HRFormModule.createNewPosition();
```

### 2. 数据格式化

#### `formatDiscipline(discipline)`
格式化专业显示（级联选择器格式）

```javascript
// 输入: [['设计', '电气']]
// 输出: "设计 / 电气"
const formatted = window.HRFormModule.formatDiscipline(discipline);
```

#### `formatGender(gender)`
格式化性别显示

```javascript
// 输入: 'male'
// 输出: '男'
const genderText = window.HRFormModule.formatGender('male');
```

#### `formatTitle(title)`
格式化职称显示

```javascript
// 输入: 'senior'
// 输出: '高级'
const titleText = window.HRFormModule.formatTitle('senior');
```

#### `formatAgeRange(ageRequirement)`
格式化年龄范围显示

```javascript
// 输入: { minAge: 30, maxAge: 45 }
// 输出: "30 - 45 岁"
const ageText = window.HRFormModule.formatAgeRange(ageRequirement);
```

#### `formatCertifications(certificates, customCertifications)`
格式化证书显示，支持数组和字符串格式

```javascript
// 输入: ['注册电气', '其他'], '自定义证书1'
// 输出: "注册电气，其他，自定义证书1"
const certText = window.HRFormModule.formatCertifications(certificates, customCertifications);
```

### 3. 数据验证

#### `validateAgeRange(ageRequirement)`
验证年龄区间的有效性

```javascript
const result = window.HRFormModule.validateAgeRange({ minAge: 30, maxAge: 45 });
// 返回: { valid: true, message: '' }
```

#### `createAgeRangeValidator(vueInstance, positionIndex)`
创建 Element UI 表单验证器

```javascript
// 在 Vue 组件中使用
validateAgeRangePosition(pIndex) {
    return window.HRFormModule.createAgeRangeValidator(this, pIndex);
}
```

### 4. 审批流程

#### `getBoardDirector(department)`
根据部门获取板块总监

```javascript
const director = window.HRFormModule.getBoardDirector('PMC 板块');
// 返回: '张明华'
```

#### `getProfessionalApprover(discipline, approverConfig)`
根据专业获取专业审批人

```javascript
const approver = window.HRFormModule.getProfessionalApprover(['设计', '电气'], approverConfig);
```

### 5. 保存前处理

#### `prepareSaveData(formData, approverConfig, reporter)`
准备保存前的数据处理，包括：
- 设置提交者和提交时间
- 配置审批人信息
- 生成岗位级需求单
- 填充摘要字段

```javascript
const preparedData = window.HRFormModule.prepareSaveData(formData, approverConfig, reporter);
```

### 6. 批量导入

#### `parseCSV(csvText)`
解析 CSV 文件内容

```javascript
const data = window.HRFormModule.parseCSV(csvText);
```

#### `processImportData(data)`
处理导入的数据，转换为岗位对象格式

```javascript
const positions = window.HRFormModule.processImportData(rawData);
```

#### `generateTemplateCSV()`
生成 CSV 格式的导入模板

```javascript
const csvContent = window.HRFormModule.generateTemplateCSV();
```

#### `getImportTemplateData()`
获取模板数据结构

```javascript
const templateData = window.HRFormModule.getImportTemplateData();
```

### 7. 岗位管理

#### `applyPositionFilters(positions, filters)`
对岗位列表进行筛选和排序

```javascript
const filtered = window.HRFormModule.applyPositionFilters(positions, {
    searchText: '电气',
    filterDisciplines: [['设计', '电气']],
    sortBy: 'jobTitle'
});
```

#### `generateRequirementId(projectNumber, department, sequenceNumber)`
生成需求编号

```javascript
const reqId = window.HRFormModule.generateRequirementId('G24007', 'PMC 板块', 1);
// 返回: 'G24007-PMC-0001'
```

#### `generatePositionRequirements(formData, reporter)`
生成岗位级需求单

```javascript
const requirements = window.HRFormModule.generatePositionRequirements(formData, '张三');
```

### 8. 数据映射（批量导入用）

#### `mapGenderValue(value)`
映射性别值（中文 → 英文代码）

```javascript
const gender = window.HRFormModule.mapGenderValue('男');
// 返回: 'male'
```

#### `mapTitleValue(value)`
映射职称值（中文 → 英文代码）

```javascript
const title = window.HRFormModule.mapTitleValue('高级');
// 返回: 'senior'
```

#### `mapEducationValue(value)`
映射学历值（中文 → 英文代码）

```javascript
const education = window.HRFormModule.mapEducationValue('本科');
// 返回: 'bachelor'
```

#### `parseAgeRequirement(value)`
解析年龄要求字符串

```javascript
const ageReq = window.HRFormModule.parseAgeRequirement('30-45');
// 返回: { minAge: 30, maxAge: 45 }
```

### 9. 工具函数

#### `formatDateTime(date)`
格式化日期时间

```javascript
const formatted = window.HRFormModule.formatDateTime(new Date());
// 返回: '2024-01-15 14:30:45'
```

#### `migrateCertificationData(position)`
迁移旧证书数据格式到新格式

```javascript
window.HRFormModule.migrateCertificationData(position);
```

#### `handleCertificationChange(vueInstance, selectedCertificates)`
处理证书选择变化

```javascript
window.HRFormModule.handleCertificationChange(this, selectedCerts);
```

#### `updateCustomCertifications(vueInstance, value)`
更新自定义证书

```javascript
window.HRFormModule.updateCustomCertifications(this, '自定义证书');
```

## 🔧 使用示例

### 在 Vue 组件中使用

```javascript
// 1. 引入模块（在 HTML 中）
<script src="hr-form-module.js"></script>

// 2. 在 Vue 方法中调用
methods: {
    resetHrForm() {
        this.hrForm = window.HRFormModule.getInitialFormData();
    },
    
    newPosition() {
        return window.HRFormModule.createNewPosition();
    },
    
    formatDiscipline(discipline) {
        return window.HRFormModule.formatDiscipline(discipline);
    },
    
    saveMemo() {
        // 准备保存数据
        this.hrForm = window.HRFormModule.prepareSaveData(
            this.hrForm, 
            this.approverConfig, 
            this.hrForm.reporter
        );
        
        // 继续保存逻辑...
    }
}
```

## 📝 维护指南

### 添加新的格式化函数

在模块末尾添加新函数：

```javascript
/**
 * 格式化新字段
 * @param {*} value - 字段值
 * @returns {string} 格式化后的文本
 */
formatNewField(value) {
    // 实现逻辑
    return formattedValue;
}
```

### 修改数据结构

在 `getInitialFormData()` 或 `createNewPosition()` 中添加/修改字段：

```javascript
createNewPosition() {
    return {
        // ... 现有字段
        newField: defaultValue, // 新增字段
        // ...
    };
}
```

### 更新审批逻辑

修改 `prepareSaveData()` 函数中的审批人设置逻辑。

## 🔄 与主应用的集成

### index_v2.html 中的调用

模块通过 `window.HRFormModule` 全局对象暴露所有功能，主应用通过以下方式调用：

```javascript
// 格式化显示
formatDiscipline(discipline) {
    return window.HRFormModule.formatDiscipline(discipline);
},

// 数据准备
prepareSaveData() {
    this.hrForm = window.HRFormModule.prepareSaveData(
        this.hrForm, 
        this.approverConfig, 
        this.hrForm.reporter
    );
}
```

## 📊 模块依赖

- **无外部依赖**：模块是纯 JavaScript，不依赖任何第三方库
- **Vue 集成**：部分函数需要 Vue 实例作为参数（如验证器）
- **全局暴露**：通过 `window.HRFormModule` 暴露

## 🚀 优势

1. **代码组织**：相关功能集中管理
2. **易于测试**：纯函数易于单元测试
3. **减少耦合**：主应用只调用模块接口
4. **便于复用**：可在多个页面中使用
5. **维护简单**：修改时只需关注一个文件

## 📌 注意事项

1. 确保在 Vue 应用初始化前加载模块
2. 模块函数都挂载在 `window.HRFormModule` 下
3. 部分函数需要 Vue 实例作为参数（用于响应式更新）
4. 批量导入仅支持 CSV 格式

## 🔮 未来改进

- [ ] 支持 Excel 文件解析
- [ ] 添加更多数据验证规则
- [ ] 支持自定义审批流程配置
- [ ] 添加单元测试
- [ ] 支持导出功能








