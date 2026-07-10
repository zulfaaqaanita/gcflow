import { useEffect } from "react";

// ==========================================
// LANDING PAGE (converted from gcflow.html)
// Static marketing page shown before login/signup.
// All CSS below is scoped under .landing-page so it can't leak
// into or clash with the Tailwind-based app UI elsewhere.
// ==========================================

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  useEffect(() => {
    // Scroll reveal animation (converted from the original <script> tag)
    const reveals = document.querySelectorAll(".landing-page .reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <style>{`
.landing-page *, .landing-page *::before, .landing-page *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
    --navy: #1B2A4A;
    --navy-light: #243659;
    --blue: #4A90D9;
    --blue-light: #6BAEE8;
    --blue-pale: #E8F4FD;
    --yellow: #F4B942;
    --yellow-light: #FFF3CD;
    --white: #FFFFFF;
    --gray-50: #F7F9FC;
    --gray-100: #EEF2F7;
    --gray-400: #9AAFC4;
    --gray-600: #5A7089;
    --gray-800: #2D3E55;
    --radius: 16px;
    --radius-sm: 10px;
  }
html { scroll-behavior: smooth; }
body {
    font-family: 'Inter', sans-serif;
    color: var(--navy);
    background: var(--white);
    overflow-x: hidden;
  }
/* NAV */
.landing-page nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(27, 42, 74, 0.95);
    backdrop-filter: blur(12px);
    padding: 14px 5%;
    display: flex; align-items: center; justify-content: space-between;
  }
.landing-page .nav-logo {
    font-family: 'Nunito', sans-serif;
    font-weight: 900; font-size: 1.4rem;
    color: var(--white);
    letter-spacing: -0.5px;
  }
.landing-page .nav-logo span { color: var(--yellow); }
.landing-page .nav-links { display: flex; gap: 28px; list-style: none; }
.landing-page .nav-links a {
    color: rgba(255,255,255,0.75);
    text-decoration: none; font-size: .9rem; font-weight: 500;
    transition: color .2s;
  }
.landing-page .nav-links a:hover { color: var(--yellow); }
.landing-page .nav-cta {
    background: var(--yellow); color: var(--navy);
    border: none; padding: 9px 22px; border-radius: 50px;
    font-weight: 700; font-size: .9rem; cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: transform .2s, box-shadow .2s;
  }
.landing-page .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244,185,66,.35); }
/* HERO */
.landing-page .hero {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--navy) 0%, #243B6E 50%, #1E4080 100%);
    display: flex; align-items: center;
    padding: 100px 5% 60px;
    position: relative;
    overflow: hidden;
  }
.landing-page .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 70% 50%, rgba(74,144,217,.18) 0%, transparent 70%);
  }
/* floating blobs */
.landing-page .blob {
    position: absolute; border-radius: 50%;
    filter: blur(60px); opacity: .12;
  }
.landing-page .blob-1 { width: 500px; height: 500px; background: var(--blue); top: -100px; right: -100px; }
.landing-page .blob-2 { width: 300px; height: 300px; background: var(--yellow); bottom: -50px; left: 10%; }
.landing-page .hero-inner {
    position: relative; z-index: 2;
    max-width: 1200px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
.landing-page .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
    color: rgba(255,255,255,.85); font-size: .8rem; font-weight: 600;
    padding: 6px 14px; border-radius: 50px; margin-bottom: 20px;
    letter-spacing: .5px;
  }
.landing-page .hero-badge::before {
    content: '●'; color: var(--yellow); font-size: .6rem;
  }
.landing-page .hero-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(2.4rem, 4.5vw, 3.6rem);
    font-weight: 900; color: var(--white);
    line-height: 1.15; margin-bottom: 20px;
  }
.landing-page .hero-title .accent { color: var(--yellow); }
.landing-page .hero-subtitle {
    font-size: 1.05rem; line-height: 1.7;
    color: rgba(255,255,255,.7);
    margin-bottom: 36px; max-width: 480px;
  }
.landing-page .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.landing-page .btn-primary {
    background: var(--yellow); color: var(--navy);
    padding: 13px 30px; border-radius: 50px;
    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 1rem;
    text-decoration: none; border: none; cursor: pointer;
    transition: transform .2s, box-shadow .2s;
    display: inline-block;
  }
