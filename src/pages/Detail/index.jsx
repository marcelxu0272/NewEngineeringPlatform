<div className="operation-area">
  {/* 其他按钮 */}
  <Button onClick={handleExport}>
    导出
  </Button>
</div>

// 添加导出处理函数
const handleExport = async () => {
  try {
    const response = await exportData();
    // 触发文件下载
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '导出数据.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    message.error('导出失败');
  }
}; 