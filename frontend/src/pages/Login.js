import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content d-flex justify-center align-center" style={{minHeight: '100vh', background: 'var(--farm-gradient)'}}>
      <div className="card" style={{maxWidth: '400px', width: '100%'}}>
        <div className="text-center mb-4">
          <span className="emoji" style={{fontSize: '4rem'}}>🐄</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your Farm Breed AI account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">
              <span className="emoji">📧</span>
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <span className="text-danger">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="emoji">🔒</span>
              Password
            </label>
            <div className="d-flex align-center">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              <button
                type="button"
                className="btn btn-outline ml-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="emoji">{showPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>
            {errors.password && (
              <span className="text-danger">{errors.password.message}</span>
            )}
          </div>

          <div className="d-flex justify-between align-center mb-4">
            <label className="d-flex align-center">
              <input type="checkbox" {...register('rememberMe')} className="mr-2" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-primary">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span className="emoji">🚪</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;



