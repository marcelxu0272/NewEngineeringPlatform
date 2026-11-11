
export const THEMES = {
  teal: {primary:"#008b8b",primaryDark:"#00676b",primarySoft:"#e9f6f6",accent:"#20b9b4",secondary:"#629eea",warning:"#f39c39",warningSoft:"#fff6ea",danger:"#e94f68",dangerSoft:"#fff0f3",success:"#06997d",successSoft:"#eaf8f1",ink:"#183e57",muted:"#6e89a2",faint:"#9bb0c3",border:"#e2edf5",grid:"#e9f0f6",surface:"#ffffff",surfaceAlt:"#f6fafc",canvas:"#eef5f9"},
  blue: {primary:"#306da9",primaryDark:"#234f80",primarySoft:"#eaf2fc",accent:"#52a7cb",secondary:"#7789d3",warning:"#d79a39",warningSoft:"#fff6e8",danger:"#df5c70",dangerSoft:"#fff0f3",success:"#238b77",successSoft:"#eaf7f0",ink:"#253d58",muted:"#6e839c",faint:"#a0b1c5",border:"#e2eaf5",grid:"#eaf0f7",surface:"#ffffff",surfaceAlt:"#f6f9fd",canvas:"#eef3f9"},
  wood: {primary:"#897044",primaryDark:"#6b5634",primarySoft:"#f5f0e8",accent:"#b8956a",secondary:"#9a8460",warning:"#d79a39",warningSoft:"#fff6e8",danger:"#df5c70",dangerSoft:"#fff0f3",success:"#238b77",successSoft:"#eaf7f0",ink:"#3d3428",muted:"#8a7e6e",faint:"#b0a696",border:"#ebe4d8",grid:"#f0ebe3",surface:"#ffffff",surfaceAlt:"#faf8f4",canvas:"#f5f1ea"}
};
(function(){const t=THEMES.blue;Object.entries(t).forEach(([k,v])=>{document.documentElement.style.setProperty("--"+k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase()),v);});document.documentElement.dataset.theme="blue";})();
