// ... existing code ...
import React, {useEffect, useState } from 'react';
import { BookOpen, Calendar, ChevronRight, GraduationCap, LayoutDashboard, LogOut, Mail, MessageSquare, PlusCircle, Search, User, Users, CheckCircle, Clock, Send } from 'lucide-react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "./services/announcementService";
import { getStudents, createMyStudentRecord, createStudentRecord, getMyStudentRecord } from "./services/studentService";
import { getJournals, createJournal, markJournalHandled } from "./services/journalService";
import { getTeacherMailbox } from "./services/teacherMailboxService";
import { getCounselingSessions, getCounselingSessionsForStudent, createCounselingSession, updateCounselingSessionStatus, rescheduleCounselingSession } from "./services/counselingSessionService";
import { getConversation, sendMessage, getUnreadMessageCount } from "./services/messageService";

// ==========================================
// MOCK DATA
// ==========================================
// ... existing code ...

import { getSchools, createSchool } from "./services/schoolService";
import { signIn, signOut, signUp, createMyProfile, getSession, getMyProfile } from "./services/authService";
import { getPendingProfiles, approveProfile, rejectProfile } from "./services/profileService";
import LandingPage from "./LandingPage";

// ... existing code ...

// ==========================================
// MOCK DATA
// ==========================================
// ... existing code ...

// Real logged-in user, built from Supabase Auth session + the matching
// `profiles` row (see authService.getMyProfile()).
type User = {
  role: 'siswa' | 'guru';
  profileId: string; // profiles.id — used across services as sender_id/published_by/etc.
  schoolId: string;
  fullName: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function GCFlow() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "join">("login");
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          const profile = await getMyProfile();
          if (profile && (profile.role === 'siswa' || profile.role === 'guru')) {
            setCurrentUser({
              role: profile.role,
              profileId: profile.id,
              schoolId: profile.school_id,
              fullName: profile.full_name,
              status: profile.status,
            });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    }
    setCurrentUser(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-bold">
        Memuat sesi...
      </div>
    );
  }

  if (!currentUser) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    if (authMode === "signup") {
      return (
        <SignUpFlow
          onSignedUp={(user) => { setCurrentUser(user); setCurrentView('home'); }}
          onGoToLogin={() => setAuthMode("login")}
        />
      );
    }
    if (authMode === "join") {
      return (
        <JoinSchoolFlow
          onRegistered={(user) => { setCurrentUser(user); setCurrentView('home'); }}
          onGoToLogin={() => setAuthMode("login")}
        />
      );
    }
    return (
      <LoginFlow
        onLogin={(user) => { setCurrentUser(user); setCurrentView('home'); }}
        onGoToSignUp={() => setAuthMode("signup")}
        onGoToJoin={() => setAuthMode("join")}
      />
    );
  }

  if (currentUser.status === "pending") {
    return <PendingApprovalScreen user={currentUser} onLogout={handleLogout} onRefresh={async () => {
      const profile = await getMyProfile();
      if (profile) setCurrentUser((prev) => prev ? { ...prev, status: profile.status } : prev);
    }} />;
  }

  if (currentUser.status === "rejected") {
    return <RejectedScreen onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      <Sidebar user={currentUser} onLogout={handleLogout} currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={currentUser} onLogout={handleLogout} onNavigate={setCurrentView} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentUser.role === 'siswa' ? <StudentViews view={currentView} user={currentUser} /> : <TeacherViews view={currentView} user={currentUser} />}
        </main>
      </div>
    </div>
  );
}

function StudentViews({ view, user }: { view: string; user: User }) {
  switch(view) {
    case 'profil': return <StudentProfile />;
    case 'mading': return <SchoolBoardView />;
    case 'home':
    default: return <StudentDashboard user={user} />;
  }
}

function TeacherViews({ view, user }: { view: string; user: User }) {
  switch(view) {
    case 'mailbox': return <TeacherMailboxView user={user} />;
    case 'jadwal': return <TeacherScheduleView user={user} />;
    case 'kelola_mading': return <TeacherManageBoardView user={user} />;
    case 'persetujuan': return <TeacherApprovalsView />;
    case 'home':
    default: return <TeacherDashboard user={user} />;
  }
}

// ==========================================
// 1. LOGIN FLOW (Mengadaptasi Visual Inspo)
// ==========================================
type SchoolOption = { id: string; name: string };