.landing-page .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,185,66,.4); }
.landing-page .btn-secondary {
    background: rgba(255,255,255,.12); color: var(--white);
    border: 1px solid rgba(255,255,255,.25);
    padding: 13px 30px; border-radius: 50px;
    font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 1rem;
    text-decoration: none; cursor: pointer;
    transition: background .2s;
    display: inline-block;
  }
.landing-page .btn-secondary:hover { background: rgba(255,255,255,.2); }
/* hero visual — folder cards */
.landing-page .hero-visual {
    position: relative; height: 420px;
    display: flex; align-items: center; justify-content: center;
  }
.landing-page .folder-main {
    position: absolute;
    width: 320px; height: 260px;
    background: linear-gradient(145deg, #F4C040 0%, #E8A820 100%);
    border-radius: 8px 20px 20px 20px;
    box-shadow: 0 24px 60px rgba(0,0,0,.35);
    animation: float 4s ease-in-out infinite;
  }
.landing-page .folder-main::before {
    content: '';
    position: absolute; top: -22px; left: 0;
    width: 100px; height: 28px;
    background: #E8A820;
    border-radius: 8px 8px 0 0;
  }
.landing-page .folder-label {
    position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
    text-align: center;
  }
.landing-page .folder-label .fl-name {
    font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 1.5rem;
    color: var(--navy);
  }
.landing-page .folder-label .fl-sub { font-size: .75rem; color: rgba(27,42,74,.6); font-weight: 600; }
.landing-page .card-float {
    position: absolute;
    background: var(--white);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,.2);
    font-family: 'Nunito', sans-serif;
    font-size: .82rem; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
    white-space: nowrap;
  }
.landing-page .card-float .icon { font-size: 1.1rem; }
.landing-page .cf-1 { top: 30px; right: -20px; animation: float 3.5s ease-in-out infinite; animation-delay: .5s; }
.landing-page .cf-2 { bottom: 60px; right: -30px; animation: float 4.2s ease-in-out infinite; animation-delay: 1s; }
.landing-page .cf-3 { top: 60px; left: -30px; animation: float 3.8s ease-in-out infinite; animation-delay: .2s; }
.landing-page .cf-4 { bottom: 20px; left: -10px; animation: float 4.5s ease-in-out infinite; animation-delay: .8s; }
.landing-page .dot-grid {
    position: absolute; top: 0; right: 0; bottom: 0; left: 0;
    background-image: radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px);
    background-size: 24px 24px; pointer-events: none; z-index: 0;
  }


  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
/* TRUST BAR */
.landing-page .trust-bar {
    background: var(--navy);
    padding: 18px 5%;
    display: flex; align-items: center; justify-content: center; gap: 40px;
    flex-wrap: wrap;
  }
.landing-page .trust-item {
    color: rgba(255,255,255,.55); font-size: .82rem; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
  }
.landing-page .trust-item strong { color: rgba(255,255,255,.85); font-weight: 700; }
/* SECTIONS */
.landing-page section { padding: 90px 5%; }
.landing-page .section-eyebrow {
    font-size: .75rem; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--blue);
    margin-bottom: 10px;
  }
.landing-page .section-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    font-weight: 900; color: var(--navy);
    line-height: 1.2; margin-bottom: 16px;
  }
.landing-page .section-desc {
    font-size: 1rem; line-height: 1.7;
    color: var(--gray-600); max-width: 580px;
  }
.landing-page .section-header { margin-bottom: 56px; }
/* HOW IT WORKS */
.landing-page .how { background: var(--gray-50); }
.landing-page .steps-row {
    max-width: 900px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;
    position: relative;
  }
.landing-page .steps-row::before {
    content: '';
    position: absolute; top: 32px; left: 12%; right: 12%;
    height: 2px;
    background: linear-gradient(90deg, var(--blue-pale), var(--blue), var(--blue-pale));
  }
.landing-page .step-card {
    text-align: center;
    padding: 28px 16px 20px;
    background: var(--white);
    border-radius: var(--radius);
    box-shadow: 0 2px 16px rgba(27,42,74,.07);
    position: relative; z-index: 1;
    transition: transform .25s, box-shadow .25s;
  }
.landing-page .step-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(27,42,74,.12); }
.landing-page .step-num {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--navy); color: var(--yellow);
    font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 1.1rem;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 4px 16px rgba(27,42,74,.25);
  }
