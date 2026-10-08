export default function FileManager({ tasks = [] }) {
  const allAttachments = [];
  tasks.forEach((t) => {
    if (t.attachments && t.attachments.length > 0) {
      t.attachments.forEach((att) => {
        allAttachments.push({
          ...att,
          taskTitle: t.title,
          taskKey: t.key,
        });
      });
    }
  });

  return (
    <div className="flex-1 h-full p-8 overflow-y-auto bg-slate-950/60 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📁</span> Workspace Files & Documents Repository
          </h2>
          <p className="text-xs text-slate-400">All task attachments and documents organized in one place.</p>
        </div>

        {allAttachments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            No files or attachments uploaded yet in this workspace.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAttachments.map((f, i) => (
              <div key={i} className="solid-glass p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xl block mb-1">📄</span>
                  <h4 className="font-bold text-xs text-white truncate">{f.fileName}</h4>
                  <span className="text-[10px] text-amber-300 font-semibold block mt-0.5">Linked to: {f.taskKey}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">{new Date(f.uploadedAt || Date.now()).toLocaleDateString()}</span>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg hover:bg-amber-300"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}