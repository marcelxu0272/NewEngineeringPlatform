/**
 * 岗位需求需求模拟数据生成器
 * 该模块负责生成系统所需的模拟数据，便于开发和测试
 * 
 * @author System
 * @date 2025-10
 */

// 创建全局命名空间，避免污染全局作用域
window.MockDataGenerator = {
    
    /**
     * 生成岗位需求需求模拟数据
     * @returns {Array} 包含一个项目的关键岗位需求数据，展示所有状态
     */
    generateKeyPositionMockData() {
        const today = new Date();
        const formatDate = (date) => {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };
        
        return [
            // 示例项目：包含各种状态的需求单
            {
                id: 101,
                section: '沈阳中心',
                month: '2025年10月',
                reporter: '张项目经理',
                createdTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
                status: 'open',
                eventType: '岗位需求需求',
                payload: {
                    projectNumber: 'D25999',
                    projectName: '某EPC项目',
                    projectManager: '张项目经理',
                    department: '沈阳中心',
                    businessType: 'EPC',
                    applicant: '张项目经理',
                    applicationTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
                    lastEditor: '张项目经理',
                    lastEditTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
                    requirementType: 'epc',
                    board: '沈阳中心',
                    projectDesc: '大型绿色氢能项目，总投资50亿元，包含风光发电、电解制氢、氢能储运等完整产业链',
                    majors: ['工艺', '电气', '施工', '安全', '管道设计'],
                    jobSummary: '急需各类工程师',
                    solution: '通过多渠道招聘，满足项目人力需求',
                    positions: [
                        // 1. 待审批状态：刚提交的需求
                        {
                            requirementId: 'D25999-SAS999-0001',
                            discipline: [['设计', '工艺']],
                            requirementType: 'epc',
                            jobTitle: '高级工艺工程师',
                            coreResponsibilities: '1. 负责氢能工艺方案设计和优化\n2. 完成工艺流程图、P&ID图设计\n3. 进行工艺计算和设备选型\n4. 配合其他专业完成设计协调',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-11-15',
                            positionCycle: '18个月',
                            quantity: 2,
                            gender: 'any',
                            ageRequirement: { minAge: 28, maxAge: 45 },
                            titleRequirement: 'senior',
                            professionalCertificates: ['注册化工'],
                            customCertifications: '',
                            experienceRequirement: '5年以上化工工艺设计经验，有氢能或新能源项目经验者优先',
                            educationRequirement: '本科及以上学历，化学工程与工艺、应用化学等相关专业',
                            languageRequirement: '英语CET-6，具备良好的英语读写能力',
                            otherRequirements: '具备良好的沟通协调能力和团队合作精神',
                            status: '待审批',
                            submitter: '张明华',
                            submitTime: '2025-10-23 09:00',
                            approvalFlow: {
                                currentStep: 1,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'pending',
                                        approver: '张明华',
                                        approvalTime: null,
                                        comment: null
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'pending',
                                        approver: '李工程师',
                                        approvalTime: null,
                                        comment: null
                                    }
                                ]
                            },
                            closeReason: '',
                            closeOperator: '',
                            closeTime: ''
                        },
                        
                        // 2. 进行中状态：第一步审批通过，第二步待审批
                        {
                            requirementId: 'D25999-SAS999-0002',
                            discipline: [['设计', '电气']],
                            requirementType: 'epc',
                            jobTitle: '电气设计工程师',
                            coreResponsibilities: '1. 负责氢能项目电气系统设计\n2. 完成电气一次、二次系统图\n3. 进行电气负荷计算和设备选型\n4. 配合工艺专业完成电气接口设计',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-11-20',
                            positionCycle: '18个月',
                            quantity: 2,
                            gender: 'any',
                            ageRequirement: { minAge: 26, maxAge: 42 },
                            titleRequirement: 'intermediate',
                            professionalCertificates: ['注册电气工程师'],
                            customCertifications: '',
                            experienceRequirement: '4年以上化工项目电气设计经验，熟悉氢能电气系统特点',
                            educationRequirement: '本科及以上学历，电气工程及其自动化等相关专业',
                            languageRequirement: '英语CET-6，具备良好的英语读写能力',
                            otherRequirements: '具备良好的技术分析能力和创新思维',
                            status: '进行中',
                            submitter: '张明华',
                            submitTime: '2025-10-20 10:00',
                            approvalFlow: {
                                currentStep: 2,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'approved',
                                        approver: '张明华',
                                        approvalTime: '2025-10-20 14:30',
                                        comment: '同意该需求，电气系统设计很重要'
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'pending',
                                        approver: '张明华',
                                        approvalTime: null,
                                        comment: null
                                    }
                                ]
                            },
                            closeReason: '',
                            closeOperator: '',
                            closeTime: ''
                        },
                        
                        // 3. 匹配中状态：所有审批通过，但还没有候选人
                        {
                            requirementId: 'D25999-SAS999-0003',
                            discipline: [['安全', '管理']],
                            requirementType: 'epc',
                            jobTitle: '安全工程师',
                            coreResponsibilities: '1. 负责项目安全管理制度建立\n2. 进行安全风险评估和控制\n3. 监督施工现场安全措施执行\n4. 组织安全培训和应急演练',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-11-25',
                            positionCycle: '18个月',
                            quantity: 1,
                            gender: 'any',
                            ageRequirement: { minAge: 28, maxAge: 45 },
                            titleRequirement: 'senior',
                            professionalCertificates: ['注册安全工程师'],
                            customCertifications: '',
                            experienceRequirement: '5年以上化工项目安全管理经验，有注册安全工程师证书',
                            educationRequirement: '本科及以上学历，安全工程、化学工程等相关专业',
                            languageRequirement: '英语CET-4，具备基本的英语读写能力',
                            otherRequirements: '具备良好的风险识别能力和应急处理能力',
                            status: '匹配中',
                            submitter: '张明华',
                            submitTime: '2025-10-18 09:30',
                            approvalFlow: {
                                currentStep: 2,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'approved',
                                        approver: '张明华',
                                        approvalTime: '2025-10-18 11:00',
                                        comment: '同意该需求，安全工作很重要'
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'approved',
                                        approver: '李工程师',
                                        approvalTime: '2025-10-18 15:30',
                                        comment: '审批通过，尽快招聘'
                                    }
                                ]
                            },
                            closeReason: '',
                            closeOperator: '',
                            closeTime: ''
                        },
                        
                        // 4. 匹配完成状态：所有审批通过，有候选人
                        {
                            requirementId: 'D25999-SAS999-0004',
                            discipline: [['施工', '管理']],
                            requirementType: 'epc',
                            jobTitle: '施工管理工程师',
                            coreResponsibilities: '1. 负责氢能项目施工现场管理\n2. 监督施工质量和安全\n3. 协调各专业施工进度\n4. 处理施工过程中的技术问题',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-12-01',
                            positionCycle: '20个月',
                            quantity: 2,
                            gender: 'male',
                            ageRequirement: { minAge: 30, maxAge: 50 },
                            titleRequirement: 'senior',
                            professionalCertificates: ['注册建造师'],
                            customCertifications: '',
                            experienceRequirement: '5年以上化工项目施工管理经验，有氢能或新能源项目经验者优先',
                            educationRequirement: '本科及以上学历，建筑工程、化学工程等相关专业',
                            languageRequirement: '英语CET-4，具备基本的英语沟通能力',
                            otherRequirements: '具备良好的组织协调能力和现场管理经验',
                            status: '匹配完成',
                            submitter: '张明华',
                            submitTime: '2025-10-15 09:00',
                            matchCompleteTime: '2025-10-16 16:30',
                            approvalFlow: {
                                currentStep: 2,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'approved',
                                        approver: '张明华',
                                        approvalTime: '2025-10-15 10:30',
                                        comment: '同意该需求，施工管理经验丰富'
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'approved',
                                        approver: '章乃元',
                                        approvalTime: '2025-10-15 14:00',
                                        comment: '审批通过，具备相关资质'
                                    }
                                ]
                            },
                            closeReason: '',
                            closeOperator: '',
                            closeTime: '',
                            // 企业推送人员信息
                            matchedCandidates: [
                                {
                                    companyName: '中建三局集团有限公司',
                                    companyContact: '王经理',
                                    companyPhone: '138 0013 8001',
                                    candidateName: '李建国',
                                    availableDate: '2025-11-15',
                                    rate: '¥280/小时',
                                    attachments: [
                                        {
                                            name: '李建国-个人简历.pdf',
                                            url: 'https://example.com/resume/lijianguo.pdf',
                                            type: 'pdf'
                                        },
                                        {
                                            name: '注册建造师证书.pdf',
                                            url: 'https://example.com/cert/constructor.pdf',
                                            type: 'pdf'
                                        }
                                    ]
                                },
                                {
                                    companyName: '中国化学工程集团有限公司',
                                    companyContact: '张主管',
                                    companyPhone: '139 0013 9002',
                                    candidateName: '赵强',
                                    availableDate: '2025-11-20',
                                    rate: '¥260/小时',
                                    attachments: [
                                        {
                                            name: '赵强-工作经历.docx',
                                            url: 'https://example.com/resume/zhaoqiang.docx',
                                            type: 'doc'
                                        },
                                        {
                                            name: '项目案例.pdf',
                                            url: 'https://example.com/projects/cases.pdf',
                                            type: 'pdf'
                                        }
                                    ]
                                },
                                {
                                    companyName: '上海建工集团股份有限公司',
                                    companyContact: '陈总监',
                                    companyPhone: '137 0013 7003',
                                    candidateName: '孙伟',
                                    availableDate: '2025-12-01',
                                    rate: '¥270/小时',
                                    attachments: [
                                        {
                                            name: '孙伟-简历.pdf',
                                            url: 'https://example.com/resume/sunwei.pdf',
                                            type: 'pdf'
                                        }
                                    ]
                                }
                            ]
                        },
                        
                        // 5. 另一个匹配完成的需求
                        {
                            requirementId: 'D25999-SAS999-0005',
                            discipline: [['设计', '管道设计']],
                            requirementType: 'epc',
                            jobTitle: '管道设计工程师',
                            coreResponsibilities: '1. 负责管道系统设计和布置\n2. 完成管道应力分析计算\n3. 进行管道材料选择和规格确定\n4. 绘制管道平面图和立面图',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-11-10',
                            positionCycle: '15个月',
                            quantity: 3,
                            gender: 'any',
                            ageRequirement: { minAge: 25, maxAge: 40 },
                            titleRequirement: 'intermediate',
                            professionalCertificates: [],
                            customCertifications: '',
                            experienceRequirement: '3年以上化工管道设计经验，熟悉AutoCAD、PDMS等设计软件',
                            educationRequirement: '本科及以上学历，机械工程、化学工程等相关专业',
                            languageRequirement: '英语CET-4，具备基本的英语读写能力',
                            otherRequirements: '熟悉化工管道设计规范和标准',
                            status: '匹配完成',
                            submitter: '张明华',
                            submitTime: '2025-10-12 10:00',
                            matchCompleteTime: '2025-10-14 11:20',
                            approvalFlow: {
                                currentStep: 2,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'approved',
                                        approver: '张明华',
                                        approvalTime: '2025-10-12 14:00',
                                        comment: '同意该需求'
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'approved',
                                        approver: '李工程师',
                                        approvalTime: '2025-10-13 09:00',
                                        comment: '审批通过'
                                    }
                                ]
                            },
                            closeReason: '',
                            closeOperator: '',
                            closeTime: '',
                            // 企业推送人员信息
                            matchedCandidates: [
                                {
                                    companyName: '中石化工程建设有限公司',
                                    companyContact: '马工',
                                    companyPhone: '134 0013 4001',
                                    candidateName: '王磊',
                                    availableDate: '2025-11-05',
                                    rate: '¥240/小时',
                                    attachments: [
                                        {
                                            name: '王磊-简历.pdf',
                                            url: 'https://example.com/resume/wanglei.pdf',
                                            type: 'pdf'
                                        },
                                        {
                                            name: '管道设计作品集.pdf',
                                            url: 'https://example.com/portfolio/piping-design.pdf',
                                            type: 'pdf'
                                        }
                                    ]
                                },
                                {
                                    companyName: '中国寰球工程有限公司',
                                    companyContact: '钱主管',
                                    companyPhone: '133 0013 3002',
                                    candidateName: '冯涛',
                                    availableDate: '2025-11-08',
                                    rate: '¥235/小时',
                                    attachments: [
                                        {
                                            name: '冯涛简历.docx',
                                            url: 'https://example.com/resume/fengtao.docx',
                                            type: 'doc'
                                        }
                                    ]
                                }
                            ]
                        },
                        
                        // 6. 已关闭状态：审批被驳回
                        {
                            requirementId: 'D25999-SAS999-0006',
                            discipline: [['质量', '管理']],
                            requirementType: 'epc',
                            jobTitle: '质量工程师',
                            coreResponsibilities: '1. 负责项目质量管理制度建立\n2. 监督施工质量检验和验收\n3. 处理质量问题和不符合项\n4. 组织质量培训和审核',
                            workLocation: '沈阳市',
                            requiredOnboardDate: '2025-11-30',
                            positionCycle: '18个月',
                            quantity: 1,
                            gender: 'any',
                            ageRequirement: { minAge: 28, maxAge: 45 },
                            titleRequirement: 'senior',
                            professionalCertificates: ['注册质量工程师'],
                            customCertifications: '',
                            experienceRequirement: '5年以上化工项目质量管理经验',
                            educationRequirement: '本科及以上学历，化学工程、质量管理等相关专业',
                            languageRequirement: '英语CET-4，具备基本的英语读写能力',
                            otherRequirements: '具备良好的质量意识和沟通协调能力',
                            status: '已关闭',
                            submitter: '张明华',
                            submitTime: '2025-10-10 09:00',
                            approvalFlow: {
                                currentStep: 1,
                                totalSteps: 2,
                                steps: [
                                    {
                                        step: 1,
                                        name: '板块总监审批',
                                        status: 'rejected',
                                        approver: '张明华',
                                        approvalTime: '2025-10-10 16:00',
                                        comment: '该岗位需求不够明确，请重新梳理后再提交'
                                    },
                                    {
                                        step: 2,
                                        name: '专业审批人审批',
                                        status: 'terminated',
                                        approver: '李工程师',
                                        approvalTime: null,
                                        comment: null
                                    }
                                ]
                            },
                            closeReason: '审批流程中存在驳回，需求自动关闭',
                            closeOperator: '系统',
                            closeTime: '2025-10-10 16:00'
                        }
                    ],
                    customCertifications: '',
                    experienceRequirement: '',
                    educationRequirement: '',
                    languageRequirement: '',
                    otherRequirements: ''
                }
            }
        ];
    },
    
    /**
     * 生成HR备忘录模拟数据
     * 该函数将关键岗位需求数据整合到HR备忘录中
     * @returns {Array} HR备忘录数据数组
     */
    generateHrMemoMockData() {
        // 岗位需求需求模拟数据
        return [
            ...this.generateKeyPositionMockData(),
        ];
    }
};
