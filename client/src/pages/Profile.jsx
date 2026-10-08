import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { getSocket } from '../socket/socketClient';

export default function Profile() {
  const { user, updateProfileData, loading, logout } = useAuthStore();
  const { language } = useLangStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    organization: '',
    designation: '',
    identificationId: '',
    bio: '',
    avatar: '',
  });

  const [teammates, setTeammates] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [archivedBoards, setArchivedBoards] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchArchived = async () => {
    try {
      const res = await API.get('/boards/archived');
      setArchivedBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        organization: user.organization || '',
        designation: user.designation || '',
        identificationId: user.identificationId || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }

    API.get('/auth/teammates')
      .then((res) => setTeammates(res.data))
      .catch((err) => console.error(err));

    fetchArchived();

    const socket = getSocket();
    if (socket) {
      socket.on('users:online', (activeIds) => {
        setOnlineUserIds(activeIds);
      });
    }

    return () => {
      if (socket) {
        socket.off('users:online');
      }
    };
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setFormData((prev) => ({ ...prev, avatar: compressedBase64 }));
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const success = await updateProfileData(formData);
      if (success) {
        setSuccessMsg(language === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
        useAuthStore.getState().fetchCurrentUser();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (boardId) => {
    try {
      await API.put(`/boards/${boardId}/restore`);
      fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (boardId) => {
    try {
      const res = await API.delete(`/boards/${boardId}/permanent`);
      alert(res.data.message);
      fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <nav className="h-16 px-8 border-b border-white/[0.08] bg-[#0c0f17] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold hover:text-white"
          >
            {isBn ? '← ড্যাশবোর্ডে ফিরুন' : '← Back to Dashboard'}
          </Link>
          <span className="text-sm font-bold text-white">
            {isBn ? 'প্রোফাইল সেটিংস ও আইডি ম্যানেজমেন্ট' : 'Profile Settings & ID Management'}
          </span>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
        >
          {isBn ? 'লগআউট' : 'Sign Out'}
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Form (8 Col) */}
          <div className="lg:col-span-8 bg-white/[0.03] rounded-2xl p-8 border border-white/10 shadow-xl">
            <div className="flex items-center gap-6 pb-6 mb-6 border-b border-white/10">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center text-2xl font-bold text-amber-300 shadow">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    formData.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  {isBn ? 'ছবি বদলান' : 'Change'}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{formData.name || 'Member Profile'}</h2>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {formData.designation || 'Engineer'} • {formData.organization || 'Workspace'}
                </span>
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'ফোন নম্বর' : 'Phone'}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'কোম্পানি / বিশ্ববিদ্যালয়' : 'Organization / University'}</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'পদবি / রোল' : 'Designation / Role'}</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'স্টুডেন্ট বা এমপ্লয়ী আইডি' : 'Student / Employee ID'}</label>
                  <input
                    type="text"
                    value={formData.identificationId}
                    onChange={(e) => setFormData({ ...formData, identificationId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                    placeholder="e.g. C2010XX / EMP-409"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBn ? 'রেজিস্টার্ড ইমেইল (পরিবর্তনযোগ্য নয়)' : 'Registered Email'}</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBn ? 'বায়ো / বিবরণ' : 'Bio'}</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {isSaving ? (isBn ? 'সেভ হচ্ছে...' : 'Saving...') : (isBn ? 'প্রোফাইল সেভ করুন' : 'Save Profile Changes')}
                </button>
              </div>
            </form>
          </div>

          {/* Teammates Live Presence (4 Col) */}
          <div className="lg:col-span-4 bg-white/[0.03] rounded-2xl p-6 border border-white/10 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <span>👥</span> {isBn ? 'টিম মেম্বার স্ট্যাটাস' : 'Teammate Status'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Real-time
                </span>
              </div>

              <div className="space-y-3">
                {teammates.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">{isBn ? 'এখনো কোনো মেম্বার যুক্ত হয়নি।' : 'No teammates connected yet.'}</p>
                ) : (
                  teammates.map((m) => {
                    const isOnline = onlineUserIds.includes(m._id);
                    return (
                      <div key={m._id} className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-300">
                              {m.avatar ? <img src={m.avatar} alt="Avatar" className="w-full h-full object-cover rounded-lg" /> : m.name?.charAt(0)}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            ></span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{m.name}</h4>
                            <span className="text-[10px] text-slate-400">{m.designation || 'Collaborator'}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isOnline ? 'Online 🟢' : 'Offline ⚪'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400 flex justify-between mt-4">
              <span>Active Sockets:</span>
              <span className="text-emerald-400 font-bold">{onlineUserIds.length} Connected</span>
            </div>
          </div>
        </div>

        {/* Trash History */}
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/10 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <span>🗑️</span> {isBn ? 'ডিলিট করা ওয়ার্কস্পেস হিস্টোরি' : 'Deleted Workspaces History'} ({archivedBoards.length})
          </h3>

          <div className="space-y-3">
            {archivedBoards.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{isBn ? 'ট্র্যাশে কোনো ডিলিট করা বোর্ড নেই।' : 'No deleted workspaces in trash.'}</p>
            ) : (
              archivedBoards.map((ab) => (
                <div key={ab._id} className="p-3 bg-slate-950 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-white">{ab.title}</h4>
                    <span className="text-[10px] text-slate-400">Deleted: {new Date(ab.deletedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(ab._id)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg font-bold"
                    >
                      {isBn ? 'রিস্টোর' : 'Restore'}
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(ab._id)}
                      className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs rounded-lg font-bold"
                    >
                      {isBn ? 'মুছে ফেলুন' : 'Wipe Forever'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl mx-auto border border-rose-500/30">
              🚪
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{isBn ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Sign Out'}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isBn ? 'আপনি কি আপনার বর্তমান সেশন শেষ করতে চান?' : 'Are you sure you want to end your current session?'}
              </p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                {isBn ? 'হ্যাঁ, লগআউট' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}