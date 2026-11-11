// 定义人员卡片接口
interface PersonCard {
    name: string;
    specialty: string;
    region: string;
    department: string;
    skills: { name: string; level: 1 | 2 | 3; hours?: number }[];
    score?: number;
  }

export type { PersonCard };

export const peopleData: PersonCard[] = [
  {
    name: "人员-001",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-002",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-003",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-004",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-005",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-006",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-007",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-008",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-009",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-010",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-011",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-012",
    specialty: "设计-设计-管道应力",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-013",
    specialty: "职能-数据-ES",
    region: "金山",
    department: "运营保障部",
    skills: [
      { name: "S3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-014",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-015",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-016",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-017",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-018",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
  },
  {
    name: "人员-019",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-020",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-021",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-022",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-023",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-024",
    specialty: "职能-数据-ES",
    region: "金山",
    department: "运营保障部",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-025",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-026",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-027",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-028",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-029",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-030",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-031",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-032",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-033",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-034",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-035",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-036",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管��",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-037",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-038",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-039",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-040",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 },
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-041",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-042",
    specialty: "设计-设计-工艺",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-043",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-044",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-045",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-046",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-047",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-048",
    specialty: "设计-设计-结构",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Structural", level: 1 },
      { name: "E3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-049",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 },
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-050",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-051",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-052",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-053",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-054",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-055",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-056",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-057",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-058",
    specialty: "设计-服务-文控",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-059",
    specialty: "职能-数据-ES",
    region: "徐汇",
    department: "运营保障部",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-060",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-061",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-062",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-063",
    specialty: "设计-设计-环保",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Equipment", level: 1 },
      { name: "E3D-Design-Equipment", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-064",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-065",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-066",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-067",
    specialty: "设计-设计-结构",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-Structural", level: 1 },
      { name: "S3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-068",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-069",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-070",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-071",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "Instrumentation-Design-All", level: 1 },
      { name: "E3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-072",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-073",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-074",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-075",
    specialty: "设计-设计-电气",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-076",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-077",
    specialty: "设计-设计-电气",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-078",
    specialty: "设计-设计-电信",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-079",
    specialty: "设计-设计-电信",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-080",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-081",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-082",
    specialty: "设计-设计-工艺",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Equipment", level: 1 }
    ],
  },
  {
    name: "人员-083",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-084",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-085",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-086",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-087",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-088",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-089",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-090",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-091",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-092",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-093",
    specialty: "设计-设计-管道设计",
    region: "辽阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-094",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-095",
    specialty: "设计-设计-建筑",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-096",
    specialty: "设计-设计-结构",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Structural", level: 1 },
      { name: "S3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-097",
    specialty: "设计-设计-暖通",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
  },
  {
    name: "人员-098",
    specialty: "设计-设计-暖通",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
  },
  {
    name: "人员-099",
    specialty: "设计-设计-暖通",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
  },
  {
    name: "人员-100",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-101",
    specialty: "设计-设计-仪表",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-102",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 ,hours: 100},
      { name: "SPPID-Design-Draw", level: 1 },
      { name: "SPI-Design-All", level: 1 },
      { name: "Navisworks-Design-Review", level: 1 },
      { name: "Navisworks-Design-Simulate", level: 1 }
    ],
  },
  {
    name: "人员-103",
    specialty: "设计-设计-仪表",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1, hours: 100 }
    ],
  },
  {
    name: "人员-104",
    specialty: "设计-设计-工艺",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 100 }
    ],
  },
  {
    name: "人员-105",
    specialty: "设计-设计-工艺",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90}
    ],
  },
  {
    name: "人员-106",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90 }
    ],
  },
  {
    name: "人员-107",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90 }
    ],
  },
  {
    name: "人员-108",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 90}
    ],
  },
  {
    name: "人员-109",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 80}
    ],
  },
  {
    name: "人员-110",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 60}
    ],
  },
  {
    name: "人员-111",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-112",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-113",
    specialty: "设计-设计-储运(工艺)",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-114",
    specialty: "设计-设计-工艺",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-115",
    specialty: "设计-设计-热工",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-116",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-117",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-118",
    specialty: "设计-设计-储运(工艺)",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-119",
    specialty: "设计-��计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
  },
  {
    name: "人员-120",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
  },
  {
    name: "人员-121",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
  },
  {
    name: "人员-122",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
  },
  {
    name: "人员-123",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 }
    ],
  },
  {
    name: "人员-124",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 , hours: 90}
    ],
  },
  {
    name: "人员-125",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-126",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-127",
    specialty: "设计-设计-给排水消防",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-128",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-129",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-130",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
  },
  {
    name: "人员-131",
    specialty: "设计-设计-结构",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-132",
    specialty: "设计-设计-结构",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-133",
    specialty: "设计-设计-结构",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
  },
  {
    name: "人员-134",
    specialty: "设计-设计-暖通",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "S3D-Design-HVAC", level: 1 }
    ],
  },
  {
    name: "人员-135",
    specialty: "设计-设计-仪表",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPI-Design-All", level: 1 }
    ],
  },
  {
    name: "人员-136",
    specialty: "职能-职能-ES",
    region: "徐汇",
    department: "运营保障部",
    skills: [
      { name: "E3D-Admin-Project Create", level: 1 },
      { name: "AVEVA Instrumentation-Admin-Create Project", level: 1 },
      { name: "S3D-Admin-Project Create", level: 2 },
      { name: "SPPID-Admin-Create Project", level: 2 },
      { name: "SPI-Admin-Create Project", level: 3 , hours: 20},
      { name: "AFT Arrow-All", level: 1 },
      { name: "AFT Fathon-All", level: 1 },
      { name: "AFT Impulse-All", level: 3 },
      { name: "Aspen Plus", level: 3 },
      { name: "ETAP-All", level: 2 },
      { name: "ERM-Materials", level: 2 },
      { name: "ERM-Planning", level: 2 },
      { name: "ERM-Production", level: 2 },
    ],
  }
];

