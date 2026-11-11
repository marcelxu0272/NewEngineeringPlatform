export const THEMES = {
    blue:{primary:'#306da9',primaryDark:'#234f80',primarySoft:'#eaf2fc',accent:'#52a7cb',ink:'#253d58',muted:'#6e839c',border:'#e2eaf5',grid:'#eaf0f7',surface:'#ffffff',surfaceAlt:'#f6f9fd',canvas:'#eef3f9',danger:'#c44860',success:'#238b77'},
    teal:{primary:'#008b8b',primaryDark:'#00676b',primarySoft:'#e9f6f6',accent:'#20b9b4',ink:'#183e57',muted:'#6e89a2',border:'#e2edf5',grid:'#e9f0f6',surface:'#ffffff',surfaceAlt:'#f6fafc',canvas:'#eef5f9',danger:'#c44860',success:'#06997d'},
    wood:{primary:'#897044',primaryDark:'#6b5634',primarySoft:'#f5f0e8',accent:'#b8956a',ink:'#3d3428',muted:'#8a7e6e',border:'#ebe4d8',grid:'#f0ebe3',surface:'#ffffff',surfaceAlt:'#faf8f4',canvas:'#f5f1ea',danger:'#c44860',success:'#238b77'}
  };

export const MONTHS = ['2026-12','2027-01','2027-02'];

export const HISTORY_MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'];

export const UNIT_CONFIGS = [
    {unit:'SAS170 PMC板块',names:['陈志远','刘思敏','高一鸣','林悦','周宁','赵清'],factor:.94},
    {unit:'SAS610 咨询板块',names:['洪赛邦','白艳芳','陈嘉宁','李文博','周舒雨','许明'],factor:1},
    {unit:'SAS680 数字技术板块',names:['王梓涵','赵一凡','宋知远','郑雨桐','韩星','罗旭'],factor:1.13},
    {unit:'SAS650 新材料板块',names:['孙宇','许晨曦','唐文静','蒋凯','杜松','邓哲'],factor:.83},
    {unit:'SAS710 生命科学板块',names:['吴晓晴','何思远','冯欣','梁辰','丁怡','方明'],factor:1.08},
    {unit:'SAS690 COII板块',names:['徐立','蔡雨薇','沈航','程思齐','彭悦','谭峰'],factor:.89},
    {unit:'SAS720 模块化板块',names:['陆安','秦若宁','叶知秋'],factor:1,zeroCapacity:true},
    {unit:'SAS670 供应链板块',names:['郭启明','毛欣然','汪海','段星宇','石晓','魏俊'],factor:.72},
    {unit:'SAS520 金山中心',names:['袁景','马文清','贺云'],factor:0},
    {unit:'SAS560 沈阳中心',names:['戴文','孔晴','白远','钟晓','潘宁','孟佳'],factor:.76},
    {unit:'SAS550 惠湛中心',names:[],factor:1,available:false},
    {unit:'SAS530 银川中心',names:['姚晨','夏凡','武安','康雨晴','钱宁','江涛'],factor:.86}
  ];

export const DEFAULT_UNIT = 'SAS610 咨询板块';