.landing-page .step-card h4 {
    font-family: 'Nunito', sans-serif; font-weight: 800;
    font-size: 1rem; margin-bottom: 8px; color: var(--navy);
  }
.landing-page .step-card p { font-size: .85rem; color: var(--gray-600); line-height: 1.6; }
/* FEATURES */
.landing-page .features-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px;
    max-width: 1100px; margin: 0 auto; align-items: start;
  }
.landing-page .feature-block { }
.landing-page .feature-block-header {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 28px;
  }
.landing-page .role-pill {
    padding: 6px 16px; border-radius: 50px;
    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: .85rem;
  }
.landing-page .role-pill.student { background: var(--blue-pale); color: var(--blue); }
.landing-page .role-pill.teacher { background: var(--yellow-light); color: #A07010; }
.landing-page .feature-list { display: flex; flex-direction: column; gap: 14px; }
.landing-page .feat-item {
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: var(--radius-sm);
    padding: 16px 18px;
    display: flex; gap: 14px; align-items: flex-start;
    transition: border-color .2s, box-shadow .2s;
  }
.landing-page .feat-item:hover {
    border-color: var(--blue-light);
    box-shadow: 0 4px 16px rgba(74,144,217,.1);
  }
.landing-page .feat-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; flex-shrink: 0;
  }
.landing-page .feat-icon.blue { background: var(--blue-pale); }
.landing-page .feat-icon.yellow { background: var(--yellow-light); }
.landing-page .feat-text h5 {
    font-family: 'Nunito', sans-serif; font-weight: 800;
    font-size: .95rem; margin-bottom: 4px; color: var(--navy);
  }
.landing-page .feat-text p { font-size: .83rem; color: var(--gray-600); line-height: 1.5; }
/* JOURNAL SHOWCASE */
.landing-page .journal-section {
    background: linear-gradient(135deg, var(--navy) 0%, #1E3560 100%);
    padding: 90px 5%;
    position: relative; overflow: hidden;
  }
.landing-page .journal-section::before {
    content: '';
    position: absolute; top: -200px; right: -200px;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(74,144,217,.15) 0%, transparent 70%);
  }
.landing-page .journal-inner {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
    position: relative; z-index: 1;
  }
.landing-page .journal-inner .section-title { color: var(--white); }
.landing-page .journal-inner .section-desc { color: rgba(255,255,255,.65); }
.landing-page .journal-inner .section-eyebrow { color: var(--yellow); }
.landing-page .journal-card {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.15);
    border-radius: var(--radius);
    padding: 24px;
    backdrop-filter: blur(8px);
  }
.landing-page .jc-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
.landing-page .jc-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--blue); display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
  }
.landing-page .jc-name { font-family: 'Nunito', sans-serif; font-weight: 700; color: var(--white); font-size: .9rem; }
.landing-page .jc-date { font-size: .75rem; color: rgba(255,255,255,.45); margin-top: 1px; }
.landing-page .jc-body {
    font-size: .9rem; line-height: 1.7; color: rgba(255,255,255,.8);
    margin-bottom: 18px;
  }
.landing-page .jc-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.landing-page .jc-chip {
    padding: 4px 12px; border-radius: 50px;
    font-size: .75rem; font-weight: 600;
    background: rgba(255,255,255,.12); color: rgba(255,255,255,.75);
  }
.landing-page .jc-actions { display: flex; gap: 10px; }
.landing-page .jc-btn {
    flex: 1; padding: 10px; border-radius: var(--radius-sm); border: none;
    font-family: 'Nunito', sans-serif; font-weight: 700; font-size: .82rem;
    cursor: pointer; transition: transform .15s;
  }
.landing-page .jc-btn:hover { transform: scale(1.02); }
.landing-page .jc-btn.primary { background: var(--yellow); color: var(--navy); }
.landing-page .jc-btn.secondary { background: rgba(255,255,255,.12); color: var(--white); }
.landing-page .jc-status {
    margin-top: 12px;
    font-size: .78rem; color: rgba(255,255,255,.5);
    display: flex; align-items: center; gap: 6px;
  }
.landing-page .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4CAF50; }
/* SCHOOL BOARD */
.landing-page .board-section { background: var(--gray-50); }
.landing-page .board-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    max-width: 1000px; margin: 0 auto;
  }
.landing-page .board-card {
    background: var(--white);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(27,42,74,.07);
    transition: transform .25s, box-shadow .25s;
  }
