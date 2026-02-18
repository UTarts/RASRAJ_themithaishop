import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_rasraj-ecommerce/artifacts/9xpxuu3p_rasraj_logo.jpg";

export default function Login() {
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, register, loginWithGoogle, handleGoogleCallback, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  // Handle Google OAuth callback via session_id in URL hash
  useEffect(() => {
    if (hasProcessed.current) return;
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      hasProcessed.current = true;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      if (sessionId) {
        setLoading(true);
        handleGoogleCallback(sessionId)
          .then(() => { toast.success("Logged in with Google!"); navigate('/'); })
          .catch(() => toast.error("Google login failed"))
          .finally(() => setLoading(false));
        // Clear hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(data.role === 'admin' ? '/admin' : data.role === 'delivery_partner' ? '/delivery' : '/');
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Please fill required fields"); return; }
    if (form.password.length < 6) { toast.error("Password must be 6+ characters"); return; }
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.phone, form.password);
      toast.success(`Welcome, ${data.name}!`);
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFF6E5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={LOGO_URL} alt="RAS RAJ" className="w-20 h-20 rounded-full object-cover border-4 border-[#D4AF37] mx-auto mb-3" onError={(e) => { e.target.style.display='none'; }} />
          </Link>
          <h1 className="text-3xl font-bold text-[#9B111E]" style={{ fontFamily: 'Playfair Display, serif' }}>RAS RAJ</h1>
          <p className="text-[#B8962E] text-sm" style={{ fontFamily: 'Great Vibes, cursive', fontSize: '16px' }}>The Mithai Shop, Amethi</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6D5BC] p-6 shadow-sm">
          {/* Tab */}
          <div className="flex bg-[#F5E6D3] rounded-full p-1 mb-6">
            <button onClick={() => setTab('login')} className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'login' ? 'bg-white text-[#9B111E] shadow-sm' : 'text-gray-500'}`} data-testid="login-tab">
              {t('login')}
            </button>
            <button onClick={() => setTab('register')} className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'register' ? 'bg-white text-[#9B111E] shadow-sm' : 'text-gray-500'}`} data-testid="register-tab">
              {t('register')}
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type="email" placeholder={t('email')} value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="login-email" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type={showPass ? 'text' : 'password'} placeholder={t('password')} value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="login-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-brand-primary py-3 font-semibold flex items-center justify-center gap-2" data-testid="login-submit">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : t('login')}
              </button>
              <div className="text-center text-xs text-gray-400">or</div>
              <div className="text-xs text-center text-gray-500 bg-[#F5E6D3] rounded-lg p-2">
                <p className="font-semibold text-gray-600 mb-1">Demo Credentials:</p>
                <p>Admin: admin@rasraj.com / admin123</p>
                <p>Delivery: delivery@rasraj.com / delivery123</p>
              </div>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type="text" placeholder={t('name')} value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="register-name" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type="email" placeholder={t('email')} value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="register-email" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type="tel" placeholder={`${t('phone')} (optional)`} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="register-phone" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
                <input type={showPass ? 'text' : 'password'} placeholder={t('password')} value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm" data-testid="register-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-brand-primary py-3 font-semibold flex items-center justify-center gap-2" data-testid="register-submit">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : t('register')}
              </button>
            </form>
          )}

          {/* Google Login */}
          <div className="mt-4">
            <div className="luxury-divider my-4">
              <span className="text-xs text-gray-400 shrink-0 px-2">or continue with</span>
            </div>
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm font-semibold text-[#2A2A2A] hover:bg-[#F5E6D3] hover:border-[#D4AF37] transition-all"
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('loginWithGoogle')}
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          <Link to="/" className="text-[#9B111E] font-medium hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
