import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const __FM = motion;

export default function Login() {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [scale, setScale] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Simple variants (replace with your own if you already have them)
  const containerVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };

  useLayoutEffect(() => {
    const updateScale = () => {
      const vh = window.innerHeight;
      const panelH = panelRef.current?.offsetHeight || 0;
      const s = panelH ? Math.min(1, (vh - 16) / panelH) : 1; // 16px safety
      setScale(s);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setApiError("");
    try {
      await login(formData.email, formData.password);
      // If login succeeds, navigate to home
      navigate('/');
    } catch (err) {
      setApiError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Page pinned to viewport; no page scroll
    <div className="fixed inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-3 py-4 overflow-hidden">
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm origin-top"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="relative backdrop-blur-xl bg-linear-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-emerald-500/5 pointer-events-none" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 p-4 md:p-6"
          >
            <motion.div variants={itemVariants} className="mb-1.5">
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-500">
                Log in
              </h1>
            </motion.div>

            <motion.p variants={itemVariants} className="text-gray-400 text-xs md:text-sm mb-4">
              Welcome back to PerfumeStore
            </motion.p>

            {apiError ? (
              <motion.div variants={itemVariants} className="mb-3">
                <p className="text-red-400 text-xs font-medium">{apiError}</p>
              </motion.div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <motion.div variants={itemVariants} className="group">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 group-hover:text-green-400 transition-colors">
                  Email
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 bg-gray-900/50 border-gray-600/50 group-hover:border-green-500/50 focus-within:border-green-400/50 focus-within:shadow-lg focus-within:shadow-green-500/20">
                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-green-400 group-focus-within:text-green-400 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 text-sm"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-[11px] mt-1 font-medium">{errors.email}</p>
                  )}
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="group">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 group-hover:text-green-400 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 bg-gray-900/50 border-gray-600/50 group-hover:border-green-500/50 focus-within:border-green-400/50 focus-within:shadow-lg focus-within:shadow-green-500/20">
                    <Lock className="w-4 h-4 text-gray-400 group-hover:text-green-400 group-focus-within:text-green-400 transition-colors" />
                    <input
                      type={showPwd ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-[11px] mt-1 font-medium">{errors.password}</p>
                  )}
                </div>
              </motion.div>

              {/* Submit */}
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 md:py-3 mt-4 rounded-lg bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-green-900/30 hover:shadow-green-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div variants={itemVariants} className="mt-4 text-center text-xs text-gray-400">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-green-400 hover:text-green-300 font-semibold">
                Create one
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
