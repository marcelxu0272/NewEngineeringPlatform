/**
 * 人力需求表单模块
 * 负责关键岗位人力需求的创建、编辑、验证等功能
 */

window.HRFormModule = {
    /**
     * 获取表单的初始数据结构
     * @returns {Object} 表单初始数据
     */
    getInitialFormData() {
        return {
            id: null,
            createdTime: '',
            status: 'open',
            closeOutcome: '',
            eventType: '',
            payload: {
                // 审批流程相关字段
                submitter: '',
                submitTime: '',
                approvalFlow: null,
                closeReason: '',
                closeOperator: '',
                closeTime: '',
                // 关键岗位人力需求（YAML对齐）默认值
                projectNumber: '',
                projectName: '',
                projectManager: '',
                department: '',
                discipline: [],
                requirementType: '',
                jobTitle: '',
                coreResponsibilities: '',
                workLocation: '',
                requiredOnboardDate: '',
                positionCycle: '',
                quantity: 1,
                gender: 'any',
                ageRequirement: { minAge: undefined, maxAge: undefined },
                titleRequirement: '',
                professionalCertificates: [],
                customCertifications: '',
                experienceRequirement: '',
                educationRequirement: '',
                languageRequirement: '',
                otherRequirements: '',
                // 多岗位支持
                positions: []
            }
        };
    },

    /**
     * 创建新岗位对象
     * @returns {Object} 新岗位对象
     */
    createNewPosition() {
        return {
            // 增员方式：内部招聘 / 第三方合作，可多选
            staffingMethods: [],
            discipline: [],
            requirementType: '',
            jobTitle: '',
            coreResponsibilities: '',
            workLocation: '',
            requiredOnboardDate: '',
            positionCycle: '',
            quantity: 1,
            gender: 'any',
            ageRequirement: { minAge: undefined, maxAge: undefined },
            titleRequirement: '',
            professionalCertificates: [],
            customCertifications: '',
            experienceRequirement: '',
            educationRequirement: '',
            languageRequirement: '',
            otherRequirements: '',
            attachments: [],
            // 审批流程相关字段
            status: '待审批',
            submitter: '',
            submitTime: '',
            approvalFlow: {
                currentStep: 1,
                totalSteps: 2,
                steps: [
                    {
                        step: 1,
                        name: '板块总监审批',
                        status: 'pending',
                        approver: '',
                        approvalTime: null,
                        comment: null
                    },
                    {
                        step: 2,
                        name: '专业审批人审批',
                        status: 'pending',
                        approver: '',
                        approvalTime: null,
                        comment: null
                    }
                ]
            },
            closeReason: '',
            closeOperator: '',
            closeTime: ''
        };
    },

    /**
     * 格式化专业显示
     * @param {Array} discipline - 专业数据
     * @returns {string} 格式化后的专业文本
     */
    formatDiscipline(discipline) {
        if (!discipline || !Array.isArray(discipline)) {
            return '-';
        }
        return discipline.map(d => Array.isArray(d) ? d.join(' / ') : d).join('、');
    },

    /**
     * 格式化性别显示
     * @param {string} gender - 性别值
     * @returns {string} 格式化后的性别文本
     */
    formatGender(gender) {
        const genderMap = {
            'male': '男',
            'female': '女', 
            'any': '不限'
        };
        return genderMap[gender] || gender || '-';
    },

    /**
     * 格式化职称显示
     * @param {string} title - 职称值
     * @returns {string} 格式化后的职称文本
     */
    formatTitle(title) {
        const titleMap = {
            'junior': '初级',
            'intermediate': '中级',
            'senior': '高级',
            'professor_level': '正高级'
        };
        return titleMap[title] || title || '-';
    },

    /**
     * 格式化年龄范围显示
     * @param {Object} ageRequirement - 年龄要求对象
     * @returns {string} 格式化后的年龄范围文本
     */
    formatAgeRange(ageRequirement) {
        if (!ageRequirement) return '-';
        const minAge = ageRequirement.minAge || '不限';
        const maxAge = ageRequirement.maxAge || '不限';
        return `${minAge} - ${maxAge} 岁`;
    },

    /**
     * 格式化证书显示
     * @param {Array|string} certificates - 证书数组或字符串
     * @param {string} customCertifications - 自定义证书
     * @returns {string} 格式化后的证书文本
     */
    formatCertifications(certificates, customCertifications) {
        if (!certificates || certificates.length === 0) {
            return customCertifications || '';
        }
        
        // 兼容旧数据格式（字符串）
        if (typeof certificates === 'string') {
            return certificates || '';
        }
        
        // 新数据格式（数组）
        if (!Array.isArray(certificates)) {
            return customCertifications || '';
        }
        
        let result = certificates.join('，');
        
        // 如果选择了"其他"且有自定义证书，则添加自定义证书
        if (certificates.includes('其他') && customCertifications && customCertifications.trim()) {
            result += '，' + customCertifications.trim();
        }
        
        return result;
    },

    /**
     * 校验年龄区间
     * @param {Object} ageRequirement - 年龄要求对象
     * @returns {Object} 校验结果 {valid: boolean, message: string}
     */
    validateAgeRange(ageRequirement) {
        if (!ageRequirement) {
            return { valid: true, message: '' };
        }
        
        const minAge = ageRequirement.minAge;
        const maxAge = ageRequirement.maxAge;
        
        if (minAge && maxAge && maxAge < minAge) {
            return { valid: false, message: '最高年龄不能小于最低年龄' };
        }
        
        return { valid: true, message: '' };
    },

    /**
     * 生成年龄区间校验器（用于 Element UI 表单验证）
     * @param {Object} vueInstance - Vue 实例
     * @param {number} positionIndex - 岗位索引
     * @returns {Function} 校验函数
     */
    createAgeRangeValidator(vueInstance, positionIndex) {
        return (rule, value, callback) => {
            const positions = vueInstance.hrForm?.payload?.positions;
            if (!positions || !positions[positionIndex]) {
                callback();
                return;
            }
            
            const position = positions[positionIndex];
            const validation = this.validateAgeRange(position.ageRequirement);
            
            if (!validation.valid) {
                callback(new Error(validation.message));
                return;
            }
            
            callback();
        };
    },

    /**
     * 迁移旧证书数据格式到新格式
     * @param {Object} position - 岗位对象
     */
    migrateCertificationData(position) {
        if (position.professionalCertificates && typeof position.professionalCertificates === 'string') {
            // 旧格式：字符串，需要转换为数组
            const certStr = position.professionalCertificates.trim();
            if (certStr) {
                position.professionalCertificates = certStr.split(/[，,、]/).map(s => s.trim()).filter(s => s);
            } else {
                position.professionalCertificates = [];
            }
        }
        
        // 确保customCertifications字段存在
        if (!position.customCertifications) {
            position.customCertifications = '';
        }
    },

    /**
     * 生成需求编号
     * @param {string} projectNumber - 项目号
     * @param {string} department - 部门
     * @param {number} sequenceNumber - 序号
     * @returns {string} 需求编号
     */
    generateRequirementId(projectNumber, department, sequenceNumber) {
        // 项目编码映射
        const projectCodeMap = {
            'G24007': 'G24007',
            'C24035': 'C24035', 
            'PRJ-2024-001': 'PRJ001'
        };
        
        // 部门编码映射
        const departmentCodeMap = {
            'PMC 板块': 'PMC',
            '沈阳中心': 'SYC',
            '银川中心': 'YCC',
            '哈密中心': 'HMC'
        };
        
        const projectCode = projectCodeMap[projectNumber] || projectNumber.substring(0, 6);
        const deptCode = departmentCodeMap[department] || 'DEPT';
        const sequence = sequenceNumber.toString().padStart(4, '0');
        
        return `${projectCode}-${deptCode}-${sequence}`;
    },

    /**
     * 生成岗位级需求单
     * @param {Object} formData - 表单数据
     * @param {string} reporter - 填报人
     * @returns {Array} 岗位级需求单数组
     */
    generatePositionRequirements(formData, reporter) {
        const positions = formData.payload.positions || [];
        const requirements = [];
        const now = this.formatDateTime(new Date());
        
        positions.forEach((position, index) => {
            const requirementId = this.generateRequirementId(
                formData.payload.projectNumber,
                formData.payload.department,
                Date.now() + index
            );
            
            const requirement = {
                // 需求编号（系统自动生成）
                requirementId: requirementId,
                // 申请人信息
                applicant: reporter || '当前用户',
                applicationTime: now,
                
                // 创建者和编辑者信息
                creator: reporter || '当前用户',
                createTime: now,
                lastEditor: reporter || '当前用户',
                lastEditTime: now,
                
                // 项目信息
                projectNumber: formData.payload.projectNumber,
                projectName: formData.payload.projectName,
                projectManager: formData.payload.projectManager,
                department: formData.payload.department,
                
                // 岗位详情
                staffingMethods: position.staffingMethods,
                requirementType: position.requirementType,
                discipline: position.discipline,
                jobTitle: position.jobTitle,
                coreResponsibilities: position.coreResponsibilities,
                workLocation: position.workLocation,
                requiredOnboardDate: position.requiredOnboardDate,
                positionCycle: position.positionCycle,
                quantity: position.quantity,
                gender: position.gender,
                ageRequirement: position.ageRequirement,
                titleRequirement: position.titleRequirement,
                professionalCertificates: position.professionalCertificates,
                customCertifications: position.customCertifications,
                experienceRequirement: position.experienceRequirement,
                educationRequirement: position.educationRequirement,
                languageRequirement: position.languageRequirement,
                otherRequirements: position.otherRequirements,
                
                // 状态信息
                status: '待处理',
                createdTime: now,
                lastModified: now
            };
            
            requirements.push(requirement);
        });
        
        return requirements;
    },

    /**
     * 格式化日期时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期时间字符串
     */
    formatDateTime(date) {
        if (!(date instanceof Date)) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * 处理证书选择变化
     * @param {Object} vueInstance - Vue 实例
     * @param {Array} selectedCertificates - 选中的证书
     */
    handleCertificationChange(vueInstance, selectedCertificates) {
        if (!vueInstance.selectedPosition) return;
        
        // 如果没有选择"其他"选项，清空自定义证书
        if (!selectedCertificates || !selectedCertificates.includes('其他')) {
            vueInstance.$set(vueInstance.selectedPosition, 'customCertifications', '');
        }
    },

    /**
     * 更新自定义证书
     * @param {Object} vueInstance - Vue 实例
     * @param {string} value - 自定义证书值
     */
    updateCustomCertifications(vueInstance, value) {
        if (!vueInstance.selectedPosition) return;
        vueInstance.$set(vueInstance.selectedPosition, 'customCertifications', value);
    },

    /**
     * 获取板块总监审批人
     * @param {string} department - 部门名称
     * @returns {string} 板块总监姓名
     */
    getBoardDirector(department) {
        const boardDirectors = {
            'PMC 板块': '张明华',
            '沈阳中心': '刘志强', 
            '银川中心': '陈晓峰',
            '北京中心': '李建华',
            '上海中心': '王丽娟',
            '深圳中心': '赵国强'
        };
        return boardDirectors[department] || '待分配';
    },

    /**
     * 获取专业审批人
     * @param {Array} discipline - 专业信息 [一级专业, 二级专业]
     * @param {Object} approverConfig - 审批人配置对象
     * @returns {string} 专业审批人姓名
     */
    getProfessionalApprover(discipline, approverConfig) {
        if (!discipline || !Array.isArray(discipline) || discipline.length < 2) {
            return '待分配';
        }
        
        const [primaryDiscipline, secondaryDiscipline] = discipline;
        const disciplineKey = `${primaryDiscipline}_${secondaryDiscipline}`;
        
        return approverConfig[disciplineKey] || '待分配';
    },

    /**
     * 准备保存前的岗位数据处理
     * @param {Object} formData - 表单数据
     * @param {Object} approverConfig - 审批人配置
     * @param {string} reporter - 填报人
     * @returns {Object} 处理后的表单数据
     */
    prepareSaveData(formData, approverConfig, reporter) {
        const now = this.formatDateTime(new Date());
        const positions = formData.payload?.positions || [];
        
        // 为每个岗位设置提交者和提交时间
        positions.forEach(position => {
            if (!position.submitter) {
                position.submitter = reporter || '当前用户';
            }
            if (!position.submitTime) {
                position.submitTime = now;
            }
            
            // 设置审批人信息
            if (position.approvalFlow && position.approvalFlow.steps) {
                // 设置板块总监审批人
                if (position.approvalFlow.steps[0]) {
                    position.approvalFlow.steps[0].approver = this.getBoardDirector(formData.payload.department);
                }
                // 设置专业审批人
                if (position.approvalFlow.steps[1] && position.discipline && position.discipline.length > 0) {
                    position.approvalFlow.steps[1].approver = this.getProfessionalApprover(position.discipline[0], approverConfig);
                }
            }
        });
        
        // 生成岗位级需求单
        const positionRequirements = this.generatePositionRequirements(formData, reporter);
        formData.payload.positionRequirements = positionRequirements;
        
        // 用第一条填充旧字段（摘要），兼容旧的渲染逻辑
        if (positions.length > 0) {
            const first = positions[0];
            formData.payload.discipline = first.discipline;
            formData.payload.requirementType = first.requirementType;
            formData.payload.jobTitle = first.jobTitle;
            formData.payload.coreResponsibilities = first.coreResponsibilities;
            formData.payload.workLocation = first.workLocation;
            formData.payload.requiredOnboardDate = first.requiredOnboardDate;
            formData.payload.positionCycle = first.positionCycle;
            formData.payload.quantity = first.quantity;
            formData.payload.gender = first.gender;
            formData.payload.ageRequirement = first.ageRequirement;
            formData.payload.titleRequirement = first.titleRequirement;
            formData.payload.professionalCertificates = first.professionalCertificates;
            formData.payload.experienceRequirement = first.experienceRequirement;
            formData.payload.educationRequirement = first.educationRequirement;
            formData.payload.languageRequirement = first.languageRequirement;
            formData.payload.otherRequirements = first.otherRequirements;
        }
        
        return formData;
    },

    /**
     * 岗位排序和筛选
     * @param {Array} positions - 岗位列表
     * @param {Object} filters - 筛选条件
     * @returns {Array} 排序和筛选后的岗位列表
     */
    applyPositionFilters(positions, filters) {
        if (!positions || !Array.isArray(positions)) return [];
        
        let filtered = positions.filter(p => {
            const textOk = filters.searchText ? (
                (p.jobTitle || '').includes(filters.searchText) ||
                (p.workLocation || '').includes(filters.searchText)
            ) : true;
            
            const discOk = (filters.filterDisciplines && filters.filterDisciplines.length > 0) ? (
                (Array.isArray(p.discipline) ? p.discipline : []).some(d => 
                    filters.filterDisciplines.some(fd => 
                        Array.isArray(d) && Array.isArray(fd) && d[0] === fd[0] && d[1] === fd[1]
                    )
                )
            ) : true;
            
            return textOk && discOk;
        });
        
        // 排序
        const sortBy = filters.sortBy;
        filtered.sort((a, b) => {
            if (sortBy === 'requiredOnboardDate') {
                return (a.requiredOnboardDate || '') > (b.requiredOnboardDate || '') ? 1 : -1;
            }
            if (sortBy === 'jobTitle') {
                return (a.jobTitle || '').localeCompare(b.jobTitle || '');
            }
            if (sortBy === 'discipline') {
                const ad = Array.isArray(a.discipline) && a.discipline[0] ? 
                    (a.discipline[0][1] || a.discipline[0][0] || '') : '';
                const bd = Array.isArray(b.discipline) && b.discipline[0] ? 
                    (b.discipline[0][1] || b.discipline[0][0] || '') : '';
                return ad.localeCompare(bd);
            }
            return 0;
        });
        
        return filtered;
    },

    /**
     * 批量导入：映射性别值
     * @param {string} value - 原始性别值
     * @returns {string} 映射后的性别值
     */
    mapGenderValue(value) {
        const genderMap = {
            '男': 'male',
            '女': 'female',
            '不限': 'any'
        };
        return genderMap[value] || 'any';
    },

    /**
     * 批量导入：解析年龄要求
     * @param {string} value - 年龄要求字符串（如：30-45）
     * @returns {Object} 年龄要求对象
     */
    parseAgeRequirement(value) {
        if (!value) return { minAge: '', maxAge: '' };
        const match = value.match(/(\d+)-(\d+)/);
        if (match) {
            return { minAge: parseInt(match[1]), maxAge: parseInt(match[2]) };
        }
        return { minAge: '', maxAge: '' };
    },

    /**
     * 批量导入：映射职称值
     * @param {string} value - 原始职称值
     * @returns {string} 映射后的职称值
     */
    mapTitleValue(value) {
        const titleMap = {
            '初级': 'junior',
            '中级': 'intermediate',
            '高级': 'senior',
            '正高级': 'professor_level'
        };
        return titleMap[value] || '';
    },

    /**
     * 批量导入：映射学历值
     * @param {string} value - 原始学历值
     * @returns {string} 映射后的学历值
     */
    mapEducationValue(value) {
        const educationMap = {
            '高中': 'high_school',
            '大专': 'associate',
            '本科': 'bachelor',
            '硕士': 'master',
            '博士': 'phd'
        };
        return educationMap[value] || '';
    },

    /**
     * 批量导入：解析CSV数据
     * @param {string} csvText - CSV文本内容
     * @returns {Array} 解析后的数据数组
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('文件内容不完整');
        }
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                rows.push(row);
            }
        }
        
        return rows;
    },

    /**
     * 批量导入：处理导入数据
     * @param {Array} data - 原始导入数据
     * @returns {Array} 处理后的岗位数据
     */
    processImportData(data) {
        return data.map(row => {
            // 解析专业字段
            const disciplineStr = row['专业'] || '';
            const disciplines = disciplineStr ? disciplineStr.split(';').map(d => {
                const parts = d.trim().split('/');
                return parts.length >= 2 ? [parts[0], parts[1]] : [d.trim()];
            }) : [];
            
            // 创建岗位对象
            return {
                jobTitle: row['岗位名称'] || `岗位${Date.now()}`,
                discipline: disciplines,
                quantity: parseInt(row['数量']) || 1,
                workLocation: row['工作地点'] || '',
                requiredOnboardDate: row['到岗日期'] || '',
                positionCycle: row['岗位周期'] || '',
                gender: this.mapGenderValue(row['性别要求']),
                ageRequirement: this.parseAgeRequirement(row['年龄要求']),
                titleRequirement: this.mapTitleValue(row['职称要求']),
                professionalCertificates: row['专业资格证书'] ? [row['专业资格证书']] : [],
                experienceRequirement: row['工作经验'] || '',
                educationRequirement: this.mapEducationValue(row['学历要求']),
                coreResponsibilities: row['核心职责'] || '',
                otherRequirements: row['其他要求'] || '',
                customCertifications: '',
                languageRequirement: '',
                requirementType: '',
                attachments: [],
                isValid: true
            };
        });
    },

    /**
     * 生成批量导入模板数据
     * @returns {Array} 模板数据
     */
    getImportTemplateData() {
        return [
            {
                '岗位名称': '项目经理',
                '专业': '管理/项目经理',
                '数量': 1,
                '工作地点': '北京市',
                '到岗日期': '2024-03-01',
                '岗位周期': '项目期',
                '性别要求': '不限',
                '年龄要求': '30-45',
                '职称要求': '中级',
                '专业资格证书': 'PMP',
                '工作经验': '5年以上项目管理经验',
                '学历要求': '本科',
                '核心职责': '负责项目整体管理和协调',
                '其他要求': '具备良好的沟通协调能力'
            },
            {
                '岗位名称': '电气工程师',
                '专业': '设计/电气',
                '数量': 2,
                '工作地点': '上海市',
                '到岗日期': '2024-03-15',
                '岗位周期': '6个月',
                '性别要求': '不限',
                '年龄要求': '25-40',
                '职称要求': '初级',
                '专业资格证书': '注册电气',
                '工作经验': '3年以上电气设计经验',
                '学历要求': '本科',
                '核心职责': '负责电气系统设计和安装指导',
                '其他要求': '熟悉AutoCAD等设计软件'
            }
        ];
    },

    /**
     * 生成CSV格式的模板文件内容
     * @returns {string} CSV内容（带BOM）
     */
    generateTemplateCSV() {
        const templateData = this.getImportTemplateData();
        const headers = Object.keys(templateData[0]);
        const csvContent = [
            headers.join(','),
            ...templateData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // 添加BOM以支持中文
        const BOM = '\uFEFF';
        return BOM + csvContent;
    }
};