.landing-page .board-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(27,42,74,.12); }
.landing-page .bc-thumb {
    height: 120px; display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem;
  }
.landing-page .bc-thumb.blue { background: var(--blue-pale); }
.landing-page .bc-thumb.yellow { background: var(--yellow-light); }
.landing-page .bc-thumb.navy { background: #E8EEF7; }
.landing-page .bc-body { padding: 16px; }
.landing-page .bc-tag {
    font-size: .7rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    color: var(--blue); margin-bottom: 6px;
  }
.landing-page .bc-title {
    font-family: 'Nunito', sans-serif; font-weight: 800;
    font-size: .95rem; color: var(--navy); margin-bottom: 6px;
  }
.landing-page .bc-desc { font-size: .8rem; color: var(--gray-600); line-height: 1.5; }
.landing-page .bc-footer {
    padding: 10px 16px; border-top: 1px solid var(--gray-100);
    display: flex; align-items: center; justify-content: space-between;
  }
.landing-page .bc-date { font-size: .75rem; color: var(--gray-400); }
/* CTA */
.landing-page .cta-section {
    background: linear-gradient(135deg, var(--blue) 0%, var(--navy) 100%);
    text-align: center; padding: 100px 5%;
    position: relative; overflow: hidden;
  }
.landing-page .cta-section::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(255,255,255,.06) 0%, transparent 70%);
  }
.landing-page .cta-section h2 {
    font-family: 'Nunito', sans-serif; font-weight: 900;
    font-size: clamp(2rem, 4vw, 3rem); color: var(--white);
    margin-bottom: 16px; position: relative; z-index: 1;
  }
.landing-page .cta-section p {
    font-size: 1.05rem; color: rgba(255,255,255,.7);
    margin-bottom: 36px; position: relative; z-index: 1;
  }
.landing-page .cta-section .btn-primary { font-size: 1.05rem; padding: 15px 40px; position: relative; z-index: 1; }
/* FOOTER */
.landing-page footer {
    background: var(--navy);
    padding: 50px 5% 30px;
    color: rgba(255,255,255,.55);
  }
.landing-page .footer-inner {
    max-width: 1100px; margin: 0 auto;
    margin-bottom: 40px;
  }
.landing-page .footer-brand .nav-logo { font-size: 1.6rem; display: block; margin-bottom: 12px; }
.landing-page .footer-brand p { font-size: .88rem; line-height: 1.7; max-width: 420px; }
.landing-page .footer-bottom {
    border-top: 1px solid rgba(255,255,255,.08);
    padding-top: 24px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: gap;
    font-size: .82rem;
  }
.landing-page .footer-credit { color: rgba(255,255,255,.35); }
.landing-page .footer-credit strong { color: var(--yellow); }
.landing-page .social-links { display: flex; gap: 12px; }
.landing-page .social-links a {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,.08);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.5); text-decoration: none; font-size: .85rem;
    transition: background .2s, color .2s;
  }
.landing-page .social-links a:hover { background: var(--yellow); color: var(--navy); }
/* STAT CARDS */
.landing-page .stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
    max-width: 900px; margin: 0 auto 70px;
  }
.landing-page .stat-card {
    text-align: center; padding: 28px 16px;
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: var(--radius);
    box-shadow: 0 2px 12px rgba(27,42,74,.06);
  }
.landing-page .stat-num {
    font-family: 'Nunito', sans-serif;
    font-size: 2rem; font-weight: 900; color: var(--navy);
    margin-bottom: 4px;
  }
.landing-page .stat-num span { color: var(--yellow); }
.landing-page .stat-label { font-size: .82rem; color: var(--gray-600); line-height: 1.4; }


  /* RESPONSIVE */
  @media (max-width: 900px) {.landing-page .hero-inner { grid-template-columns: 1fr; }
.landing-page .hero-visual { display: none; }
.landing-page .features-grid { grid-template-columns: 1fr; }
.landing-page .journal-inner { grid-template-columns: 1fr; }
.landing-page .board-grid { grid-template-columns: 1fr 1fr; }
.landing-page .steps-row { grid-template-columns: 1fr 1fr; }
.landing-page .steps-row::before { display: none; }
.landing-page .stats-row { grid-template-columns: 1fr 1fr; }
.landing-page .nav-links { display: none; }

  }

  @media (max-width: 580px) {.landing-page .board-grid { grid-template-columns: 1fr; }
.landing-page .steps-row { grid-template-columns: 1fr; }
.landing-page .stats-row { grid-template-columns: 1fr 1fr; }

  }