function LoginFlow({ onLogin, onGoToSignUp, onGoToJoin }: { onLogin: (user: User) => void; onGoToSignUp: () => void; onGoToJoin: () => void }) {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await getSchools();
        setSchools(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      const profile = await getMyProfile();

      if (!profile) {
        setError("Akun ditemukan tapi belum terhubung ke profil sekolah manapun. Hubungi admin.");
        await signOut();
        return;
      }
      if (profile.school_id !== selectedSchool.id) {
        setError("Akun ini tidak terdaftar di sekolah yang dipilih.");
        await signOut();
        return;
      }
      if (profile.role !== "siswa" && profile.role !== "guru") {
        setError(`Role akun ini ("${profile.role}") belum didukung di aplikasi ini.`);
        await signOut();
        return;
      }

      onLogin({
        role: profile.role,
        profileId: profile.id,
        schoolId: profile.school_id,
        fullName: profile.full_name,
        status: profile.status,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Email atau password salah.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">

        {/* Header Visual */}
        <div className="bg-[#1B2A4A] p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <GraduationCap size={120} />
           </div>
           <h1 className="text-4xl font-black text-white tracking-tight relative z-10 mb-2">
             GC<span className="text-[#F4B942]">Flow</span>
           </h1>
           <p className="text-slate-300 text-sm relative z-10">Sistem Informasi & Jurnal Bimbingan Konseling</p>
        </div>

        <div className="p-8">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? 'w-8 bg-[#F4B942]' : 'w-2 bg-slate-200'}`}></div>
            <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? 'w-8 bg-[#F4B942]' : 'w-2 bg-slate-200'}`}></div>
          </div>

          {/* Step 1: Pilih Sekolah */}
          {step === 1 && (
            <div className="animate-slideUp">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Pilih Sekolah</h2>
              {loadingSchools ? (
                <p className="text-center text-sm text-slate-400">Memuat daftar sekolah...</p>
              ) : schools.length === 0 ? (
                <p className="text-center text-sm text-slate-400">Belum ada sekolah terdaftar di sistem.</p>
              ) : (
                <div className="space-y-3">
                  {schools.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSchool(s); setStep(2); }}
                      className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl hover:border-[#F4B942] hover:bg-yellow-50/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <GraduationCap size={18} />
                        </div>
                        <span className="font-bold text-slate-800">{s.name}</span>
                      </div>
                      <ChevronRight size={18} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
              <button onClick={onGoToJoin} className="mt-6 w-full text-center text-sm font-bold text-[#1B2A4A] hover:underline">
                Belum punya akun? Daftar sebagai siswa/guru
              </button>
              <button onClick={onGoToSignUp} className="mt-2 w-full text-center text-xs font-bold text-slate-400 hover:underline">
                Sekolah belum terdaftar? Daftar sekolah baru
              </button>
            </div>
          )}

          {/* Step 2: Email + Password */}
          {step === 2 && selectedSchool && (
            <div className="animate-slideUp">
              <div className="text-center mb-6">
                 <p className="text-xs font-bold text-[#F4B942] uppercase tracking-wider mb-1">{selectedSchool.name}</p>
                 <h2 className="text-xl font-bold text-slate-800">Masuk ke Akun Anda</h2>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                    placeholder="nama@sekolah.id"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#F4B942] text-[#1B2A4A] py-3.5 rounded-xl font-black text-lg hover:bg-yellow-500 transition-all shadow-md mt-2 disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Masuk Sekarang"}
                </button>
              </form>
              <button onClick={() => { setStep(1); setError(null); }} className="mt-6 w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600">
                Ganti Sekolah
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1b. SIGN UP FLOW (Daftar Sekolah Baru + Akun Admin Pertama)
// ==========================================
function SignUpFlow({
  onSignedUp,
  onGoToLogin,
}: {
  onSignedUp: (user: User) => void;
  onGoToLogin: () => void;
}) {
  const [schoolName, setSchoolName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      const { session } = await signUp(email, password);

      if (!session) {
        // Project has "Confirm email" turned on — there's no active
        // session yet, so we can't create the school/profile rows
        // (RLS needs auth.uid()). They'll need to confirm via email,
        // log in, and someone will need to finish setting up their
        // school/profile at that point.
        setInfo(
          "Akun berhasil dibuat! Cek email kamu untuk konfirmasi dulu, lalu login. " +
            "(Catatan buat developer: karena \"Confirm email\" aktif di project Supabase, sekolah & profil belum otomatis dibuat — sambungkan itu setelah login pertama, atau matikan \"Confirm email\" di Authentication > Providers untuk demo.)"
        );
        return;
      }

      const school = await createSchool(schoolName.trim());
      const profile = await createMyProfile({
        full_name: fullName.trim(),
        school_id: school.id,
        role: "guru",
        status: "approved", // bootstrapping a brand-new school — no one else to approve them
      });

      onSignedUp({
        role: "guru",
        profileId: profile.id,
        schoolId: school.id,
        fullName: profile.full_name,
        status: "approved",
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
        <div className="bg-[#1B2A4A] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap size={120} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight relative z-10 mb-2">
            GC<span className="text-[#F4B942]">Flow</span>
          </h1>
          <p className="text-slate-300 text-sm relative z-10">Daftarkan sekolahmu & buat akun admin pertama</p>
        </div>

        <div className="p-8">
          {info ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">{info}</p>
              <button
                onClick={onGoToLogin}
                className="w-full bg-[#1B2A4A] text-white py-3 rounded-xl font-bold hover:bg-[#243659] transition-all"
              >
                Ke Halaman Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                  placeholder="SMA Negeri 1 ..."
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nama Lengkap Anda (Admin/Guru BK)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                  placeholder="Nama Anda"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                  placeholder="nama@sekolah.id"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
              {error && <p className="text-xs font-bold text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#F4B942] text-[#1B2A4A] py-3.5 rounded-xl font-black text-lg hover:bg-yellow-500 transition-all shadow-md mt-2 disabled:opacity-50"
              >
                {submitting ? "Mendaftarkan..." : "Daftar & Masuk"}
              </button>
            </form>
          )}
          {!info && (
            <button onClick={onGoToLogin} className="mt-6 w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600">
              Sudah punya akun? Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1c. JOIN SCHOOL FLOW (Daftar siswa/guru ke sekolah yang sudah ada)
// ==========================================
function JoinSchoolFlow({
  onRegistered,
  onGoToLogin,
}: {
  onRegistered: (user: User) => void;
  onGoToLogin: () => void;
}) {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [role, setRole] = useState<'siswa' | 'guru' | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nis, setNis] = useState("");
  const [className, setClassName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await getSchools();
        setSchools(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !role) return;

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (role === "siswa" && (!nis.trim() || !className.trim())) {
      setError("NIS dan kelas wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { session } = await signUp(email, password);

      if (!session) {
        setInfo(
          "Akun berhasil dibuat! Cek email kamu untuk konfirmasi dulu, lalu login — pendaftaranmu akan menunggu persetujuan guru/admin setelah itu. " +
            "(Catatan buat developer: karena \"Confirm email\" aktif, profil belum otomatis dibuat — perlu disambungkan setelah login pertama.)"
        );
        return;
      }

      const profile = await createMyProfile({
        full_name: fullName.trim(),
        school_id: selectedSchool.id,
        role,
        status: "pending",
      });

      if (role === "siswa") {
        await createMyStudentRecord({
          profile_id: profile.id,
          school_id: selectedSchool.id,
          nis: nis.trim(),
          class_name: className.trim(),
        });
      }

      onRegistered({
        role,
        profileId: profile.id,
        schoolId: selectedSchool.id,
        fullName: profile.full_name,
        status: "pending",
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
        <div className="bg-[#1B2A4A] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap size={120} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight relative z-10 mb-2">
            GC<span className="text-[#F4B942]">Flow</span>
          </h1>
          <p className="text-slate-300 text-sm relative z-10">Daftar sebagai siswa atau guru</p>
        </div>

        <div className="p-8">
          {info ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">{info}</p>
              <button onClick={onGoToLogin} className="w-full bg-[#1B2A4A] text-white py-3 rounded-xl font-bold hover:bg-[#243659] transition-all">
                Ke Halaman Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-8">
                <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? 'w-8 bg-[#F4B942]' : 'w-2 bg-slate-200'}`}></div>
                <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? 'w-8 bg-[#F4B942]' : 'w-2 bg-slate-200'}`}></div>
              </div>

              {step === 1 && (
                <div className="animate-slideUp">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Pilih Sekolah</h2>
                  {loadingSchools ? (
                    <p className="text-center text-sm text-slate-400">Memuat daftar sekolah...</p>
                  ) : schools.length === 0 ? (
                    <p className="text-center text-sm text-slate-400">Belum ada sekolah terdaftar.</p>
                  ) : (
                    <div className="space-y-3">
                      {schools.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedSchool(s); setStep(2); }}
                          className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl hover:border-[#F4B942] hover:bg-yellow-50/30 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                              <GraduationCap size={18} />
                            </div>
                            <span className="font-bold text-slate-800">{s.name}</span>
                          </div>
                          <ChevronRight size={18} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={onGoToLogin} className="mt-6 w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600">
                    Sudah punya akun? Login
                  </button>
                </div>
              )}

              {step === 2 && selectedSchool && (
                <div className="animate-slideUp">
                  <p className="text-xs font-bold text-[#F4B942] uppercase tracking-wider mb-1 text-center">{selectedSchool.name}</p>
                  <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Data Pendaftaran</h2>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('siswa')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${role === 'siswa' ? 'border-[#F4B942] bg-yellow-50/40 text-[#1B2A4A]' : 'border-slate-100 text-slate-400'}`}
                      >
                        Siswa
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('guru')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${role === 'guru' ? 'border-[#1B2A4A] bg-slate-50 text-[#1B2A4A]' : 'border-slate-100 text-slate-400'}`}
                      >
                        Guru BK
                      </button>
                    </div>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (min. 6 karakter)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                      required
                    />

                    {role === "siswa" && (
                      <>
                        <input
                          type="text"
                          value={nis}
                          onChange={(e) => setNis(e.target.value)}
                          placeholder="NIS"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                          required
                        />
                        <input
                          type="text"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="Kelas (mis. XI IPA 1)"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F4B942] focus:outline-none transition-all"
                          required
                        />
                      </>
                    )}

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    <button
                      type="submit"
                      disabled={!role || submitting}
                      className="w-full bg-[#F4B942] text-[#1B2A4A] py-3.5 rounded-xl font-black text-lg hover:bg-yellow-500 transition-all shadow-md mt-2 disabled:opacity-50"
                    >
                      {submitting ? "Mendaftarkan..." : "Daftar"}
                    </button>
                  </form>
                  <button onClick={() => setStep(1)} className="mt-6 w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600">
                    Ganti Sekolah
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1d. PENDING / REJECTED SCREENS
// ==========================================
function PendingApprovalScreen({ user, onLogout, onRefresh }: { user: User; onLogout: () => void; onRefresh: () => void }) {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-center p-8">
        <div className="w-16 h-16 bg-yellow-100 text-[#F4B942] rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Menunggu Persetujuan</h2>
        <p className="text-sm text-slate-500 mb-6">
          Halo {user.fullName}, pendaftaranmu sudah masuk. Guru/admin sekolahmu perlu menyetujui akunmu dulu sebelum kamu bisa mengakses GCFlow.
        </p>
        <button
          onClick={handleRefresh}
          disabled={checking}
          className="w-full bg-[#1B2A4A] text-white py-3 rounded-xl font-bold hover:bg-[#243659] transition-all mb-3 disabled:opacity-50"
        >
          {checking ? "Mengecek..." : "Cek Status"}
        </button>
        <button onClick={onLogout} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600">
          Keluar
        </button>
      </div>
    </div>
  );
}

function RejectedScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Pendaftaran Ditolak</h2>
        <p className="text-sm text-slate-500 mb-6">
          Guru/admin sekolahmu menolak pendaftaran ini. Hubungi mereka langsung kalau menurutmu ini keliru.
        </p>
        <button onClick={onLogout} className="w-full bg-[#1B2A4A] text-white py-3 rounded-xl font-bold hover:bg-[#243659] transition-all">
          Keluar
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD SHELL
// ==========================================
type SidebarProps = {
  user: User;
  onLogout: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
};

function Sidebar({ user, onLogout, currentView, setCurrentView }: SidebarProps) {
  return (
    <div className="hidden md:flex flex-col w-64 bg-[#1B2A4A] text-white h-screen border-r border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-black tracking-tight">GC<span className="text-[#F4B942]">Flow</span></h1>
        <p className="text-xs text-slate-400 mt-1 capitalize">{user.role} Dashboard</p>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2">
        {user.role === 'siswa' ? (
          <>
            <SidebarItem icon={<User size={18}/>} label="Profil Saya" active={currentView === 'profil'} onClick={() => setCurrentView('profil')} />
            <SidebarItem icon={<BookOpen size={18}/>} label="Jurnal & Mailbox" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
            <SidebarItem icon={<LayoutDashboard size={18}/>} label="Mading Sekolah" active={currentView === 'mading'} onClick={() => setCurrentView('mading')} />
          </>
        ) : (
          <>
            <SidebarItem icon={<Users size={18}/>} label="Database Siswa" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
            <SidebarItem icon={<Mail size={18}/>} label="Mailbox Jurnal" active={currentView === 'mailbox'} onClick={() => setCurrentView('mailbox')} />
            <SidebarItem icon={<Calendar size={18}/>} label="Jadwal Konseling" active={currentView === 'jadwal'} onClick={() => setCurrentView('jadwal')} />
            <SidebarItem icon={<LayoutDashboard size={18}/>} label="Kelola Mading" active={currentView === 'kelola_mading'} onClick={() => setCurrentView('kelola_mading')} />
            <SidebarItem icon={<CheckCircle size={18}/>} label="Persetujuan Akun" active={currentView === 'persetujuan'} onClick={() => setCurrentView('persetujuan')} />
          </>
        )}
      </div>
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 mb-4 px-2 leading-relaxed">
          Platform by <br/><strong className="text-[#F4B942]">Aminovations Team</strong>
        </div>
        <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </div>
  );
}

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-[#F4B942] text-[#1B2A4A] shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function Header({ user, onLogout, onNavigate }: { user: User; onLogout: () => void; onNavigate: (view: string) => void }) {
  const firstName = user.fullName?.split(" ")[0] || (user.role === "siswa" ? "Siswa" : "Guru");
  const initial = user.fullName?.charAt(0)?.toUpperCase() || (user.role === "siswa" ? "S" : "G");
  const [showMenu, setShowMenu] = useState(false);
  const mailTarget = user.role === "guru" ? "mailbox" : "home";

  return (
    <header className="bg-white border-b border-slate-200 p-4 md:px-8 flex justify-between items-center z-10 sticky top-0">
      <div className="md:hidden">
        {/* Mobile menu trigger could go here */}
        <h1 className="text-xl font-black text-[#1B2A4A]">GC<span className="text-[#F4B942]">Flow</span></h1>
      </div>
      <div className="hidden md:block">
        <h2 className="text-lg font-bold text-slate-800">
          Selamat {new Date().getHours() < 12 ? 'Pagi' : new Date().getHours() < 18 ? 'Siang' : 'Malam'}, 
          {' ' + firstName} 👋
        </h2>
      </div>
      <div className="flex items-center gap-4 relative">
        <button onClick={() => onNavigate(mailTarget)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors" title="Buka Jurnal & Mailbox">
          <Mail size={20} />
        </button>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="h-8 w-8 bg-[#1B2A4A] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm hover:bg-[#243659] transition-colors"
        >
          {initial}
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-lg py-2 w-48 z-20">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); onLogout(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ==========================================
// 3. STUDENT DASHBOARD (Home View)
// ==========================================
type Journal = {
  id: string;
  student: string;
  content: string;
  requestCounseling: boolean;
  createdAt: string;
};

function StudentDashboard({ user }: { user: User }) {
  const [myStudentId, setMyStudentId] = useState<string | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const [draft, setDraft] = useState("");
  const [wantsCounseling, setWantsCounseling] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchJournals = async (studentId: string) => {
    try {
      const data = await getJournals(studentId);
      setJournals(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const student = await getMyStudentRecord(user.profileId);
        if (!student) {
          console.error("Tidak ada baris `students` yang cocok dengan profil ini.");
          return;
        }
        setMyStudentId(student.id);

        const [journalData, sessionData, unread, announcementData] = await Promise.all([
          getJournals(student.id),
          getCounselingSessionsForStudent(student.id),
          getUnreadMessageCount(user.profileId),
          getAnnouncements(),
        ]);

        setJournals(journalData);
        setSessions(sessionData);
        setUnreadCount(unread);
        setAnnouncements(announcementData.slice(0, 2));
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, [user.profileId]);

  const handleSubmitJournal = async () => {
    if (!draft.trim() || !myStudentId) return;

    setSubmitting(true);
    try {
      await createJournal({
        student_id: myStudentId,
        school_id: user.schoolId,
        content: draft.trim(),
        request_counseling: wantsCounseling,
      });
      setDraft("");
      setWantsCounseling(false);
      await fetchJournals(myStudentId);
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim jurnal. Cek console untuk detail.");
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingSession = sessions.find((s) => s.status === "scheduled") ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20 md:pb-6">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Jurnal" value={String(journals.length)} icon={<BookOpen className="text-blue-500"/>} />
        <StatCard title="Sesi Konseling" value={String(sessions.length)} icon={<Users className="text-indigo-500"/>} />
        <StatCard title="Pesan Baru" value={String(unreadCount)} icon={<MessageSquare className="text-green-500"/>} alert={unreadCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Write Journal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-[#1B2A4A] mb-4 flex items-center gap-2">
              <span className="bg-[#F4B942] p-1.5 rounded-lg text-white"><BookOpen size={16}/></span> 
              Tulis Jurnal Harian
            </h3>
            <textarea 
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#F4B942] focus:outline-none resize-none min-h-[120px] transition-all"
              placeholder="Bagaimana perasaanmu hari ini? Ada yang ingin diceritakan ke Guru BK?"
            ></textarea>
            <div className="flex justify-between items-center mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsCounseling}
                  onChange={(e) => setWantsCounseling(e.target.checked)}
                  className="rounded text-[#1B2A4A] focus:ring-[#F4B942] w-4 h-4"
                />
                <span>Ajukan permintaan konseling tatap muka</span>
              </label>
              <button
                onClick={handleSubmitJournal}
                disabled={submitting || !draft.trim() || !myStudentId}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#243659] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Jurnal"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Riwayat Jurnal</h3>
             </div>
             <div className="divide-y divide-slate-100">
               {journals.length === 0 && (
                 <div className="p-6 text-sm text-slate-400 text-center">Belum ada jurnal. Tulis yang pertama di atas!</div>
               )}
               {journals.map(j => (
                 <div key={j.id} className="p-4 px-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                   <div>
                     <div className="text-xs font-bold text-slate-400 mb-1">
                       {new Date(j.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </div>
                     <div className="font-semibold text-slate-700 truncate max-w-xs">{j.content}</div>
                   </div>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                     j.requestCounseling ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                   }`}>
                     {j.requestCounseling ? 'Menunggu Respon' : 'Selesai Dibaca'}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Col: Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1B2A4A] to-[#2A3F6D] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10">
               <Calendar size={100} />
             </div>
             <h3 className="text-[#F4B942] font-bold text-sm uppercase tracking-wider mb-2">Jadwal Konseling</h3>
             {upcomingSession ? (
               <>
                 <div className="text-2xl font-black mb-1">{formatSessionTime(upcomingSession.session_date)}</div>
                 <p className="text-slate-300 text-sm mb-4">
                   {upcomingSession.location} - dgn {one(upcomingSession.counselor)?.full_name ?? "Guru BK"}
                 </p>
               </>
             ) : (
               <p className="text-slate-300 text-sm mb-4">Belum ada jadwal konseling.</p>
             )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Mading Mini</h3>
            <div className="space-y-4">
               {announcements.length === 0 && (
                 <p className="text-sm text-slate-400">Belum ada pengumuman.</p>
               )}
               {announcements.map((a) => (
                 <div key={a.id} className="flex gap-3">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">{a.icon}</div>
                   <div>
                     <h4 className="text-sm font-bold text-slate-800">{a.title}</h4>
                     <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. TEACHER DASHBOARD (Home View - Student DB)
// ==========================================
type Student = {
  id: string;
  nis: string;
  name: string;
  kelas: string;
  label: string;
  avatar: string;
};

function TeacherDashboard({ user }: { user: User }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("Semua Kelas");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", nis: "", class_name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const classes = Array.from(new Set(students.map((s) => s.kelas))).sort();

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q);
    const matchesClass = classFilter === "Semua Kelas" || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.nis.trim() || !addForm.class_name.trim()) return;

    setSaving(true);
    try {
      await createStudentRecord({
        full_name: addForm.full_name.trim(),
        nis: addForm.nis.trim(),
        class_name: addForm.class_name.trim(),
        email: addForm.email.trim(),
        school_id: user.schoolId,
      });
      setShowAddForm(false);
      setAddForm({ full_name: "", nis: "", class_name: "", email: "" });
      await fetchStudents();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan siswa. Cek console untuk detail.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-20 md:pb-6">
      
      {/* Search Bar & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, NIS, atau kelas..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="flex-1 md:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none"
          >
             <option>Semua Kelas</option>
             {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#243659] transition-colors whitespace-nowrap shadow-sm"
          >
            <PlusCircle size={16}/> Siswa Baru
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-800">Tambah Siswa Baru</h3>
          <p className="text-xs text-slate-400 -mt-2">
            Ini cuma mendaftarkan data siswa (belum bikin akun login). Siswanya tetap perlu daftar sendiri lewat halaman login untuk bisa masuk.
          </p>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nama Lengkap" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B942]" required />
            <input type="text" placeholder="NIS" value={addForm.nis} onChange={(e) => setAddForm({ ...addForm, nis: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B942]" required />
            <input type="text" placeholder="Kelas (mis. VII A)" value={addForm.class_name} onChange={(e) => setAddForm({ ...addForm, class_name: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B942]" required />
            <input type="email" placeholder="Email (opsional)" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B942]" />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-bold rounded-lg hover:bg-[#243659] disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student List View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">Nama Siswa</th>
                <th className="p-4 hidden md:table-cell">NIS</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Label Perhatian</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada siswa yang cocok.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-slate-200">
                        {s.avatar}
                      </div>
                      <div className="font-bold text-slate-800">{s.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">{s.nis}</td>
                  <td className="p-4 font-medium text-slate-600">{s.kelas}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                      s.label === 'Akademik' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      s.label === 'Konseling Berkala' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                      'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setDetailStudent(s)} className="text-sm font-bold text-[#1B2A4A] bg-slate-100 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailStudent && (
        <StudentDetailModal student={detailStudent} onClose={() => setDetailStudent(null)} />
      )}
    </div>
  );
}

function StudentDetailModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [journalData, sessionData] = await Promise.all([
          getJournals(student.id),
          getCounselingSessionsForStudent(student.id),
        ]);
        setJournals(journalData);
        setSessions(sessionData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [student.id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl border border-slate-200">{student.avatar}</div>
            <div>
              <h3 className="font-bold text-slate-800">{student.name}</h3>
              <p className="text-xs text-slate-500">{student.kelas} • NIS: {student.nis}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-sm text-slate-400 text-center">Memuat...</p>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Jurnal Terbaru</h4>
                {journals.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada jurnal.</p>
                ) : (
                  <div className="space-y-2">
                    {journals.slice(0, 5).map((j) => (
                      <div key={j.id} className="p-3 bg-slate-50 rounded-xl text-sm">
                        <p className="text-slate-700">{j.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(j.createdAt).toLocaleDateString("id-ID")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Riwayat Konseling</h4>
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada sesi konseling.</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl text-sm flex justify-between items-center">
                        <div>
                          <p className="text-slate-700">{s.notes}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatSessionTime(s.session_date)} • {s.location}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${s.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  alert?: boolean;
};

function StatCard({ title, value, icon, alert }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
      {alert && <div className="absolute top-0 right-0 w-2 h-2 m-3 rounded-full bg-red-500 animate-pulse"></div>}
      <div>
        <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-black text-[#1B2A4A]">{value}</div>
      </div>
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
        {icon}
      </div>
    </div>
  );
}

// ==========================================
// 5. NEW VIEWS (PAGES)
// ==========================================
function StudentProfile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-[#1B2A4A] relative">
          <div className="absolute -bottom-10 left-8 w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-md">
            👨‍🎓
          </div>
        </div>
        <div className="pt-14 p-8">
          <h2 className="text-2xl font-black text-slate-800">Andi Pratama</h2>
          <p className="text-slate-500 font-medium">Siswa • XI IPA 1</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Info Akademik</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between"><span className="text-slate-500">NIS</span><span className="font-bold text-slate-700">1001</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Wali Kelas</span><span className="font-bold text-slate-700">Bpk. Haryanto</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs">Aktif</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Statistik Konseling</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between"><span className="text-slate-500">Jurnal Ditulis</span><span className="font-bold text-slate-700">14</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sesi Konseling</span><span className="font-bold text-slate-700">2</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Guru BK Utama</span><span className="font-bold text-slate-700">Ibu Rina</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Announcement = {
  id: string;
  title: string;
  tag: string;
  desc: string;
  date: string;
  color: string;
  icon: string;
};

function SchoolBoardView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div>
        <h2 className="text-2xl font-black text-[#1B2A4A]">Mading Sekolah</h2>
        <p className="text-slate-500 text-sm mt-1">Informasi terbaru dari sekolah dan Guru BK.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map(b => (
          <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${b.color}`}>
                {b.icon}
              </div>
              <span className="text-xs font-bold text-slate-400">{b.date}</span>
            </div>
            <div className="text-xs font-bold text-[#F4B942] mb-1 uppercase tracking-wider">{b.tag}</div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">{b.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type Profile = { full_name: string };

// Supabase's untyped client (no generated Database types wired into
// supabase.ts yet) can return an embedded relation as either a single
// object or an array depending on how it infers cardinality from the
// select string. This normalizes either shape to "the first item".
function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

type MailboxJournal = {
  id: string;
  content: string;
  request_counseling: boolean;
  created_at: string;
  students: {
    id: string;
    nis: string;
    class_name: string;
    profile_id: string;
    // Supabase returns nested relations as an object or an array depending
    // on how it infers cardinality — since we don't have generated DB types
    // wired into supabase.ts yet, we accept both shapes here.
    profiles: Profile | Profile[] | null;
  } | Array<{
    id: string;
    nis: string;
    class_name: string;
    profile_id: string;
    profiles: Profile | Profile[] | null;
  }> | null;
};

function getStudentName(students: MailboxJournal["students"]): string {
  const student = one(students);
  const profile = one(student?.profiles);
  return profile?.full_name ?? "Tanpa Nama";
}

type ConversationMessage = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender: Profile | Profile[] | null;
  receiver: Profile | Profile[] | null;
};

// Shared by TeacherMailboxView ("Jadwalkan") and TeacherScheduleView
// ("Tambah Jadwal"). Pass `fixedStudent` to skip the student picker when
// the student is already known (e.g. from the mailbox).
function ScheduleSessionModal({
  user,
  fixedStudent,
  onClose,
  onCreated,
}: {
  user: User;
  fixedStudent?: { id: string; name: string } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState(fixedStudent?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedStudent) return;
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, [fixedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !time || !location.trim()) {
      setError("Lengkapi semua field.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await createCounselingSession({
        student_id: studentId,
        counselor_id: user.profileId,
        school_id: user.schoolId,
        session_date: new Date(`${date}T${time}`).toISOString(),
        location: location.trim(),
        notes: notes.trim(),
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal menjadwalkan sesi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-slate-800 text-lg">Jadwalkan Sesi Konseling</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fixedStudent ? (
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
              {fixedStudent.name}
            </div>
          ) : (
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              required
            >
              <option value="">Pilih siswa...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.kelas})</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
          </div>
          <input type="text" placeholder="Lokasi (mis. Ruang BK)" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
          <textarea placeholder="Catatan" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-bold rounded-lg hover:bg-[#243659] disabled:opacity-50">
              {saving ? "Menyimpan..." : "Jadwalkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeacherMailboxView({ user }: { user: User }) {
  const [journals, setJournals] = useState<MailboxJournal[]>([]);
  const [selected, setSelected] = useState<MailboxJournal | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [search, setSearch] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [markingHandled, setMarkingHandled] = useState(false);

  const fetchMailbox = async () => {
    try {
      const data = await getTeacherMailbox();
      setJournals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMailbox();
  }, []);

  useEffect(() => {
    const student = one(selected?.students);
    if (!selected || !student) {
      setConversation([]);
      return;
    }

    const fetchConversation = async () => {
      try {
        const data = await getConversation(user.profileId, student.profile_id);
        setConversation(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchConversation();
  }, [selected, user.profileId]);

  const handleSend = async () => {
    const student = one(selected?.students);
    if (!reply.trim() || !student) return;

    setSending(true);
    try {
      await sendMessage({
        sender_id: user.profileId,
        receiver_id: student.profile_id,
        message: reply.trim(),
        school_id: user.schoolId,
      });
      setReply("");
      const data = await getConversation(user.profileId, student.profile_id);
      setConversation(data);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim pesan. Cek console untuk detail.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkHandled = async () => {
    if (!selected) return;
    setMarkingHandled(true);
    try {
      await markJournalHandled(selected.id);
      setJournals((prev) => prev.map((j) => (j.id === selected.id ? { ...j, request_counseling: false } : j)));
      setSelected((prev) => (prev ? { ...prev, request_counseling: false } : prev));
    } catch (error) {
      console.error(error);
      alert("Gagal menandai selesai. Cek console untuk detail.");
    } finally {
      setMarkingHandled(false);
    }
  };

  const selectedStudent = one(selected?.students);
  const selectedProfile = one(selectedStudent?.profiles);

  const filteredJournals = journals.filter((j) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return getStudentName(j.students).toLowerCase().includes(q) || j.content.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-[#1B2A4A] mb-4">Mailbox Jurnal Siswa</h2>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Inbox List */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pesan..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredJournals.length === 0 && (
              <div className="p-6 text-sm text-slate-400 text-center">
                {journals.length === 0 ? "Belum ada jurnal masuk." : "Tidak ada yang cocok dengan pencarian."}
              </div>
            )}
            {filteredJournals.map((j) => (
              <div
                key={j.id}
                onClick={() => setSelected(j)}
                className={`p-3 rounded-xl hover:bg-slate-50 border cursor-pointer transition-colors ${
                  selected?.id === j.id ? "border-[#F4B942] bg-yellow-50/40" : "border-transparent"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">
                    {getStudentName(j.students)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(j.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate mb-2">
                  {j.content}
                </p>
                {j.request_counseling && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md">
                    Req Konseling
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="hidden md:flex flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              Pilih jurnal di sebelah kiri untuk lihat detail & balas.
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{selectedProfile?.full_name ?? "Tanpa Nama"}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudent?.class_name} • NIS: {selectedStudent?.nis}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSchedule(true)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-blue-200"><Calendar size={14}/> Jadwalkan</button>
                  <button
                    onClick={handleMarkHandled}
                    disabled={markingHandled || !selected.request_counseling}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <CheckCircle size={14}/> {selected.request_counseling ? "Tandai Selesai" : "Sudah Ditandai"}
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-y-auto space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed text-sm">
                  {selected.content}
                </div>

                {conversation.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center">Belum ada pesan di percakapan ini.</p>
                ) : (
                  conversation.map((m) => {
                    const isFromMe = m.sender_id === user.profileId;
                    return (
                      <div key={m.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                          isFromMe ? "bg-[#1B2A4A] text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {m.message}
                          <div className={`text-[10px] mt-1 ${isFromMe ? "text-slate-300" : "text-slate-400"}`}>
                            {new Date(m.created_at).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Balas pesan ${selectedProfile?.full_name ?? "siswa"}...`}
                    className="w-full pl-4 pr-12 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    rows={2}
                  ></textarea>
                  <button
                    onClick={handleSend}
                    disabled={sending || !reply.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-[#F4B942] text-[#1B2A4A] rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                  >
                    <Send size={16}/>
                  </button>
                </div>
                {justSent && <p className="text-xs font-bold text-green-600 mt-2">✓ Pesan terkirim</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {showSchedule && selectedStudent && selectedProfile && (
        <ScheduleSessionModal
          user={user}
          fixedStudent={{ id: selectedStudent.id, name: selectedProfile.full_name }}
          onClose={() => setShowSchedule(false)}
          onCreated={() => alert("Sesi konseling berhasil dijadwalkan.")}
        />
      )}
    </div>
  );
}

type CounselingSession = {
  id: string;
  session_date: string;
  location: string;
  notes: string;
  status: string;
  students?:
    | { class_name: string; profiles: Profile | Profile[] | null }
    | { class_name: string; profiles: Profile | Profile[] | null }[]
    | null;
  counselor: Profile | Profile[] | null;
};

function formatSessionTime(iso: string) {
  return (
    new Date(iso).toLocaleString("id-ID", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

function RescheduleModal({
  session,
  onClose,
  onRescheduled,
}: {
  session: CounselingSession;
  onClose: () => void;
  onRescheduled: (newDate: string, newLocation: string) => void;
}) {
  const current = new Date(session.session_date);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [date, setDate] = useState(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
  const [time, setTime] = useState(`${pad(current.getHours())}:${pad(current.getMinutes())}`);
  const [location, setLocation] = useState(session.location);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !location.trim()) {
      setError("Lengkapi semua field.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const newDate = new Date(`${date}T${time}`).toISOString();
      await rescheduleCounselingSession(session.id, newDate, location.trim());
      onRescheduled(newDate, location.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal reschedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-slate-800 text-lg">Reschedule Sesi</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
          </div>
          <input type="text" placeholder="Lokasi" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-bold rounded-lg hover:bg-[#243659] disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeacherScheduleView({ user }: { user: User }) {
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [tab, setTab] = useState<"akan_datang" | "riwayat">("akan_datang");
  const [showAddModal, setShowAddModal] = useState(false);
  const [reschedulingSession, setReschedulingSession] = useState<CounselingSession | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await getCounselingSessions();
      setSessions(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleMarkComplete = async (id: string) => {
    try {
      await updateCounselingSessionStatus(id, "completed");
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s)));
    } catch (error) {
      console.error(error);
      alert("Gagal update status sesi. Cek console untuk detail.");
    }
  };

  const upcoming = sessions.filter((s) => s.status === "scheduled");
  const history = sessions.filter((s) => s.status !== "scheduled");
  const visible = tab === "akan_datang" ? upcoming : history;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#1B2A4A]">Jadwal Konseling</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola permintaan dan jadwal pertemuan dengan siswa.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#243659]"
        >
          <PlusCircle size={16}/> Tambah Jadwal
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex gap-4">
          <button
            onClick={() => setTab("akan_datang")}
            className={tab === "akan_datang" ? "text-[#1B2A4A] border-b-2 border-[#F4B942] pb-1" : "text-slate-400 pb-1"}
          >
            Akan Datang ({upcoming.length})
          </button>
          <button
            onClick={() => setTab("riwayat")}
            className={tab === "riwayat" ? "text-[#1B2A4A] border-b-2 border-[#F4B942] pb-1" : "text-slate-400 pb-1"}
          >
            Riwayat ({history.length})
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {visible.length === 0 && (
            <div className="p-8 text-sm text-slate-400 text-center">Belum ada jadwal di sini.</div>
          )}
          {visible.map((s) => {
            const student = one(s.students);
            const profile = one(student?.profiles);
            return (
              <div key={s.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${s.status === "scheduled" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <Calendar size={20}/>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {profile?.full_name ?? "Tanpa Nama"}{student?.class_name ? ` (${student.class_name})` : ""}
                    </h4>
                    <p className="text-sm text-slate-500">{s.notes}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={12}/> {formatSessionTime(s.session_date)}</span>
                      <span className="flex items-center gap-1"><Users size={12}/> {s.location}</span>
                    </div>
                  </div>
                </div>
                {s.status === "scheduled" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReschedulingSession(s)}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleMarkComplete(s.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <ScheduleSessionModal
          user={user}
          onClose={() => setShowAddModal(false)}
          onCreated={fetchSessions}
        />
      )}

      {reschedulingSession && (
        <RescheduleModal
          session={reschedulingSession}
          onClose={() => setReschedulingSession(null)}
          onRescheduled={(newDate, newLocation) => {
            setSessions((prev) => prev.map((s) => (s.id === reschedulingSession.id ? { ...s, session_date: newDate, location: newLocation } : s)));
          }}
        />
      )}
    </div>
  );
}

type AnnouncementItem = {
  id: string;
  title: string;
  tag: string;
  desc: string;
  date: string;
  color: string;
  icon: string;
};

const ANNOUNCEMENT_CATEGORIES = ["BK", "Sekolah", "Akademik"];

function TeacherManageBoardView({ user }: { user: User }) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: ANNOUNCEMENT_CATEGORIES[0], content: "" });
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ title: "", category: ANNOUNCEMENT_CATEGORIES[0], content: "" });
    setShowForm(true);
  };

  const openEditForm = (a: AnnouncementItem) => {
    setEditingId(a.id);
    setForm({ title: a.title, category: a.tag, content: a.desc });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
      } else {
        await createAnnouncement({ ...form, published_by: user.profileId, school_id: user.schoolId });
      }
      setShowForm(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan postingan. Cek console untuk detail.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus postingan ini?")) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus postingan. Cek console untuk detail.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#1B2A4A]">Kelola Mading Sekolah</h2>
          <p className="text-slate-500 text-sm mt-1">Buat dan atur pengumuman untuk seluruh siswa.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-[#F4B942] text-[#1B2A4A] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-yellow-500 transition-colors"
        >
          <PlusCircle size={16}/> Buat Postingan
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-800">{editingId ? "Edit Postingan" : "Postingan Baru"}</h3>
          <input
            type="text"
            placeholder="Judul postingan"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B942]"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          >
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            placeholder="Isi pengumuman"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#1B2A4A] text-white text-sm font-bold rounded-lg hover:bg-[#243659] disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-bold">Judul Postingan</th>
              <th className="p-4 font-bold">Kategori</th>
              <th className="p-4 font-bold">Tanggal</th>
              <th className="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {announcements.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Belum ada postingan.</td>
              </tr>
            )}
            {announcements.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{a.title}</td>
                <td className="p-4"><span className={`px-2 py-1 ${a.color} text-[10px] font-bold rounded-md`}>{a.tag}</span></td>
                <td className="p-4 text-slate-500">{a.date}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openEditForm(a)} className="text-blue-500 hover:underline text-xs font-bold mr-3">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs font-bold">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 6. APPROVALS (Persetujuan Akun)
// ==========================================
type PendingProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

function TeacherApprovalsView() {
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingProfiles();
      setPending(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveProfile(id);
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      alert("Gagal menyetujui akun. Cek console untuk detail.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tolak pendaftaran ini?")) return;
    setBusyId(id);
    try {
      await rejectProfile(id);
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      alert("Gagal menolak akun. Cek console untuk detail.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div>
        <h2 className="text-2xl font-black text-[#1B2A4A]">Persetujuan Akun</h2>
        <p className="text-slate-500 text-sm mt-1">Siswa/guru yang mendaftar sendiri menunggu persetujuan di sini.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat...</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Tidak ada pendaftaran yang menunggu.</div>
        ) : (
          pending.map((p) => (
            <div key={p.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <p className="font-bold text-slate-800">{p.full_name}</p>
                <p className="text-xs text-slate-500">{p.email} • <span className="capitalize">{p.role}</span></p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Daftar {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(p.id)}
                  disabled={busyId === p.id}
                  className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={busyId === p.id}
                  className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                >
                  Setujui
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}