/**
 * 项目配置管理工具 - 主要业务逻辑
 * 使用Vue.js 2 + Element UI构建
 */

// 预设配置项数据
const DEFAULT_CONFIG_ITEMS = [
    // 项目管理类
    { id: 1, name: 'Project Categorisation verified by PM', chineseName: '项目经理验证的项目分类', tags: ['项目管理'], standardFiles: [], enabled: true },
    { id: 2, name: 'Staffing Plan & Personnel Competency Review', chineseName: '人员配置计划和人员能力评审', tags: ['项目管理'], standardFiles: [], enabled: true },
    { id: 3, name: 'BD Handover PEER Review', chineseName: '商务开发移交同行评审', tags: ['项目管理'], standardFiles: [], enabled: true },
    { id: 4, name: 'Management of Change', chineseName: '变更管理', tags: ['项目管理'], standardFiles: [], enabled: true },
    
    // 质量审计类
    { id: 5, name: 'Project Quality Audits/Assessments', chineseName: '项目质量审计/评估', tags: ['质量审计'], standardFiles: [], enabled: true },
    { id: 6, name: 'Internal Project Reviews', chineseName: '内部项目评审', tags: ['质量审计'], standardFiles: [], enabled: true },
    { id: 7, name: 'Business Functional Audits/Assessments', chineseName: '业务功能审计/评估', tags: ['质量审计'], standardFiles: [], enabled: true },
    { id: 8, name: 'Project HSSE Audits', chineseName: '项目健康安全环保审计', tags: ['质量审计'], standardFiles: [], enabled: true },
    
    // 技术评审类
    { id: 9, name: 'HAZOP/HAZID Reviews', chineseName: '危险与可操作性分析/危险识别评审', tags: ['技术评审'], standardFiles: [], enabled: true },
    { id: 10, name: 'P&ID/UID Review', chineseName: '工艺流程图/公用工程流程图评审', tags: ['技术评审'], standardFiles: [], enabled: true },
    { id: 11, name: 'PEER Reviews', chineseName: '同行评审', tags: ['技术评审'], standardFiles: [], enabled: true },
    { id: 12, name: 'Execution & Technical', chineseName: '执行与技术评审', tags: ['技术评审'], standardFiles: [], enabled: true },
    { id: 13, name: 'Special Purpose Reviews', chineseName: '专项评审', tags: ['技术评审'], standardFiles: [], enabled: true },
    
    // 工程设计类
    { id: 14, name: 'Explosion-proof Area Division Review', chineseName: '防爆区域划分评审', tags: ['工程设计'], standardFiles: [], enabled: true },
    { id: 15, name: 'General Plot Plan Review', chineseName: '总平面布置图评审', tags: ['工程设计'], standardFiles: [], enabled: true },
    { id: 16, name: 'Operability Reviews', chineseName: '可操作性评审', tags: ['工程设计'], standardFiles: [], enabled: true },
    { id: 17, name: 'Maintainability Reviews', chineseName: '可维护性评审', tags: ['工程设计'], standardFiles: [], enabled: true },
    { id: 18, name: 'Constructability Review', chineseName: '可施工性评审', tags: ['工程设计'], standardFiles: [], enabled: true },
    { id: 19, name: 'Value Engineering', chineseName: '价值工程', tags: ['工程设计'], standardFiles: [], enabled: true },
    
    // 项目控制类
    { id: 20, name: 'Cost Estimate Review', chineseName: '成本估算评审', tags: ['项目控制'], standardFiles: [], enabled: true },
    { id: 21, name: 'Schedule Development', chineseName: '进度计划制定', tags: ['项目控制'], standardFiles: [], enabled: true },
    { id: 22, name: 'Project Risk Management Review', chineseName: '项目风险管理评审', tags: ['项目控制'], standardFiles: [], enabled: true },
    { id: 23, name: 'Specific Project Delivery Objectives (SPDOs)', chineseName: '特定项目交付目标', tags: ['项目控制'], standardFiles: [], enabled: true },
    
    // 其他
    { id: 24, name: 'Customer Satisfaction', chineseName: '客户满意度', tags: ['其他'], standardFiles: [], enabled: true },
    { id: 25, name: 'Lesson Learn', chineseName: '经验教训总结', tags: ['其他'], standardFiles: [], enabled: true },
    { id: 26, name: 'Spot check', chineseName: '抽查检验', tags: ['其他'], standardFiles: [], enabled: true }
];

// 项目阶段定义
const PROJECT_PHASES = [
    { id: 'phase1', name: '启动阶段（Ⅰ）' },
    { id: 'phase2', name: '执行阶段（Ⅱ）' },
    { id: 'phase3', name: '项目交付阶段（Ⅲ）' }
];

