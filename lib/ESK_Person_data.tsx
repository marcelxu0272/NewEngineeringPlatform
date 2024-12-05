// 定义人员卡片接口
interface PersonCard {
    name: string;
    email: string;
    specialty: string;
    region: string;
    department: string;
    skills: { name: string; level: 1 | 2 | 3; hours?: number }[];
    score?: number;
    phone?: string; // 新增手机号字段
  }

export type { PersonCard };

export const peopleData: PersonCard[] = [
  {
    name: "殷秋军",
    email: "qiujun.yin@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马万林",
    email: "wanlin.ma@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张维",
    email: "wei.zhang2@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "蒋叶斌",
    email: "yebin.jiang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王海文",
    email: "haiwen.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "惠亚峰",
    email: "yafeng.hui@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王丽媛",
    email: "liyuan.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "康兴娟",
    email: "xingjuan.kang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "韩雨彤",
    email: "yutong.han@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王孟宇",
    email: "mengyu.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "高月红",
    email: "yuehong.gao@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "关雅楠",
    email: "yanan.guan@woodplc.com",
    specialty: "设计-设计-管道应力",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "胡明剑",
    email: "mingjian.hu@woodplc.com",
    specialty: "职能-数据-ES",
    region: "金山",
    department: "运营保障部",
    skills: [
      { name: "S3D-Design-Piping", level: 2 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "程浩",
    email: "hao.cheng@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "邢刚",
    email: "gang.xing@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "许双旗",
    email: "shuangqi.xu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 2 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王晓菁",
    email: "xiaojing.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张小顺",
    email: "xiaoshun.zhang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 2 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "朱文凯",
    email: "wenkai.zhu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马耀军",
    email: "yaojun.ma@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王莹",
    email: "ying.wang2@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨浩浩",
    email: "haohao.yang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨雪",
    email: "xue.yang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号���段，暂时为空字符串
  },
  {
    name: "胡定南",
    email: "dingnan.hu@woodplc.com",
    specialty: "职能-数据-ES",
    region: "金山",
    department: "运营保障部",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "田卫明",
    email: "weiming.tian@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "兰力泓",
    email: "lihong.lan@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "韩雨萌",
    email: "yumeng.han@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘志群",
    email: "zhiqun.liu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李邵凯",
    email: "shaokai.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "谢梦迪",
    email: "mengdi.xie@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "薛宁宁",
    email: "ningning.xue@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "郭志飞",
    email: "zhifei.guo2@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张燕",
    email: "yan.zhang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "戴伟哲",
    email: "weizhe.dai@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "唐金龙",
    email: "jinlong.tang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "朱泰彰",
    email: "taizhang.zhu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管��",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王靖涵",
    email: "jinghan.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "晋润泽",
    email: "runze.jin@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "田灵",
    email: "ling.tian@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘畅",
    email: "chang.liu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 },
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "孙良成",
    email: "liangcheng.sun@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "滕明辉",
    email: "minghui.teng@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "邝泽灏",
    email: "zehao.kuang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李洪暘",
    email: "hongyang.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张思齐",
    email: "siqi.zhang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "黄翠军",
    email: "cuijun.huang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张莹",
    email: "ying.zhang2@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "潘月",
    email: "yue.pan@woodplc.com",
    specialty: "设计-设计-结构",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Structural", level: 1 },
      { name: "E3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘金月",
    email: "jinyue.liu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 },
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "支伟强",
    email: "weiqiang.zhi@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "祁世玥",
    email: "shiyue.qi@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马远达",
    email: "yuanda.ma@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘欣悦",
    email: "xinyue.liu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王文慧",
    email: "wenhui.wang@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "徐辑敏",
    email: "jimin.xu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "胡振清",
    email: "zhenqing.hu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "宋亚男",
    email: "yanan.song@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "寇楚涵",
    email: "chuhan.kou@woodplc.com",
    specialty: "设计-服务-文控",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "曹睿",
    email: "rui.cao@woodplc.com",
    specialty: "职能-数据-ES",
    region: "徐汇",
    department: "运营保障部",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马思莹",
    email: "siying.ma@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李逸丽",
    email: "yili.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "艾鑫",
    email: "xin.ai@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "冯阳",
    email: "yang.feng@woodplc.com",
    specialty: "设计-设计-环保",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Equipment", level: 1 },
      { name: "E3D-Design-Equipment", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王乾",
    email: "qian.wang@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "林晓晨",
    email: "xiaochen.lin@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘鑫垚",
    email: "xinyao.liu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 },
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "何轶凡",
    email: "yifan.he@woodplc.com",
    specialty: "设计-设计-结构",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-Structural", level: 1 },
      { name: "S3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "赵刚",
    email: "gang.zhao@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王天鹏",
    email: "tianpeng.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李雪峰",
    email: "xuefeng.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 },
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "周颖",
    email: "ying.zhou2@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "Instrumentation-Design-All", level: 1 },
      { name: "E3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "戴作滔",
    email: "zuotao.dai@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "曾晓文",
    email: "xiaowen.zeng@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "牛纪铮",
    email: "jizheng.niu@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "AVEVA Instrumentation-Design-All", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张晶磊",
    email: "jinglei.zhang@woodplc.com",
    specialty: "设计-设计-电气",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "席帅",
    email: "shuai.xi@woodplc.com",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王海涛",
    email: "haitao.wang@woodplc.com",
    specialty: "设计-设计-电气",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "舒亮",
    email: "liang.shu@woodplc.com",
    specialty: "设计-设计-电信",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨文明",
    email: "wenming.yang@woodplc.com",
    specialty: "设计-设计-电信",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "章乃元",
    email: "naiyuan.zhang@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "宋维东",
    email: "weidong.song@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "田莉",
    email: "li.tian@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Equipment", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "严昊明",
    email: "haoming.yan@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "陶永锋",
    email: "yongfeng.tao@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨帆",
    email: "fan.yang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "韩宇石",
    email: "yushi.han@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王喆",
    email: "zhe.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王慧明",
    email: "huiming.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "吴漾",
    email: "yang.wu@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王堃",
    email: "kun.wang@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "田艾娟",
    email: "aijuan.tian@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨斌",
    email: "bin.yang2@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李龙飞",
    email: "longfei.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "辽阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 },
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "饶扬洁",
    email: "yangjie.rao@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "惠州",
    department: "惠湛中心",
    skills: [
      { name: "E3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "杨明���",
    email: "mingguang.yang@woodplc.com",
    specialty: "设计-设计-建筑",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "周文林",
    email: "wenlin.zhou@woodplc.com",
    specialty: "设计-设计-结构",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "E3D-Design-Structural", level: 1 },
      { name: "S3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘聆宇",
    email: "lingyu.liu@woodplc.com",
    specialty: "设计-设计-暖通",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "陈楠",
    email: "nan.chen@woodplc.com",
    specialty: "设计-设计-暖通",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "冯菁",
    email: "jing.feng@woodplc.com",
    specialty: "设计-设计-暖通",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-HVAC", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "韩双",
    email: "shuang.han@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "S3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "隋建娇",
    email: "jianjiao.sui@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "E3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "夏杰",
    email: "jie.xia2@woodplc.com",
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
    phone: "13000000000" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "郑淑慧",
    email: "shuhui.zheng@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "E3D-Design-E&I", level: 1 },
      { name: "SPI-Design-All", level: 1, hours: 100 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "梁艺凡",
    email: "yifan.liang@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 100 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "葛妍",
    email: "yan.ge@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "方丽",
    email: "li.fang@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "吕磊",
    email: "lei.lv@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1, hours: 90 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "鲁东东",
    email: "dongdong.lu@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "焦红婷",
    email: "hongting.jiao@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 80}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马栋",
    email: "dong.ma@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 , hours: 60}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "马天扬",
    email: "tianyang.ma@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "梁鹏程",
    email: "pengcheng.liang@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "蓝婷",
    email: "ting.lan@woodplc.com",
    specialty: "设计-设计-储运(工艺)",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "邵晨阳",
    email: "chenyang.shao@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "徐汇",
    department: "新材料板块",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "宋建生",
    email: "jiansheng.song@woodplc.com",
    specialty: "设计-设计-热工",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "邹培",
    email: "pei.zou@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "叶科",
    email: "ke.ye@woodplc.com",
    specialty: "设计-设计-工艺",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "陈韡玮",
    email: "weiwei.chen2@woodplc.com",
    specialty: "设计-设计-储运(工艺)",
    region: "金山",
    department: "工艺设备室",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "许亚兰",
    email: "yalan.xu@woodplc.com",
    specialty: "设计-��计-工艺",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPPID-Design-Draw", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "原睿涛",
    email: "ruitao.yuan@woodplc.com",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "汤丽丽",
    email: "lili.tang@woodplc.com",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张向群",
    email: "xiangqun.zhang@woodplc.com",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 , hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "郭超华",
    email: "chaohua.guo@woodplc.com",
    specialty: "设计-设计-电气",
    region: "金山",
    department: "仪电室",
    skills: [
      { name: "S3D-Design-E&I", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "王天锴",
    email: "tiankai.wang@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 , hours: 90}
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "徐立峰",
    email: "lifeng.xu@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "胡静",
    email: "jing.hu@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "金山",
    department: "配管室",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "焦体菊",
    email: "tiju.jiao@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "白杨",
    email: "yang.bai@woodplc.com",
    specialty: "设计-设计-给排水消防",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "李亮",
    email: "liang.li@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "鞠志远",
    email: "zhiyuan.ju@woodplc.com",
    specialty: "设计-设计-管道设计",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Piping", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "徐天宇",
    email: "tianyu.xu@woodplc.com",
    specialty: "设计-设计-结构",
    region: "徐汇",
    department: "COII板块",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "刘书慧",
    email: "shuhui.liu@woodplc.com",
    specialty: "设计-设计-结构",
    region: "沈阳",
    department: "沈阳中心",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "张伟",
    email: "wei.zhang@woodplc.com",
    specialty: "设计-设计-结构",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "S3D-Design-Structural", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "吴圆圆",
    email: "yuanyuan.wu@woodplc.com",
    specialty: "设计-设计-暖通",
    region: "金山",
    department: "土建室",
    skills: [
      { name: "S3D-Design-HVAC", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "丁刘涛",
    email: "liutao.ding@woodplc.com",
    specialty: "设计-设计-仪表",
    region: "银川",
    department: "银川中心",
    skills: [
      { name: "SPI-Design-All", level: 1 }
    ],
    phone: "" // 新增手机号字段，暂时为空字符串
  },
  {
    name: "吴平均",
    email: "apple.wu@woodplc.com",
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
    phone: "" // 新增手机号字段，暂时为空字符串
  }
];

