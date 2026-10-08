// টাস্কের লিস্টকে ১-ক্লিকে এক্সেল বা সিএসভি ফাইলে ডাউনলোড
export const exportBoardToCSV = (boardTitle, tasks = []) => {
  if (!tasks.length) return alert('ডাউনলোড করার মতো কোনো টাস্ক নেই!');

  const headers = ['Issue Key', 'Title', 'Status', 'Priority', 'Assignee', 'Story Points'];
  const rows = tasks.map((t) => [
    `"${t.key || 'KAN-1'}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.status || 'To Do'}"`,
    `"${t.priority || 'Medium'}"`,
    `"${t.assignee?.name || 'Unassigned'}"`,
    `"${t.storyPoints || 1}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${boardTitle.replace(/\s+/g, '_')}_Sprint_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};