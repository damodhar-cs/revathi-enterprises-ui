import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Input, PasswordInput } from '../components/Input'
import { LoginFormData } from '../types'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  // Check for session expired message
  const searchParams = new URLSearchParams(window.location.search)
  const sessionMessage = searchParams.get('message')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Revathi Enterprises
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
          
          {sessionMessage === 'session_expired' && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Your session has expired. Please login again.
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="Enter your email"
              error={errors.email?.message}
              noMargin
              isRequired
            />
            <PasswordInput
              {...register('password')}
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              noMargin
              isRequired
            />
          </div>


          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">
                {error}
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Forgot your password? Reset it from your profile after logging in.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
