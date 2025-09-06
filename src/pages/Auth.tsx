import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recycle, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword, validateEmail, validateFullName } from '@/utils/validation';
import { PasswordStrength } from '@/components/ui/password-strength';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string[];
    password?: string[];
    fullName?: string[];
  }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register } = useAuth();

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    // Validate full name for registration
    if (!isLogin) {
      const nameValidation = validateFullName(formData.fullName);
      if (!nameValidation.isValid) {
        errors.fullName = nameValidation.errors;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in to EcoBin.',
        });
        navigate('/dashboard');
      } else {
        await register(formData.email, formData.password, formData.fullName);
        toast({
          title: 'Account Created!',
          description: 'Welcome to Smart EcoBin! You are now logged in.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.message.message) {
          errorMessage = error.message.message;
          if (error.message.errors && Array.isArray(error.message.errors)) {
            errorMessage += '\n• ' + error.message.errors.join('\n• ');
          }
        }
      }

      toast({
        title: isLogin ? 'Login Failed' : 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Social login removed for now - can be re-implemented with OAuth providers later

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-eco border-eco-light/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-eco/10 p-3 rounded-full">
              <Recycle className="h-8 w-8 text-eco" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-eco">
            {isLogin ? 'Welcome Back' : 'Join EcoBin'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin ? 'Continue your eco journey' : 'Start making a difference today'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`pl-10 border-eco-light/50 focus:border-eco ${
                      validationErrors.fullName ? 'border-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {validationErrors.fullName && (
                  <div className="space-y-1">
                    {validationErrors.fullName.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`pl-10 border-eco-light/50 focus:border-eco ${
                    validationErrors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {validationErrors.email && (
                <div className="space-y-1">
                  {validationErrors.email.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pl-10 pr-10 border-eco-light/50 focus:border-eco ${
                    validationErrors.password ? 'border-red-500' : ''
                  }`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {!isLogin && formData.password && (
                <PasswordStrength password={formData.password} className="mt-2" />
              )}
              
              {validationErrors.password && (
                <div className="space-y-1">
                  {validationErrors.password.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-eco hover:bg-eco-dark"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-eco hover:text-eco-dark"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;