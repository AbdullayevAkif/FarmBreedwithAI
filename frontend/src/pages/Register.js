import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Leaf, Mail, Lock, User, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-decoration">
          <Leaf className="decoration-icon" />
        </div>
      </div>
      
      <div className="form-container">
        <div className="form-header">
          <Leaf className="form-logo" />
          <h1 className="form-title">Join FarmBreed AI</h1>
          <p className="form-subtitle">Create your account to start smart breeding</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                First Name
              </label>
              <input
                type="text"
                className={`form-input ${errors.firstName ? 'error' : ''}`}
                placeholder="Enter first name"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
              />
              {errors.firstName && (
                <span className="form-error">{errors.firstName.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Last Name
              </label>
              <input
                type="text"
                className={`form-input ${errors.lastName ? 'error' : ''}`}
                placeholder="Enter last name"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
              />
              {errors.lastName && (
                <span className="form-error">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
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
              <span className="form-error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building size={16} />
              Farm Name
            </label>
            <input
              type="text"
              className={`form-input ${errors.farmName ? 'error' : ''}`}
              placeholder="Enter your farm name"
              {...register('farmName', {
                required: 'Farm name is required',
                minLength: {
                  value: 2,
                  message: 'Farm name must be at least 2 characters'
                }
              })}
            />
            {errors.farmName && (
              <span className="form-error">{errors.farmName.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a password"
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
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Confirm Password
            </label>
            <input
              type="password"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                {...register('acceptTerms', {
                  required: 'You must accept the terms and conditions'
                })}
              />
              <span className="checkmark"></span>
              I accept the terms and conditions
            </label>
            {errors.acceptTerms && (
              <span className="form-error">{errors.acceptTerms.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;