// Vue应用实例
const app = new Vue({
    el: '#app',
    data() {
        return {
            // 页面加载状态
            isLoading: true,
            
            // 基础数据
            configItems: [...DEFAULT_CONFIG_ITEMS],
            phases: PROJECT_PHASES,
            
            // 项目配置数据
            phaseConfigurations: {
                phase1: [],
                phase2: [],
                phase3: []
            },
            
            // 版本管理
            currentVersion: 'V1',
            currentVersionId: null,
            versionHistory: [],
            isApproved: false,
            
            // 正在配置的版本号（未提交审批前不算正式版本）
            currentDraftVersion: 'V1',
            
            // 审批状态：configuring(配置中), pending(待审批), approved(已通过), rejected(已驳回)
            currentStatus: 'configuring',
            
            // 审批日志
            approvalLogs: [],
            
            // 界面状态
            searchKeyword: '',
            draggedItem: null,
            
            // 对话框状态
            showItemDetail: false,
            showManageItemsDialog: false,
            showApprovalLogDialog: false,
            showRejectDialog: false,
            
            // 选中的配置项详情
            selectedItem: null,
            selectedPhaseId: null,
            selectedItemIndex: null,
            
            // 表单数据
            itemDetailForm: {
                status: 'progress',
                plannedTime: '',
                notes: '',
                files: []
            },
            
            // 管理配置项相关数据
            manageSearchKeyword: '',
            manageStatusFilter: 'all', // 配置项状态过滤器: all, enabled, disabled
            editingItem: null,
            saving: false,
            
            // 驳回表单数据
            rejectForm: {
                reason: ''
            },
            rejecting: false,
            
            // 统一的配置项表单
            itemForm: {
                name: '',
                chineseName: '',
                tags: [],
                standardFiles: []
            },
            
            // 表单验证规则
            itemFormRules: {
                name: [
                    { required: true, message: '请输入配置项名称', trigger: 'blur' },
                    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
                ],
                chineseName: [
                    { required: true, message: '请输入中文名称', trigger: 'blur' },
                    { min: 2, max: 50, message: '中文名称长度在 2 到 50 个字符', trigger: 'blur' }
                ],
                tags: [
                    { required: true, message: '请选择至少一个标签', trigger: 'change' },
                    { 
                        validator: (rule, value, callback) => {
                            if (value.length > 3) {
                                callback(new Error('最多只能选择3个标签'));
                            } else {
                                callback();
                            }
                        }, 
                        trigger: 'change' 
                    }
                ]
            },
            
            // 驳回表单验证规则
            rejectFormRules: {
                reason: [
                    { required: true, message: '请填写驳回原因', trigger: 'blur' },
                    { min: 5, message: '驳回原因至少需要5个字符', trigger: 'blur' },
                    { max: 500, message: '驳回原因不能超过500个字符', trigger: 'blur' }
                ]
            },
            
            // 可用标签列表
            availableTags: ['项目管理', '质量审计', '技术评审', '工程设计', '项目控制', '其他'],
            
            // 标准文件查看相关状态
            showStandardFileDialog: false,
            currentStandardFile: null,
            currentFileConfigItem: null,
            filePreviewUrl: '',
            filePreviewContent: '',
            previewError: false,
            previewErrorMessage: ''
        };
    },
    
    computed: {
        // 过滤后的配置项列表 - 只显示已启用的配置项
        filteredConfigItems() {
            let items = this.configItems.filter(item => item.enabled === true);
            if (!this.searchKeyword) return items;
            return items.filter(item => 
                item.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
            );
        },
        
        // 管理界面过滤后的配置项列表 - 支持状态过滤和搜索
        filteredManageItems() {
            let items = this.configItems;
            
            // 状态过滤
            if (this.manageStatusFilter === 'enabled') {
                items = items.filter(item => item.enabled === true);
            } else if (this.manageStatusFilter === 'disabled') {
                items = items.filter(item => item.enabled === false);
            }
            
            // 关键词搜索
            if (this.manageSearchKeyword) {
                const keyword = this.manageSearchKeyword.toLowerCase();
                items = items.filter(item => 
                    item.name.toLowerCase().includes(keyword) ||
                    item.tags.some(tag => tag.toLowerCase().includes(keyword))
                );
            }
            
            return items;
        },
        
        // 检查是否可以提交配置（所有配置项都有计划时间）
        canSubmitConfiguration() {
            if (this.currentStatus !== 'configuring' || this.getTotalConfigItemsCount() === 0) {
                return false;
            }
            
            // 检查所有配置项是否都有计划时间
            return this.validateAllPlannedTimes().isValid;
        },
        
        // 获取提交按钮的提示文本
        submitButtonTooltip() {
            if (this.currentStatus !== 'configuring') {
                return '当前配置已提交审批';
            }
            
            if (this.getTotalConfigItemsCount() === 0) {
                return '请先添加配置项到各个阶段';
            }
            
            const validationResult = this.validateAllPlannedTimes();
            if (!validationResult.isValid) {
                return '还有配置项未填写计划时间';
            }
            
            return '可以提交配置';
        },
        
        // 判断配置项是否为只读状态（已完成或已终止）
        isItemReadOnly() {
            return this.currentStatus === 'approved' && 
                   this.itemDetailForm && 
                   (this.itemDetailForm.status === 'completed' || this.itemDetailForm.status === 'terminated');
        },
        
        // 按时间倒序排序的审批日志
        sortedApprovalLogs() {
            return this.approvalLogs.slice().sort((a, b) => {
                // 按照ID倒序排序（ID是时间戳，越大越新）
                return b.id - a.id;
            });
        },
        
        // 检查配置项是否已经被拖拽到任何阶段中
        isItemInAnyPhase() {
            return (itemId) => {
                return Object.values(this.phaseConfigurations).some(phaseItems => 
                    phaseItems.some(item => item.name === this.configItems.find(ci => ci.id === itemId)?.name)
                );
            };
        },
        
        // 获取可用的历史版本列表（包含已审批和正在审核的版本，排除当前版本）
        availableVersionHistory() {
            return this.versionHistory.filter(version => 
                version.id !== this.currentVersionId && 
                (version.isApproved === true || version.status === 'pending')
            );
        },
        
        // 是否应该显示历史版本按钮（有历史版本时就显示）
        shouldShowVersionHistory() {
            return this.availableVersionHistory.length > 0;
        }
    },
    
    mounted() {
        // 开始加载流程
        this.startLoadingProcess();
    },
    
    methods: {
        // 简洁加载流程
        startLoadingProcess() {
            // 初始化数据
            this.loadData();
            this.initializeDefaultVersion();
            this.setupDragDropEvents();
            
            // 简单延迟后隐藏加载状态
            setTimeout(() => {
                this.isLoading = false;
            }, 1000);
        },
        
        /**
         * 数据管理相关方法
         */
        
        // 加载本地存储的数据
        loadData() {
            const data = localStorage.getItem('projectConfig');
            if (data) {
                const parsed = JSON.parse(data);
                this.phaseConfigurations = parsed.phaseConfigurations || this.phaseConfigurations;
                this.isApproved = parsed.isApproved || false;
                this.versionHistory = parsed.versionHistory || [];
                this.currentStatus = parsed.currentStatus || 'configuring';
                this.approvalLogs = parsed.approvalLogs || [];
                this.currentVersion = parsed.currentVersion || 'V1';
                this.currentVersionId = parsed.currentVersionId || null;
                this.currentDraftVersion = parsed.currentDraftVersion || 'V1';
            }
        },
        
        // 保存数据到本地存储
        saveData() {
            localStorage.setItem('projectConfig', JSON.stringify({
                phaseConfigurations: this.phaseConfigurations,
                isApproved: this.isApproved,
                versionHistory: this.versionHistory,
                currentStatus: this.currentStatus,
                approvalLogs: this.approvalLogs,
                currentVersion: this.currentVersion,
                currentVersionId: this.currentVersionId,
                currentDraftVersion: this.currentDraftVersion
            }));
        },
        
        // 初始化默认版本
        initializeDefaultVersion() {
            // 新的逻辑：只有在没有任何版本且当前不在配置状态时才初始化
            if (this.versionHistory.length === 0 && this.currentStatus !== 'configuring') {
                // 如果有配置项，说明需要创建初始版本
                if (this.getTotalConfigItemsCount() > 0) {
                    this.versionHistory.push({
                        id: Date.now(),
                        version: '1',
                        createTime: new Date().toLocaleString(),
                        configurations: this.phaseConfigurations,
                        isApproved: this.isApproved || false
                    });
                    this.currentVersionId = this.versionHistory[0].id;
                }
                this.currentVersion = 'V1';
                this.currentDraftVersion = 'V1';
            }
        },
        
        // 加载预设的标准文件
        // async loadPresetStandardFiles() {
        //     try {
        //         // 加载 static/file.pdf 作为 Project Categorisation verified by PM 的标准文件
        //         const response = await fetch('./static/file.pdf');
        //         if (response.ok) {
        //             const blob = await response.blob();
        //             const file = new File([blob], 'file.pdf', { 
        //                 type: 'application/pdf',
        //                 lastModified: Date.now()
        //             });
                    
        //             // 找到对应的配置项并设置标准文件
        //             const targetItem = this.configItems.find(item => item.name === 'Project Categorisation verified by PM');
        //             if (targetItem) {
        //                 targetItem.standardFile = file;
        //                 console.log('✅ 已成功加载 Project Categorisation verified by PM 的标准文件');
        //                 this.$message.success('标准文件加载成功');
        //             }
        //         } else {
        //             console.warn('⚠️ 无法加载 static/file.pdf 文件');
        //         }
        //     } catch (error) {
        //         console.error('❌ 加载标准文件时出错:', error);
        //         // 不显示错误消息，因为这是可选功能
        //     }
        // },
        
        /**
         * 拖拽功能相关方法
         */
        
        // 设置拖拽事件监听
        setupDragDropEvents() {
            // 防止页面拖拽时的默认行为
            document.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            document.addEventListener('drop', (e) => {
                e.preventDefault();
            });
        },
        
        // 开始拖拽
        onDragStart(event, item) {
            this.draggedItem = item;
            event.dataTransfer.effectAllowed = 'copy';
            // 移除立即添加dragging样式的逻辑
        },
        
        // 拖拽结束
        onDragEnd(event) {
            // 移除立即移除dragging样式的逻辑
            this.draggedItem = null;
        },
        
        // 放置到阶段
        onDrop(event, phaseId) {
            event.preventDefault();
            
            if (!this.draggedItem) return;
            
            // 检查配置项是否已启用，只有启用的配置项才能被拖拽
            if (!this.draggedItem.enabled) {
                this.$message.warning('该配置项已被禁用，无法添加到项目阶段中');
                this.draggedItem = null;
                return;
            }
            
            // 克隆配置项
            const newItem = {
                ...this.draggedItem,
                status: 'progress',
                plannedTime: '',
                completedTime: '',
                terminatedTime: '',
                standardLink: '',
                notes: '',
                files: [],
                standardFiles: [...(this.draggedItem.standardFiles || [])], // 确保正确复制标准文件数组
                id: Date.now() + Math.random() // 生成唯一ID
            };
            
            // 添加到对应阶段
            this.phaseConfigurations[phaseId].push(newItem);
            
            // 重新计算所有同名配置项的序号（包括第一项）
            this.recalculateSequences(phaseId, newItem.name);
            
            // 同步更新版本历史记录中的配置
            this.updateVersionConfiguration();
            
            // 保存数据
            this.saveData();
            
            // 自动打开配置项设置对话框，要求设置计划时间
            const itemIndex = this.phaseConfigurations[phaseId].length - 1;
            this.openItemDetail(newItem, phaseId, itemIndex);
            
            // 显示提示消息
            // this.$message.success(`已添加"${newItem.name}"，请设置计划时间`);
            
            // 重置拖拽状态
            this.draggedItem = null;
        },
        
        /**
         * 阶段管理相关方法
         */
        
        // 获取阶段中的配置项
        getPhaseItems(phaseId) {
            return this.phaseConfigurations[phaseId] || [];
        },
        
        // 获取阶段名称
        getPhaseNameById(phaseId) {
            const phase = this.phases.find(p => p.id === phaseId);
            return phase ? phase.name : '';
        },
        
        // 获取阶段配置项总数
        getPhaseItemsCount(phaseId) {
            return this.getPhaseItems(phaseId).length;
        },
        
        // 获取阶段已完成配置项数量
        getPhaseCompletedCount(phaseId) {
            return this.getPhaseItems(phaseId).filter(item => item.status === 'completed').length;
        },
        
        // 获取阶段进行中配置项数量
        getPhaseProgressCount(phaseId) {
            return this.getPhaseItems(phaseId).filter(item => item.status === 'progress').length;
        },
        
        // 获取阶段已终止配置项数量
        getPhaseTerminatedCount(phaseId) {
            return this.getPhaseItems(phaseId).filter(item => item.status === 'terminated').length;
        },
        
        // 删除阶段中的配置项
        removePhaseItem(phaseId, itemIndex) {
            this.$confirm('确定要删除这个配置项吗？', '确认删除', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                const items = this.phaseConfigurations[phaseId];
                const removedItem = items[itemIndex];
                items.splice(itemIndex, 1);
                
                // 重新计算序号
                this.recalculateSequences(phaseId, removedItem.name);
                
                // 同步更新版本历史记录中的配置
                this.updateVersionConfiguration();
                
                this.saveData();
                this.$message.success('配置项已删除');
            }).catch(() => {
                // 用户取消删除
            });
        },
        
        // 重新计算序号
        recalculateSequences(phaseId, itemName) {
            const items = this.phaseConfigurations[phaseId].filter(item => item.name === itemName);
            items.forEach((item, index) => {
                if (items.length > 1) {
                    item.sequence = index + 1;
                } else {
                    delete item.sequence;
                }
            });
        },
        
        /**
         * 配置项状态管理
         */
        
        // 获取配置项状态样式类
        getItemStatusClass(item) {
            return item.status || 'progress';
        },
        
        // 获取状态图标
        getStatusIcon(item) {
            switch (item.status) {
                case 'completed':
                    return 'fas fa-check-circle text-green-500';
                case 'terminated':
                    return 'fas fa-times-circle text-red-500';
                default:
                    return 'fas fa-clock text-blue-500';
            }
        },
        
        /**
         * 配置项详情对话框
         */
        
        // 打开配置项详情
        openItemDetail(item, phaseId, itemIndex) {
            this.selectedItem = item;
            this.selectedPhaseId = phaseId;
            this.selectedItemIndex = itemIndex;
            
            // 初始化表单数据
            this.itemDetailForm = {
                status: item.status || 'progress',
                plannedTime: item.plannedTime || '',
                notes: item.notes || '',
                files: item.files || []
            };
            
            this.showItemDetail = true;
        },
        
        // 重置配置项详情
        resetItemDetail() {
            this.selectedItem = null;
            this.selectedPhaseId = null;
            this.selectedItemIndex = null;
            this.itemDetailForm = {
                status: 'progress',
                plannedTime: '',
                notes: '',
                files: []
            };
        },
        
        // 保存配置项详情
        saveItemDetail() {
            if (!this.selectedItem) {
                this.$message.error('未选中配置项');
                return;
            }
            
            // 验证必填字段 - 计划时间在配置阶段和审批阶段都是必填的
            if (!this.itemDetailForm.plannedTime) {
                this.$message.error('请填写计划时间（必填）');
                return;
            }
            
            // 更新配置项数据
            const item = this.phaseConfigurations[this.selectedPhaseId][this.selectedItemIndex];
            Object.assign(item, this.itemDetailForm);
            
            // 同步更新版本历史记录中的配置
            this.updateVersionConfiguration();
            
            this.saveData();
            this.showItemDetail = false;
            
            if (this.isApproved) {
                this.$message.success('配置项详情已保存');
            } else {
                this.$message.success('配置项设置已保存');
            }
        },
        
        // 标记为完成
        markItemCompleted() {
            if (!this.selectedItem || !this.itemDetailForm.plannedTime) {
                this.$message.error('请先填写计划时间');
                return;
            }
            
            // 更新表单状态和完成时间
            this.itemDetailForm.status = 'completed';
            this.itemDetailForm.completedTime = new Date().toISOString().split('T')[0];
            
            // 更新配置项数据
            const item = this.phaseConfigurations[this.selectedPhaseId][this.selectedItemIndex];
            Object.assign(item, this.itemDetailForm);
            
            // 同步更新版本历史记录中的配置
            this.updateVersionConfiguration();
            
            this.saveData();
            this.$message.success('配置项已标记为完成');
            
            // 注意：不关闭对话框，让用户看到状态变化，并可以查看完成后的状态
        },
        
        // 标记为终止
        markItemTerminated() {
            if (!this.selectedItem) return;
            
            // 更新表单状态和终止时间
            this.itemDetailForm.status = 'terminated';
            this.itemDetailForm.terminatedTime = new Date().toISOString().split('T')[0];
            
            // 更新配置项数据
            const item = this.phaseConfigurations[this.selectedPhaseId][this.selectedItemIndex];
            Object.assign(item, this.itemDetailForm);
            
            // 同步更新版本历史记录中的配置
            this.updateVersionConfiguration();
            
            this.saveData();
            this.$message.success('配置项已标记为终止');
            
            // 注意：不关闭对话框，让用户看到状态变化，并可以查看终止后的状态
        },
        
        // 文件变更处理
        handleFileChange(file, fileList) {
            const validation = this.validateFileForUpload(file, true);
            
            if (!validation.isValid) {
                // 验证失败，清空文件列表
                this.itemDetailForm.files = [];
                return;
            }
            
            // 验证通过，允许上传
            this.itemDetailForm.files = fileList;
        },
        
        // 打开文件上传页面
        openFileUploadPage() {
            // 这里可以根据具体需求设置跳转链接
            // 目前显示一个消息提示，实际应用中可以替换为具体的URL
            this.$message({
                message: '将在新窗口中打开文件上传页面',
                type: 'info'
            });
            
            // 实际应用中，可以使用以下代码跳转到具体的上传页面：
            // window.open('您的文件上传页面URL', '_blank');
            
            // 示例：模拟打开新窗口
            setTimeout(() => {
                this.$message({
                    message: '这里是文件上传页面链接的示例',
                    type: 'success'
                });
            }, 1000);
        },
        
        /**
         * 配置项管理
         */
        
        /**
         * 状态显示相关方法
         */
        
        // 获取状态显示文本
        getStatusDisplayText(status) {
            const statusMap = {
                'progress': '进行中',
                'completed': '已完成',
                'terminated': '已终止'
            };
            return statusMap[status] || '进行中';
        },
        
        // 获取状态显示样式类
        getStatusDisplayClass(status) {
            const classMap = {
                'progress': 'status-progress',
                'completed': 'status-completed',
                'terminated': 'status-terminated'
            };
            return classMap[status] || 'status-progress';
        },
        
        /**
         * 标准文件查看相关方法
         */
        
        // 查看标准文件
        viewStandardFile(item, fileIndex = 0) {
            if (!item.standardFiles || item.standardFiles.length === 0) {
                this.$message.warning('该配置项暂无标准文件');
                return;
            }
            
            if (fileIndex >= item.standardFiles.length) {
                this.$message.warning('文件索引超出范围');
                return;
            }
            
            // 获取指定索引的文件对象
            const realFile = this.getRealFileObject(item.standardFiles[fileIndex]);
            if (!realFile) {
                this.$message.error('文件格式不支持，无法预览');
                return;
            }
            
            // 设置当前查看的文件和配置项信息
            this.currentStandardFile = realFile;
            this.currentFileConfigItem = item;
            
            // 重置预览状态
            this.resetPreviewState();
            
            // 显示文件查看对话框
            this.showStandardFileDialog = true;
            
            // 延迟加载预览内容，确保对话框已渲染
            this.$nextTick(() => {
                this.loadFilePreview();
            });
        },
        
        // 重置预览状态
        resetPreviewState() {
            this.filePreviewUrl = '';
            this.filePreviewContent = '';
            this.previewError = false;
            this.previewErrorMessage = '';
        },
        
        // 获取真正的文件对象（处理Element UI的文件包装器）
        getRealFileObject(fileOrWrapper) {
            if (!fileOrWrapper) {
                return null;
            }
            
            // 如果已经是File或Blob对象，直接返回
            if (fileOrWrapper instanceof File || fileOrWrapper instanceof Blob) {
                return fileOrWrapper;
            }
            
            // 如果是Element UI的文件包装器，尝试从raw属性获取
            if (fileOrWrapper.raw && (fileOrWrapper.raw instanceof File || fileOrWrapper.raw instanceof Blob)) {
                return fileOrWrapper.raw;
            }
            
            // 如果有originFileObj属性（某些情况下可能存在）
            if (fileOrWrapper.originFileObj && (fileOrWrapper.originFileObj instanceof File || fileOrWrapper.originFileObj instanceof Blob)) {
                return fileOrWrapper.originFileObj;
            }
            
            console.warn('无法从文件对象中提取真正的File对象:', fileOrWrapper);
            return null;
        },
        
        // 加载文件预览
        loadFilePreview() {
            // 增强空值检查和文件对象验证
            if (!this.currentStandardFile) {
                console.warn('没有要预览的文件');
                return;
            }
            
            // 检查是否为有效的文件对象
            if (!(this.currentStandardFile instanceof File) && !(this.currentStandardFile instanceof Blob)) {
                console.error('无效的文件对象:', this.currentStandardFile);
                this.previewError = true;
                this.previewErrorMessage = '文件格式不支持预览，请尝试下载查看';
                return;
            }
            
            try {
                // 创建文件URL用于预览
                const fileUrl = URL.createObjectURL(this.currentStandardFile);
                
                if (this.isPdfFile(this.currentStandardFile)) {
                    // PDF文件直接使用URL预览
                    this.filePreviewUrl = fileUrl;
                } else if (this.isImageFile(this.currentStandardFile)) {
                    // 图片文件直接使用URL预览
                    this.filePreviewUrl = fileUrl;
                } else if (this.isTextFile(this.currentStandardFile)) {
                    // 文本文件读取内容
                    this.loadTextFileContent();
                    // 清理PDF/图片的URL
                    URL.revokeObjectURL(fileUrl);
                } else {
                    // 其他文件类型（Word、Excel、PPT等）不支持在线预览
                    // 清理未使用的URL
                    URL.revokeObjectURL(fileUrl);
                    // 不设置预览错误，让界面显示"不支持预览"的友好提示
                }
            } catch (error) {
                console.error('文件预览加载失败:', error);
                this.previewError = true;
                this.previewErrorMessage = '文件加载失败，请尝试下载查看';
            }
        },
        
        // 加载文本文件内容
        loadTextFileContent() {
            if (!this.currentStandardFile) {
                this.previewError = true;
                this.previewErrorMessage = '没有要读取的文件';
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    this.filePreviewContent = e.target.result;
                } catch (error) {
                    console.error('文本内容读取失败:', error);
                    this.previewError = true;
                    this.previewErrorMessage = '文本内容读取失败';
                }
            };
            
            reader.onerror = (error) => {
                console.error('文件读取出错:', error);
                this.previewError = true;
                this.previewErrorMessage = '文件读取失败';
            };
            
            try {
                // 根据文件类型选择合适的读取方式
                const fileType = this.currentStandardFile.type || '';
                if (fileType.startsWith('text/')) {
                    reader.readAsText(this.currentStandardFile, 'UTF-8');
                } else {
                    reader.readAsText(this.currentStandardFile);
                }
            } catch (error) {
                console.error('启动文件读取时出错:', error);
                this.previewError = true;
                this.previewErrorMessage = '无法读取文件内容';
            }
        },
        
        // 判断是否为PDF文件
        isPdfFile(fileOrWrapper) {
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            if (!file || !file.name) return false;
            try {
                const type = file.type || '';
                const name = file.name || '';
                return type === 'application/pdf' || 
                       name.toLowerCase().endsWith('.pdf');
            } catch (error) {
                console.error('检查PDF文件类型时出错:', error);
                return false;
            }
        },
        
        // 判断是否为图片文件
        isImageFile(fileOrWrapper) {
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            if (!file || !file.name) return false;
            try {
                const type = file.type || '';
                const name = file.name || '';
                return type.startsWith('image/') || 
                       /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(name);
            } catch (error) {
                console.error('检查图片文件类型时出错:', error);
                return false;
            }
        },
        
        // 判断是否为文档文件（Word、Excel、PPT等）
        isDocumentFile(fileOrWrapper) {
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            if (!file || !file.name) return false;
            try {
                const type = file.type || '';
                const name = file.name || '';
                return type.includes('word') || type.includes('excel') || type.includes('powerpoint') ||
                       type.includes('msword') || type.includes('ms-excel') || type.includes('ms-powerpoint') ||
                       type.includes('officedocument') ||
                       /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(name);
            } catch (error) {
                console.error('检查文档文件类型时出错:', error);
                return false;
            }
        },
        
        // 判断是否为文本文件
        isTextFile(fileOrWrapper) {
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            if (!file || !file.name) return false;
            try {
                const type = file.type || '';
                const name = file.name || '';
                return type.startsWith('text/') || 
                       /\.(txt|md|json|xml|csv|log|js|css|html|htm)$/i.test(name);
            } catch (error) {
                console.error('检查文本文件类型时出错:', error);
                return false;
            }
        },
        
        // 获取文件类型图标
        getFileTypeIcon(fileOrWrapper) {
            // 获取真正的文件对象
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            
            // 添加空值检查
            if (!file || !file.name) {
                return 'fas fa-file text-gray-400';
            }
            
            try {
                const name = file.name.toLowerCase();
                const type = (file.type || '').toLowerCase();
                
                if (this.isPdfFile(file)) {
                    return 'fas fa-file-pdf text-red-500';
                } else if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
                    return 'fas fa-file-word text-blue-500';
                } else if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
                    return 'fas fa-file-excel text-green-500';
                } else if (type.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
                    return 'fas fa-file-powerpoint text-orange-500';
                } else if (this.isImageFile(file)) {
                    return 'fas fa-file-image text-purple-500';
                } else if (this.isTextFile(file)) {
                    return 'fas fa-file-alt text-gray-500';
                } else if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
                    return 'fas fa-file-archive text-yellow-500';
                } else {
                    return 'fas fa-file text-gray-400';
                }
            } catch (error) {
                console.error('获取文件类型图标时出错:', error);
                return 'fas fa-file text-gray-400';
            }
        },
        
        // 获取文件类型名称
        getFileTypeName(fileOrWrapper) {
            // 获取真正的文件对象
            const file = this.getRealFileObject(fileOrWrapper) || fileOrWrapper;
            
            // 添加空值检查
            if (!file || !file.name) {
                return '未知文件';
            }
            
            try {
                const name = file.name.toLowerCase();
                const type = (file.type || '').toLowerCase();
                
                if (this.isPdfFile(file)) {
                    return 'PDF文档';
                } else if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
                    return 'Word文档';
                } else if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
                    return 'Excel表格';
                } else if (type.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
                    return 'PowerPoint演示文稿';
                } else if (this.isImageFile(file)) {
                    return '图片文件';
                } else if (this.isTextFile(file)) {
                    return '文本文件';
                } else if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
                    return '压缩文件';
                } else {
                    return '其他文件';
                }
            } catch (error) {
                console.error('获取文件类型名称时出错:', error);
                return '未知文件';
            }
        },
        
        // 格式化文件大小
        formatFileSize(fileSizeOrFileObject) {
            let bytes = fileSizeOrFileObject;
            
            // 如果传入的是文件对象，提取size属性
            if (typeof fileSizeOrFileObject === 'object' && fileSizeOrFileObject !== null) {
                // 先尝试从真正的File对象获取size
                const realFile = this.getRealFileObject(fileSizeOrFileObject);
                if (realFile && typeof realFile.size === 'number') {
                    bytes = realFile.size;
                } else if (typeof fileSizeOrFileObject.size === 'number') {
                    bytes = fileSizeOrFileObject.size;
                } else {
                    return '未知大小';
                }
            }
            
            // 添加空值和类型检查
            if (bytes === null || bytes === undefined || isNaN(bytes)) {
                return '未知大小';
            }
            
            if (bytes === 0) return '0 B';
            
            try {
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                // 确保索引在有效范围内
                const sizeIndex = Math.min(i, sizes.length - 1);
                
                return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
            } catch (error) {
                console.error('格式化文件大小时出错:', error);
                return '未知大小';
            }
        },
        
        // 格式化文件日期
        formatFileDate(timestampOrFileObject) {
            let timestamp = timestampOrFileObject;
            
            // 如果传入的是文件对象，提取lastModified属性
            if (typeof timestampOrFileObject === 'object' && timestampOrFileObject !== null) {
                // 先尝试从真正的File对象获取lastModified
                const realFile = this.getRealFileObject(timestampOrFileObject);
                if (realFile && realFile.lastModified) {
                    timestamp = realFile.lastModified;
                } else if (timestampOrFileObject.lastModified) {
                    timestamp = timestampOrFileObject.lastModified;
                } else {
                    return '未知时间';
                }
            }
            
            // 检查时间戳有效性
            if (!timestamp || isNaN(timestamp)) {
                return '未知时间';
            }
            
            try {
                return new Date(timestamp).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                console.error('格式化文件日期时出错:', error);
                return '未知时间';
            }
        },
        
        // 下载标准文件
        downloadStandardFile() {
            if (!this.currentStandardFile) {
                this.$message.error('没有可下载的文件');
                return;
            }
            
            // 检查是否为有效的文件对象
            if (!(this.currentStandardFile instanceof File) && !(this.currentStandardFile instanceof Blob)) {
                this.$message.error('文件格式无效，无法下载');
                return;
            }
            
            try {
                // 创建下载链接
                const url = URL.createObjectURL(this.currentStandardFile);
                const link = document.createElement('a');
                link.href = url;
                link.download = this.currentStandardFile.name || '未知文件';
                
                // 触发下载
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // 清理URL对象
                URL.revokeObjectURL(url);
                
                this.$message.success('文件下载已开始');
            } catch (error) {
                console.error('文件下载失败:', error);
                this.$message.error('文件下载失败，请重试');
            }
        },
        
        // 在新窗口中打开文件
        openFileInNewWindow() {
            if (!this.currentStandardFile) {
                this.$message.error('没有可打开的文件');
                return;
            }
            
            // 检查是否为有效的文件对象
            if (!(this.currentStandardFile instanceof File) && !(this.currentStandardFile instanceof Blob)) {
                this.$message.error('文件格式无效，无法打开');
                return;
            }
            
            try {
                const url = URL.createObjectURL(this.currentStandardFile);
                const newWindow = window.open(url, '_blank');
                
                if (!newWindow) {
                    // 清理未使用的URL
                    URL.revokeObjectURL(url);
                    this.$message.warning('无法打开新窗口，请检查浏览器弹窗设置');
                } else {
                    this.$message.success('文件已在新窗口中打开');
                    
                    // 当新窗口关闭时清理URL
                    newWindow.onbeforeunload = () => {
                        URL.revokeObjectURL(url);
                    };
                }
            } catch (error) {
                console.error('文件打开失败:', error);
                this.$message.error('文件打开失败，请尝试下载查看');
            }
        },
        
        // 预览加载成功回调
        onPreviewLoad() {
            this.previewError = false;
            this.previewErrorMessage = '';
        },
        
        // 预览加载失败回调
        onPreviewError() {
            this.previewError = true;
            this.previewErrorMessage = '文件预览加载失败，请尝试下载查看';
        },
        
        // 关闭标准文件查看对话框
        closeStandardFileDialog() {
            this.showStandardFileDialog = false;
            
            // 清理资源
            if (this.filePreviewUrl) {
                URL.revokeObjectURL(this.filePreviewUrl);
            }
            
            // 重置状态
            this.$nextTick(() => {
                this.currentStandardFile = null;
                this.currentFileConfigItem = null;
                this.resetPreviewState();
            });
        },
        
        // 添加新配置项
        /**
         * 文件验证相关方法
         */
        
        // 统一的文件验证函数
        validateFileForUpload(file, showSuccessMessage = false) {
            // 获取真正的文件对象
            const realFile = this.getRealFileObject(file) || file;
            
            // 验证文件格式
            const fileName = realFile.name || file.name || '';
            const fileExtension = fileName.toLowerCase().split('.').pop();
            const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                this.$message({
                    type: 'error',
                    message: '只允许上传 PDF、Word、Excel、PPT 格式的文件，请选择正确格式的文件后重试',
                    duration: 4000
                });
                return { isValid: false, error: 'format' };
            }
            
            // 验证文件大小
            const fileSize = realFile.size || file.size || 0;
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (fileSize > maxSize) {
                this.$message({
                    type: 'error',
                    message: `文件大小不能超过10MB，当前文件大小为 ${this.formatFileSize(fileSize)}`,
                    duration: 4000
                });
                return { isValid: false, error: 'size' };
            }
            
            // 验证通过
            if (showSuccessMessage) {
                this.$message({
                    type: 'success',
                    message: `文件验证通过，文件大小: ${this.formatFileSize(fileSize)}`,
                    duration: 2000
                });
            }
            
            return { isValid: true, file: realFile, size: fileSize };
        },
        
        /**
         * 管理配置项相关方法
         */
        
        // 保存配置项（新增或编辑）
        saveConfigItem() {
            this.$refs.itemFormRef.validate((valid) => {
                if (!valid) {
                    this.$message.error('请完善表单信息');
                    return;
                }
                
                this.saving = true;
                
                // 模拟保存延迟
                setTimeout(() => {
                    if (this.editingItem) {
                        // 编辑模式
                        this.updateConfigItem();
                    } else {
                        // 新增模式
                        this.addNewConfigItem();
                    }
                    this.saving = false;
                }, 300);
            });
        },
        
        // 新增配置项
        addNewConfigItem() {
            // 获取并验证文件对象（如果有的话）
            let standardFiles = [];
            if (this.itemForm.standardFiles.length > 0) {
                // 验证所有文件
                for (let i = 0; i < this.itemForm.standardFiles.length; i++) {
                    const validation = this.validateFileForUpload(this.itemForm.standardFiles[i]);
                    if (!validation.isValid) {
                        return; // 验证失败，错误信息已在验证函数中显示
                    }
                    standardFiles.push(validation.file);
                }
            }
            
            const newItem = {
                id: Date.now(),
                name: this.itemForm.name.trim(),
                chineseName: this.itemForm.chineseName.trim(),
                tags: [...this.itemForm.tags],
                standardFiles: standardFiles,
                enabled: true  // 新增的配置项默认为启用状态
            };
            
            this.configItems.push(newItem);
            this.saveData();
            this.resetItemForm();
            this.$message.success('配置项添加成功');
        },
        
        // 更新配置项
        updateConfigItem() {
            const index = this.configItems.findIndex(item => item.id === this.editingItem.id);
            if (index !== -1) {
                // 处理标准文件
                let standardFiles = [...this.editingItem.standardFiles]; // 保留原有文件
                if (this.itemForm.standardFiles.length > 0) {
                    // 有新文件上传，验证所有文件格式和大小
                    let newFiles = [];
                    for (let i = 0; i < this.itemForm.standardFiles.length; i++) {
                        const validation = this.validateFileForUpload(this.itemForm.standardFiles[i]);
                        if (!validation.isValid) {
                            return; // 验证失败，错误信息已在验证函数中显示
                        }
                        newFiles.push(validation.file);
                    }
                    standardFiles = newFiles; // 替换为新上传的文件
                }
                
                // 保留原有的ID和enabled状态，更新其他信息
                const updatedItem = {
                    ...this.editingItem,
                    name: this.itemForm.name.trim(),
                    chineseName: this.itemForm.chineseName.trim(),
                    tags: [...this.itemForm.tags],
                    standardFiles: standardFiles,
                    enabled: this.editingItem.enabled  // 确保保留启用/禁用状态
                };
                
                this.$set(this.configItems, index, updatedItem);
                
                // 同时更新阶段配置中的相同配置项
                Object.keys(this.phaseConfigurations).forEach(phaseId => {
                    this.phaseConfigurations[phaseId] = this.phaseConfigurations[phaseId].map(phaseItem => {
                        if (phaseItem.id === this.editingItem.id) {
                            return {
                                ...phaseItem,
                                name: updatedItem.name,
                                chineseName: updatedItem.chineseName,
                                tags: updatedItem.tags
                            };
                        }
                        return phaseItem;
                    });
                });
                
                this.saveData();
                this.cancelEdit();
                this.$message.success('配置项更新成功');
            }
        },
        
        // 开始编辑配置项
        startEditItem(item) {
            this.editingItem = { ...item };
            
            // 如果有标准文件，需要构造Element UI期望的文件列表格式
            let standardFilesList = [];
            if (item.standardFiles && item.standardFiles.length > 0) {
                standardFilesList = item.standardFiles.map((file, index) => {
                    // 如果是真正的File对象，需要包装成Element UI的格式
                    if (file instanceof File) {
                        return {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            raw: file,
                            status: 'success',
                            uid: Date.now() + Math.random() + index
                        };
                    } else {
                        // 如果已经是Element UI格式的对象
                        return file;
                    }
                });
            }
            
            this.itemForm = {
                name: item.name,
                chineseName: item.chineseName || '',
                tags: [...item.tags],
                standardFiles: standardFilesList
            };
            
            // 聚焦到配置项名称输入框
            this.$nextTick(() => {
                const nameInput = this.$refs.itemFormRef?.$refs?.name?.$refs?.input;
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            });
        },
        
        // 取消编辑
        cancelEdit() {
            this.editingItem = null;
            this.resetItemForm();
        },
        
        // 重置表单
        resetItemForm() {
            this.itemForm = {
                name: '',
                chineseName: '',
                tags: [],
                standardFiles: []
            };
            
            // 重置表单验证
            this.$nextTick(() => {
                if (this.$refs.itemFormRef) {
                    this.$refs.itemFormRef.clearValidate();
                }
            });
        },
        
        // 获取标签类型（用于样式）
        getTagType(tag) {
            const tagMap = {
                '项目管理': '',
                '质量审计': 'success',
                '技术评审': 'warning',
                '工程设计': 'danger',
                '项目控制': '',
                '其他': 'info'
            };
            return tagMap[tag] || '';
        },
        
        // 获取标签图标
        getTagIcon(tag) {
            const iconMap = {
                '项目管理': '📋',
                '质量审计': '🔍',
                '技术评审': '⚙️',
                '工程设计': '🏗️',
                '项目控制': '📊',
                '其他': '📌'
            };
            return iconMap[tag] || '📌';
        },
        
        // 获取空状态消息
        getEmptyStateMessage() {
            if (this.manageSearchKeyword && this.manageStatusFilter !== 'all') {
                return '没有找到匹配条件的配置项';
            } else if (this.manageSearchKeyword) {
                return '没有找到匹配的配置项';
            } else if (this.manageStatusFilter === 'enabled') {
                return '暂无已启用的配置项';
            } else if (this.manageStatusFilter === 'disabled') {
                return '暂无已禁用的配置项';
            } else {
                return '暂无配置项';
            }
        },
        
        // 获取空状态提示
        getEmptyStateTip() {
            if (this.manageSearchKeyword && this.manageStatusFilter !== 'all') {
                return '尝试修改搜索关键词或状态筛选条件';
            } else if (this.manageSearchKeyword) {
                return '尝试修改搜索关键词';
            } else if (this.manageStatusFilter === 'enabled') {
                return '所有配置项都已被禁用，或者还没有添加配置项';
            } else if (this.manageStatusFilter === 'disabled') {
                return '所有配置项都是启用状态';
            } else {
                return '在右侧表单中添加新的配置项';
            }
        },
        
        // 关闭管理对话框
        closeManageDialog() {
            if (this.editingItem) {
                this.$confirm('有未保存的编辑内容，确定要关闭吗？', '确认关闭', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.cancelEdit();
                    this.resetManageFilters();
                    this.showManageItemsDialog = false;
                }).catch(() => {
                    // 用户取消关闭
                });
            } else {
                this.resetManageFilters();
                this.showManageItemsDialog = false;
            }
        },
        
        // 重置管理界面的过滤条件
        resetManageFilters() {
            this.manageSearchKeyword = '';
            this.manageStatusFilter = 'all';
        },
        
        // 标准文件变更处理
        handleStandardFileChange(file, fileList) {
            // 验证当前上传的文件
            const validation = this.validateFileForUpload(file, false);
            
            if (!validation.isValid) {
                // 验证失败，移除该文件
                const index = fileList.findIndex(f => f.uid === file.uid);
                if (index > -1) {
                    fileList.splice(index, 1);
                }
                this.itemForm.standardFiles = fileList;
                return;
            }
            
            // 验证通过，更新文件列表
            this.itemForm.standardFiles = fileList;
            
            // 显示成功提示
            this.$message({
                type: 'success',
                message: `文件"${file.name}"添加成功`,
                duration: 2000
            });
        },
        
        // 标准文件移除处理
        handleStandardFileRemove(file, fileList) {
            this.itemForm.standardFiles = fileList;
            this.$message({
                type: 'info',
                message: '已移除标准文件',
                duration: 1500
            });
        },
        
        // 禁用/启用配置项
        toggleConfigItemStatus(itemId) {
            const item = this.configItems.find(item => item.id === itemId);
            if (!item) return;
            
            const action = item.enabled ? '禁用' : '启用';
            const message = item.enabled 
                ? '确定要禁用这个配置项吗？禁用后将从所有阶段中移除，但不会永久删除。' 
                : '确定要启用这个配置项吗？启用后可重新拖拽到项目阶段中。';
                
            this.$confirm(message, `确认${action}`, {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: item.enabled ? 'warning' : 'info'
            }).then(() => {
                // 切换启用/禁用状态
                item.enabled = !item.enabled;
                
                // 如果是禁用操作，从所有阶段中移除相关配置项
                if (!item.enabled) {
                    Object.keys(this.phaseConfigurations).forEach(phaseId => {
                        this.phaseConfigurations[phaseId] = this.phaseConfigurations[phaseId].filter(
                            phaseItem => phaseItem.id !== itemId
                        );
                    });
                }
                
                this.saveData();
                this.$message.success(`配置项已${action}`);
            }).catch(() => {
                // 用户取消操作
            });
        },
        
        /**
         * 版本管理
         */
        
        // 创建新版本
        createVersion(versionNumber, isNewVersion = false) {
            const version = {
                id: Date.now(),
                version: versionNumber,
                createTime: new Date().toLocaleString(),
                configurations: JSON.parse(JSON.stringify(this.phaseConfigurations)),
                isApproved: this.isApproved
            };
            
            if (isNewVersion) {
                this.versionHistory.push(version);
                this.isApproved = false;
                // 清空当前配置，开始新版本
                this.phaseConfigurations = { phase1: [], phase2: [], phase3: [] };
            } else {
                this.versionHistory = [version];
            }
            
            this.currentVersionId = version.id;
            this.currentVersion = 'V' + versionNumber;
            this.saveData();
            
            return version;
        },
        
        // 提交配置
        submitConfiguration() {
            if (this.getTotalConfigItemsCount() === 0) {
                this.$message.warning('请先配置项目阶段');
                return;
            }
            
            // 验证所有配置项的计划时间是否已填写
            const validationResult = this.validateAllPlannedTimes();
            if (!validationResult.isValid) {
                this.$message({
                    type: 'error',
                    message: validationResult.message,
                    duration: 5000
                });
                return;
            }
            
            this.$confirm('提交后将进入审批状态，确定要提交吗？', '确认提交', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }).then(() => {
                // 改变状态为待审批
                this.currentStatus = 'pending';
                
                // 提交时才创建正式的版本记录
                const versionNumber = this.currentDraftVersion.replace('V', '');
                const version = {
                    id: Date.now(),
                    version: versionNumber,
                    createTime: new Date().toLocaleString(),
                    configurations: JSON.parse(JSON.stringify(this.phaseConfigurations)),
                    isApproved: false,
                    status: 'pending'
                };
                
                // 添加到版本历史
                this.versionHistory.push(version);
                this.currentVersionId = version.id;
                
                // 添加提交日志
                this.addApprovalLog('submit', 'xxx(123456)已提交配置，等待yyy(223456)审批');
                // 场景补充：创建人因业务变动发生变更
                this.addApprovalLog('creatorChange', '创建人因业务变动更换为xxx');
                
                this.saveData();
                this.$message.success('配置已提交，等待审批');
            }).catch(() => {
                // 用户取消提交
            });
        },
        
        // 验证所有配置项的计划时间
        validateAllPlannedTimes() {
            const missingPlannedTimeItems = [];
            
            // 遍历所有阶段
            Object.keys(this.phaseConfigurations).forEach(phaseId => {
                const phaseItems = this.phaseConfigurations[phaseId];
                const phaseName = this.getPhaseNameById(phaseId);
                
                // 检查该阶段的每个配置项
                phaseItems.forEach((item, index) => {
                    if (!item.plannedTime || item.plannedTime.trim() === '') {
                        missingPlannedTimeItems.push({
                            phaseName: phaseName,
                            itemName: item.name,
                            itemIndex: index + 1
                        });
                    }
                });
            });
            
            if (missingPlannedTimeItems.length > 0) {
                // 构建详细的错误消息
                let message = '以下配置项缺少计划时间，请先完善后再提交：\n\n';
                missingPlannedTimeItems.forEach(item => {
                    message += `• ${item.phaseName} - ${item.itemName}\n`;
                });
                message += '\n请点击对应配置项进行编辑，填写计划时间。';
                
                return {
                    isValid: false,
                    message: message,
                    missingItems: missingPlannedTimeItems
                };
            }
            
            return {
                isValid: true,
                message: '所有配置项的计划时间已填写完整'
            };
        },
        
        // 创建新版本
        createNewVersion() {
            // 找到所有已审批版本中的最大版本号
            const approvedVersions = this.versionHistory.filter(v => v.isApproved);
            const maxVersionNumber = approvedVersions.length > 0 
                ? Math.max(...approvedVersions.map(v => parseInt(v.version)))
                : 0;
            const nextVersionNumber = (maxVersionNumber + 1).toString();
            
            // 只设置草稿版本号，不立即创建版本记录
            this.currentDraftVersion = 'V' + nextVersionNumber;
            this.currentVersion = 'V' + nextVersionNumber;
            
            // 清空当前配置，开始新版本
            this.phaseConfigurations = { phase1: [], phase2: [], phase3: [] };
            
            // 重置状态为配置中
            this.currentStatus = 'configuring';
            this.isApproved = false;
            this.currentVersionId = null;
            
            this.saveData();
            this.$message.success(`已创建版本 V${nextVersionNumber}，可以开始新的配置`);
        },
        
        // 版本命令处理
        handleVersionCommand(versionId) {
            const version = this.versionHistory.find(v => v.id === versionId);
            if (version && version.id !== this.currentVersionId) {
                this.currentVersionId = version.id;
                this.currentVersion = 'V' + version.version;
                this.currentDraftVersion = 'V' + version.version;
                this.phaseConfigurations = JSON.parse(JSON.stringify(version.configurations));
                this.isApproved = version.isApproved || false;
                
                // 根据版本状态设置当前状态
                if (version.isApproved) {
                    this.currentStatus = 'approved';
                } else if (version.status === 'pending') {
                    this.currentStatus = 'pending';
                } else {
                    this.currentStatus = 'configuring';
                }
                
                this.saveData();
                
                // 根据版本状态给出不同的提示消息
                if (version.status === 'pending') {
                    this.$message.success(`已切换到版本 V${version.version}（审核中）`);
                } else if (version.isApproved) {
                    this.$message.success(`已切换到版本 V${version.version}（已通过）`);
                } else {
                    this.$message.success(`已切换到版本 V${version.version}`);
                }
            }
        },
        
        // 重置配置
        resetConfiguration() {
            this.$confirm('确定要重置配置吗？这将清除所有阶段的配置项。', '确认重置', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.phaseConfigurations = { phase1: [], phase2: [], phase3: [] };
                this.isApproved = false;
                this.currentStatus = 'configuring';
                this.saveData();
                this.$message.success('配置已重置');
            }).catch(() => {
                // 用户取消重置
            });
        },
        
        // 清除所有数据，重新开始
        clearAllDataAndRestart() {
            this.$confirm('此操作将永久删除所有数据，包括版本历史、审批日志等，确定要重新开始吗？', '重新开始', {
                confirmButtonText: '确认清除',
                cancelButtonText: '取消',
                type: 'error',
                confirmButtonClass: 'el-button--danger'
            }).then(() => {
                // 清除localStorage中的所有数据
                localStorage.removeItem('projectConfig');
                
                // 重置所有数据到初始状态
                this.phaseConfigurations = { phase1: [], phase2: [], phase3: [] };
                this.isApproved = false;
                this.currentStatus = 'configuring';
                this.currentVersion = 'V1';
                this.currentVersionId = null;
                this.currentDraftVersion = 'V1';
                this.versionHistory = [];
                this.approvalLogs = [];
                
                // 重新初始化默认版本
                this.initializeDefaultVersion();
                
                // 保存初始状态
                this.saveData();
                
                this.$message({
                    message: '所有数据已清除，已重新开始',
                    type: 'success',
                    duration: 3000
                });
            }).catch(() => {
                // 用户取消操作
            });
        },
        
        /**
         * 工具方法
         */
        
        // 同步更新版本历史记录中的配置（确保版本切换时状态保持一致）
        updateVersionConfiguration() {
            // 只有在存在正式版本ID且版本已提交时才更新版本历史
            if (this.currentVersionId && this.versionHistory.length > 0 && this.currentStatus !== 'configuring') {
                const currentVersion = this.versionHistory.find(v => v.id === this.currentVersionId);
                if (currentVersion) {
                    // 深拷贝当前配置到版本历史中
                    currentVersion.configurations = JSON.parse(JSON.stringify(this.phaseConfigurations));
                }
            }
        },
        
        // 获取总配置项数量
        getTotalConfigItemsCount() {
            return Object.values(this.phaseConfigurations).reduce((total, items) => total + items.length, 0);
        },
        
        // 格式化日期
        formatDate(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString();
        },
        
        /**
         * 审批流程相关方法
         */
        
        // 添加审批日志
        addApprovalLog(action, description, rejectReason = null) {
            const log = {
                id: Date.now(),
                version: this.currentVersion,
                action: action,  // 'submit', 'approve', 'reject', 'creatorChange'
                description: description,
                rejectReason: rejectReason,
                createTime: new Date().toLocaleString()
            };
            
            this.approvalLogs.push(log);
        },
        
        // 审批通过配置
        approveConfiguration() {
            this.$confirm('确定要审批通过这个配置吗？', '确认审批', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'success'
            }).then(() => {
                // 改变状态为已审批
                this.currentStatus = 'approved';
                this.isApproved = true;
                
                // 添加审批通过日志
                this.addApprovalLog('approve', '配置审批通过');
                
                // 更新当前版本为已审批状态，确保版本被正式记录
                const currentVersion = this.versionHistory.find(v => v.id === this.currentVersionId);
                if (currentVersion) {
                    currentVersion.isApproved = true;
                    currentVersion.status = 'approved';
                    currentVersion.configurations = JSON.parse(JSON.stringify(this.phaseConfigurations));
                }
                
                this.saveData();
                this.$message.success('配置审批通过');
            }).catch(() => {
                // 用户取消审批
            });
        },
        
        // 确认驳回配置
        confirmRejectConfiguration() {
            this.$refs.rejectFormRef.validate((valid) => {
                if (valid) {
                    this.rejecting = true;
                    
                    // 模拟异步操作
                    setTimeout(() => {
                        // 记录被驳回的版本号，用于重新配置
                        const rejectedVersion = this.currentVersion;
                        
                        // 改变状态为配置中（返回编辑状态）
                        this.currentStatus = 'configuring';
                        this.isApproved = false;
                        
                        // 添加驳回日志
                        this.addApprovalLog('reject', '配置被驳回', this.rejectForm.reason);
                        
                        // 从版本历史中移除被驳回的版本
                        const currentVersionIndex = this.versionHistory.findIndex(v => v.id === this.currentVersionId);
                        if (currentVersionIndex !== -1 && !this.versionHistory[currentVersionIndex].isApproved) {
                            this.versionHistory.splice(currentVersionIndex, 1);
                        }
                        
                        // 驳回后继续配置同一个版本号，不切换到其他版本
                        // 保持当前版本号不变，让用户继续修改配置
                        this.currentVersionId = null; // 清空版本ID，表示这是新的配置
                        this.currentVersion = rejectedVersion; // 保持显示的版本号
                        this.currentDraftVersion = rejectedVersion; // 保持草稿版本号
                        // 保持当前的配置内容不变，让用户基于现有配置进行修改
                        
                        this.saveData();
                        
                        // 重置表单和关闭对话框
                        this.rejectForm.reason = '';
                        this.showRejectDialog = false;
                        this.rejecting = false;
                        
                        this.$message.success(`${rejectedVersion} 配置已驳回，请修改后重新提交`);
                    }, 1000);
                }
            });
        },
        
        /**
         * 审批日志相关方法
         */
        
        // 获取日志项的样式类
        getLogItemClass(log) {
            switch(log.action) {
                case 'submit':
                    return 'border-blue-200 bg-blue-50';
                case 'approve':
                    return 'border-green-200 bg-green-50';
                case 'creatorChange':
                    return 'border-blue-200 bg-blue-50';
                case 'reject':
                    return 'border-red-200 bg-red-50';
                default:
                    return 'border-gray-200 bg-gray-50';
            }
        },
        
        // 获取日志图标
        getLogIcon(log) {
            switch(log.action) {
                case 'submit':
                    return 'fas fa-upload text-blue-500';
                case 'approve':
                    return 'fas fa-check-circle text-green-500';
                case 'creatorChange':
                    return 'fas fa-user-edit text-blue-500';
                case 'reject':
                    return 'fas fa-times-circle text-red-500';
                default:
                    return 'fas fa-info-circle text-gray-500';
            }
        },
        
        // 获取日志标题
        getLogTitle(log) {
            switch(log.action) {
                case 'submit':
                    return '配置提交';
                case 'approve':
                    return '审批通过';
                case 'creatorChange':
                    return '创建人变更';
                case 'reject':
                    return '审批驳回';
                default:
                    return '未知操作';
            }
        },
        
        // 获取日志标签类型
        getLogTagType(log) {
            switch(log.action) {
                case 'submit':
                    return '';
                case 'approve':
                    return 'success';
                case 'creatorChange':
                    return '';
                case 'reject':
                    return 'danger';
                default:
                    return 'info';
            }
        },
        
        // 获取日志状态文本
        getLogStatusText(log) {
            switch(log.action) {
                case 'submit':
                    return '已提交';
                case 'approve':
                    return '已通过';
                case 'creatorChange':
                    return '已变更';
                case 'reject':
                    return '已驳回';
                default:
                    return '未知';
            }
        },
        
        // 获取标准文件名称
        getStandardFileName(file, index) {
            const realFile = this.getRealFileObject(file);
            if (realFile && realFile.name) {
                return realFile.name;
            } else if (file && file.name) {
                return file.name;
            } else {
                return `文件 ${index + 1}`;
            }
        },
        
        // 获取标准文件数量统计文本
        getStandardFilesCountText(item) {
            if (!item.standardFiles || item.standardFiles.length === 0) {
                return '未上传标准文件';
            } else if (item.standardFiles.length === 1) {
                return '已上传1个标准文件';
            } else {
                return `已上传${item.standardFiles.length}个标准文件`;
            }
        }
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('应用发生错误:', event.error);
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', () => {
    if (app && app.saveData) {
        app.saveData();
    }
});