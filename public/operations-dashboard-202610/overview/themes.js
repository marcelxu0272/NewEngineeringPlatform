
/* ===== 统一主题配置入口 =====
 * 新主题：复制 teal 的全部色值并改名即可。主题选择器自动读取此配置。
 * primary=品牌色，accent=图表辅助色，secondary=次级分类色，warning/danger=风险语义色。
 * 所有CSS变量、Highcharts系列、tooltip、弹窗均通过下列配置同步更新。
 */
export const THEMES = {
    teal: {primary:'#008b8b',primaryDark:'#00676b',primarySoft:'#e9f6f6',accent:'#20b9b4',secondary:'#629eea',warning:'#f39c39',warningSoft:'#fff6ea',danger:'#e94f68',dangerSoft:'#fff0f3',success:'#06997d',successSoft:'#eaf8f1',ink:'#183e57',muted:'#6e89a2',faint:'#9bb0c3',border:'#e2edf5',grid:'#e9f0f6',surface:'#ffffff',surfaceAlt:'#f6fafc',canvas:'#eef5f9',sidebar:'#174654',sidebarTop:'#237d85',sidebarText:'#cce6e8',shadow:'#c1d8e6',tooltip:'#163d50',tooltipText:'#ffffff',mask:'#173a52',track:'#e8f1f7',white:'#ffffff'},
    blue: {primary:'#306da9',primaryDark:'#234f80',primarySoft:'#eaf2fc',accent:'#52a7cb',secondary:'#7789d3',warning:'#d79a39',warningSoft:'#fff6e8',danger:'#df5c70',dangerSoft:'#fff0f3',success:'#238b77',successSoft:'#eaf7f0',ink:'#253d58',muted:'#6e839c',faint:'#a0b1c5',border:'#e2eaf5',grid:'#eaf0f7',surface:'#ffffff',surfaceAlt:'#f6f9fd',canvas:'#edf2f9',sidebar:'#203a5c',sidebarTop:'#386b9a',sidebarText:'#d1e1f3',shadow:'#c2d2e5',tooltip:'#233e60',tooltipText:'#ffffff',mask:'#213a5a',track:'#e7eef8',white:'#ffffff'},
    wood: {primary:'#897044',primaryDark:'#695334',primarySoft:'#f5f0e6',accent:'#b39769',secondary:'#729594',warning:'#cf8e43',warningSoft:'#fff5e7',danger:'#c7605b',dangerSoft:'#fcf0ee',success:'#508566',successSoft:'#eff6ed',ink:'#4d473b',muted:'#918879',faint:'#b1a895',border:'#e9e2d6',grid:'#eee8df',surface:'#fffefb',surfaceAlt:'#faf7f1',canvas:'#f2eee6',sidebar:'#454538',sidebarTop:'#807552',sidebarText:'#e4ddca',shadow:'#d9cdb6',tooltip:'#504836',tooltipText:'#fffefb',mask:'#514838',track:'#eee8dd',white:'#fffefb'}
  };
Object.entries(THEMES.blue).forEach(([key,value])=>{
 const token=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
 document.documentElement.style.setProperty('--'+token,value);
 document.documentElement.style.setProperty('--'+token+'-rgb',value.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)).join(','));
});
