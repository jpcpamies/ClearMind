import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';
import logoUrl from '@assets/logo-completo-vertical-clearmind_1756235946084.png';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score < 2) return { strength: 'weak', color: 'bg-red-500' };
  if (score < 4) return { strength: 'medium', color: 'bg-yellow-500' };
  return { strength: 'strong', color: 'bg-green-500' };
};

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <img 
          src={logoUrl} 
          alt="ClearMind Logo" 
          className="mx-auto mb-6" 
          style={{ width: '260px' }}
        />
        <h1 className="text-2xl font-bold text-gray-900">Welcome to ClearMind ✨</h1>
        <p className="text-sm text-gray-600 mt-2">
          Your space to think clearly and stay organized.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              className="pl-10"
              {...register('username')}
            />
          </div>
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="displayName"
              type="text"
              placeholder="Your display name"
              className="pl-10"
              {...register('displayName')}
            />
          </div>
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-1 bg-gray-200 rounded">
                  <div 
                    className={`h-full rounded transition-all ${passwordStrength.color}`}
                    style={{ width: password.length >= 8 ? '100%' : `${(password.length / 8) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 capitalize">
                  {passwordStrength.strength}
                </span>
              </div>
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className="pl-10 pr-10"
              {...register('confirmPassword')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full text-white"
          style={{ 
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
            border: 'none'
          }}
          disabled={!isValid || loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <button
          onClick={onSwitchToLogin}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}