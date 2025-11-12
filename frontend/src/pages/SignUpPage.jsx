import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useUserStore } from '../stores/useUserStore'


const __FM = motion;

const SignUpPage = () => {
  const navigate = useNavigate()
  const { signup } = useUserStore()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setApiError('')
    try {
      await signup({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      // If signup succeeds, navigate to home
      navigate('/')
    } catch (err) {
      setApiError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  }

  const fields = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      icon: User,
      placeholder: 'John Doe',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      icon: Mail,
      placeholder: 'you@example.com',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      icon: Lock,
      placeholder: 'Create a strong password',
      toggleShow: true,
      show: showPassword,
      setShow: setShowPassword,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      icon: CheckCircle,
      placeholder: 'Confirm your password',
      toggleShow: true,
      show: showConfirmPassword,
      setShow: setShowConfirmPassword,
    },
  ]

  return (
   <div className="h-\[100svh\] bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-3 py-4 overflow-hidden">
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="w-full max-w-sm"
  >
    <div className="relative backdrop-blur-xl bg-linear-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-emerald-500/5 pointer-events-none"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-4 md:p-6"
      >
        <motion.div variants={itemVariants} className="mb-1.5">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-500">
            Create Account
          </h1>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-gray-400 text-xs md:text-sm mb-4"
        >
          Join PerfumeStore and discover the finest fragrances
        </motion.p>

        {apiError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3">
            <p className="text-red-400 text-xs font-medium">{apiError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field, index) => {
            const IconComponent = field.icon
            const isPassword = field.type === 'password'
            const showPwd = isPassword && field.show
            const actualType = isPassword && showPwd ? 'text' : field.type
            const hasError = errors[field.name]

            return (
              <motion.div
                key={field.name}
                variants={fieldVariants}
                transition={{ delay: 0.05 * index }}
                className="group"
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 group-hover:text-green-400 transition-colors">
                  {field.label}
                </label>

                <div className="relative">
                  <div
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 bg-gray-900/50 ${
                      hasError
                        ? 'border-red-500/50 focus-within:border-red-400 focus-within:shadow-lg focus-within:shadow-red-500/20'
                        : 'border-gray-600/50 group-hover:border-green-500/50 focus-within:border-green-400/50 focus-within:shadow-lg focus-within:shadow-green-500/20'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 transition-colors duration-300 ${
                        hasError
                          ? 'text-red-400'
                          : 'text-gray-400 group-hover:text-green-400 group-focus-within:text-green-400'
                      }`}
                    />

                    <input
                      type={actualType}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 text-sm"
                    />

                    {field.toggleShow && (
                      <button
                        type="button"
                        onClick={() => field.setShow(!field.show)}
                        className="text-gray-400 hover:text-green-400 transition-colors duration-300"
                        aria-label="Toggle password visibility"
                      >
                        {showPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {hasError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-[11px] mt-1 font-medium"
                    >
                      {hasError}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )
          })}

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
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          variants={itemVariants}
          className="mt-4 text-center text-xs text-gray-400"
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-green-400 hover:text-green-300 font-semibold transition-colors"
          >
            Log in here
          </Link>
        </motion.div>
      </motion.div>
    </div>
  </motion.div>
</div>
  )
}
export default SignUpPage