/* scroll reveal */
.landing-page .reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s ease; }
.landing-page .reveal.visible { opacity: 1; transform: none; }


      `}</style>


      <nav>
        <div className="nav-logo">GC<span>Flow</span></div>
        <ul className="nav-links">
          <li><a href="#cara-kerja">Cara Kerja</a></li>
          <li><a href="#fitur">Fitur</a></li>
          <li><a href="#jurnal">Jurnal</a></li>
        </ul>
        <button className="nav-cta" onClick={onGetStarted}>Mulai Sekarang</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="dot-grid"></div>
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">Platform BK Digital Sekolah</div>
            <h1 className="hero-title">Ruang Konseling yang <span className="accent">Aman</span> & Terhubung</h1>
            <p className="hero-subtitle">GCFlow memudahkan komunikasi antara siswa dan guru BK — dari pencatatan jurnal refleksi hingga penjadwalan konseling, semua dalam satu platform terpusat.</p>
            <div className="hero-actions">
              <a href="#fitur" className="btn-primary">Jelajahi Fitur</a>
              <a href="#cara-kerja" className="btn-secondary">Cara Kerja →</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="folder-main">
              <div className="folder-label">
                <div className="fl-name">GCFlow</div>
                <div className="fl-sub">Guidance & Counseling Flow</div>
              </div>
            </div>
            <div className="card-float cf-1">
              <span className="icon">📓</span> Jurnal Refleksi
            </div>
            <div className="card-float cf-2">
              <span className="icon">📅</span> Jadwal Konseling
            </div>
            <div className="card-float cf-3">
              <span className="icon">🏫</span> Mading Digital
            </div>
            <div className="card-float cf-4">
              <span className="icon">🏷️</span> Label Siswa
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="trust-item">🎓 Untuk <strong>SMP &amp; SMA</strong></div>
        <div className="trust-item">👩‍🏫 Guru BK &amp; <strong>Siswa</strong></div>
        <div className="trust-item">🔒 <strong>Privasi</strong> Terlindungi</div>
        <div className="trust-item">📱 <strong>Mobile</strong> &amp; Desktop</div>
        <div className="trust-item">🏆 Hibah MBKM <strong>Aminovations</strong></div>
      </div>

      {/* HOW IT WORKS */}
      <section className="how" id="cara-kerja">
        <div style={{maxWidth: '1100px', margin: '0 auto'}}>
          <div className="section-header reveal" style={{textAlign: 'center'}}>
            <div className="section-eyebrow">Alur Platform</div>
            <h2 className="section-title">Masuk, Terverifikasi, Mulai</h2>
            <p className="section-desc" style={{margin: '0 auto'}}>Setiap sekolah punya ruangnya sendiri — pendaftar baru diverifikasi dulu oleh guru BK sebelum bisa mengakses data sekolah.</p>
          </div>
          <div className="steps-row reveal">
            <div className="step-card">
              <div className="step-num">1</div>
              <h4>Pilih Sekolah</h4>
              <p>Pilih sekolahmu dari daftar, atau daftarkan sekolah baru.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h4>Daftar / Login</h4>
              <p>Siswa & guru BK daftar dengan email dan password sendiri.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h4>Diverifikasi Guru BK</h4>
              <p>Pendaftar baru menunggu persetujuan sebelum akun aktif.</p>
            </div>
            <div className="step-card">
              <div className="step-num">4</div>
              <h4>Dashboard Aktif</h4>
              <p>Setelah disetujui, akses semua fitur sesuai peran.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" style={{padding: '90px 5%'}}>
        <div style={{maxWidth: '1100px', margin: '0 auto'}}>
          <div className="section-header reveal">
            <div className="section-eyebrow">Fitur Lengkap</div>
            <h2 className="section-title">Dirancang untuk Semua Pengguna</h2>
            <p className="section-desc">Dua dashboard yang berbeda, sama-sama intuitif — satu untuk siswa, satu untuk guru BK.</p>
          </div>
          <div className="features-grid reveal">
            {/* Student */}
            <div className="feature-block">
              <div className="feature-block-header">
                <div className="role-pill student">👨‍🎓 Siswa</div>
                <span style={{fontSize: '.82rem', color: 'var(--gray-600)'}}>3 menu utama</span>
              </div>
              <div className="feature-list">
                <div className="feat-item">
                  <div className="feat-icon blue">👤</div>
                  <div className="feat-text">
                    <h5>Profil Siswa</h5>
                    <p>Data pribadi tersimpan dalam satu profil, terhubung ke akun sekolah masing-masing.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon blue">📓</div>
                  <div className="feat-text">
                    <h5>Jurnal Harian</h5>
                    <p>Tulis refleksi harian dan ajukan permintaan konseling tatap muka langsung dari jurnal.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon blue">📌</div>
                  <div className="feat-text">
                    <h5>Mading Sekolah</h5>
                    <p>Lihat pengumuman dan informasi terbaru yang dikelola guru BK.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon blue">📊</div>
                  <div className="feat-text">
                    <h5>Status Jurnal</h5>
                    <p>Pantau status jurnal — menunggu respons atau sudah dibaca guru BK.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Teacher */}
            <div className="feature-block">
              <div className="feature-block-header">
                <div className="role-pill teacher">👩‍🏫 Guru BK</div>
                <span style={{fontSize: '.82rem', color: 'var(--gray-600)'}}>Kelola sekolah sendiri</span>
              </div>
              <div className="feature-list">
                <div className="feat-item">
                  <div className="feat-icon yellow">🗃️</div>
                  <div className="feat-text">
                    <h5>Database Siswa</h5>
                    <p>Cari dan filter data siswa berdasarkan kelas, lihat riwayat jurnal & konseling tiap siswa.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon yellow">📥</div>
                  <div className="feat-text">
                    <h5>Kotak Masuk Jurnal</h5>
                    <p>Baca jurnal siswa, balas langsung, dan tandai permintaan konseling sebagai selesai.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon yellow">📆</div>
                  <div className="feat-text">
                    <h5>Jadwal Konseling</h5>
                    <p>Buat, reschedule, dan tandai selesai sesi konseling dengan siswa.</p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon yellow">✅</div>
                  <div className="feat-text">
                    <h5>Persetujuan Akun</h5>
                    <p>Setiap pendaftar baru — siswa maupun guru — diverifikasi dulu sebelum bisa mengakses data sekolah.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding: '0 5% 90px', background: 'var(--white)'}}>
        <div style={{maxWidth: '900px', margin: '0 auto'}}>
          <div className="stats-row reveal">
            <div className="stat-card">
              <div className="stat-num">3<span>+</span></div>
              <div className="stat-label">Menu utama untuk siswa</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">5<span>+</span></div>
              <div className="stat-label">Menu khusus guru BK</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">100<span>%</span></div>
              <div className="stat-label">Responsif mobile & desktop</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">0<span>%</span></div>
              <div className="stat-label">Label siswa terekspos ke publik</div>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNAL SHOWCASE */}
      <section className="journal-section" id="jurnal">
        <div className="journal-inner">
          <div>
            <div className="section-eyebrow">Jurnal Digital</div>
            <h2 className="section-title" style={{marginBottom: '16px'}}>Tulis, Kirim, Ditindaklanjuti</h2>
            <p className="section-desc" style={{marginBottom: '28px'}}>Siswa menulis refleksi harian dan bisa langsung mencentang "ajukan konseling tatap muka" kalau butuh bicara langsung dengan guru BK — semua dalam satu kali kirim.</p>
            <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <li style={{display: 'flex', gap: '10px', alignItems: 'center', color: 'rgba(255,255,255,.75)', fontSize: '.9rem'}}>
                <span style={{width: '22px', height: '22px', background: 'var(--yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: '0'}}>✓</span>
                Tulis refleksi harian kapan saja
              </li>
              <li style={{display: 'flex', gap: '10px', alignItems: 'center', color: 'rgba(255,255,255,.75)', fontSize: '.9rem'}}>
                <span style={{width: '22px', height: '22px', background: 'var(--yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: '0'}}>✓</span>
                Ajukan permintaan konseling dari jurnal
              </li>
              <li style={{display: 'flex', gap: '10px', alignItems: 'center', color: 'rgba(255,255,255,.75)', fontSize: '.9rem'}}>
                <span style={{width: '22px', height: '22px', background: 'var(--yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: '0'}}>✓</span>
                Pantau status: menunggu respons → sudah dibaca
              </li>
            </ul>
          </div>
          <div className="journal-card reveal">
            <div className="jc-header">
              <div className="jc-avatar">🧑‍🎓</div>
              <div>
                <div className="jc-name">Andi Pratama · Kelas XI IPA 2</div>
                <div className="jc-date">Senin, 9 Juni 2025</div>
              </div>
            </div>
            <div className="jc-body">
              "Hari ini saya merasa cukup tertekan karena ujian minggu depan. Saya belum paham materi fisika dan khawatir hasilnya tidak sesuai harapan orang tua. Butuh saran cara belajar yang lebih efektif..."
            </div>
            <div className="jc-chips">
              <span className="jc-chip">☑️ Minta konseling tatap muka</span>
            </div>
            <div className="jc-actions">
              <button className="jc-btn primary">📤 Kirim Jurnal</button>
            </div>
            <div className="jc-status">
              <div className="status-dot"></div>
              Jurnal terkirim · Menunggu respons guru BK
            </div>
          </div>
        </div>
      </section>

      {/* SCHOOL BOARD */}
      <section className="board-section" id="mading">
        <div style={{maxWidth: '1100px', margin: '0 auto'}}>
          <div className="section-header reveal" style={{textAlign: 'center'}}>
            <div className="section-eyebrow">Mading Digital</div>
            <h2 className="section-title">Semua Informasi Sekolah di Satu Tempat</h2>
            <p className="section-desc" style={{margin: '0 auto'}}>Guru BK mengelola konten mading — dari pengumuman, motivasi, hingga informasi beasiswa dan kesehatan mental siswa.</p>
          </div>
          <div className="board-grid reveal">
            <div className="board-card">
              <div className="bc-thumb blue">🧠</div>
              <div className="bc-body">
                <div className="bc-tag">BK</div>
                <div className="bc-title">Layanan Konseling Dibuka</div>
                <div className="bc-desc">Silakan ajukan konseling langsung melalui GCFlow kapan saja.</div>
              </div>
              <div className="bc-footer">
                <span className="bc-date">5 Jun 2025</span>
              </div>
            </div>
            <div className="board-card">
              <div className="bc-thumb yellow">🏫</div>
              <div className="bc-body">
                <div className="bc-tag">Sekolah</div>
                <div className="bc-title">Seminar Parenting</div>
                <div className="bc-desc">Seminar untuk orang tua akan dilaksanakan pekan depan.</div>
              </div>
              <div className="bc-footer">
                <span className="bc-date">3 Jun 2025</span>
              </div>
            </div>
            <div className="board-card">
              <div className="bc-thumb navy">📚</div>
              <div className="bc-body">
                <div className="bc-tag">Akademik</div>
                <div className="bc-title">Pekan Literasi</div>
                <div className="bc-desc">Mari sukseskan Pekan Literasi bersama-sama.</div>
              </div>
              <div className="bc-footer">
                <span className="bc-date">1 Jun 2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Siap Membawa BK Sekolahmu ke Era Digital?</h2>
        <p>Bergabung bersama GCFlow — platform konseling sekolah yang ramah, aman, dan modern.</p>
        <a href="#" className="btn-primary" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Mulai Gratis Sekarang</a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo">GC<span>Flow</span></span>
            <p>Platform digital bimbingan dan konseling sekolah yang memudahkan komunikasi siswa dan guru BK secara terpusat, aman, dan personal.</p>
            <p style={{marginTop: '14px', fontSize: '.8rem'}}>Dikembangkan oleh <strong style={{color: 'var(--yellow)'}}>Kelompok Hibah MBKM Aminovations</strong></p>
            <p style={{fontSize: '.78rem', marginTop: '4px'}}>Universitas Sebelas Maret · Prodi Bimbingan &amp; Konseling</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-credit">© 2026 GCFlow · <strong>Kelompok Hibah MBKM Aminovations</strong> · All rights reserved.</div>
          <div className="social-links">
            <a href="https://www.instagram.com/aminovationss/" title="Instagram" target="_blank" rel="noopener">📸</a>
          </div>
        </div>
      </footer>

      <script>
        // Scroll reveal
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); }
          });
        }, { threshold: 0.12 });
        reveals.forEach(el => observer.observe(el));
      </script>

    </div>
  );
}
