import React, { useState } from 'react'
import { Button, Form, message } from 'antd'
import { Activity, LogIn } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { signInInputs } from '../../constant/input-fields'
import InputField from '../common-components/InputFields'
import { fetchUserDetails } from '../../store/user/userThunk'
import { useDispatch } from 'react-redux'

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const [inputs, setInputs] = useState(
    Object.fromEntries(signInInputs?.map(f => [f.name, '']))
  )
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setInputs(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  const { email, password } = inputs

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  setLoading(false)

  if (error) {
    message.error(error.message)
  } else {
    message.success('Signed in successfully!')
    // The useAuth hook will automatically fetch user details
    navigate('/dashboard')
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">NICU Audit Platform</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <Form layout="vertical" onSubmitCapture={handleSubmit}>
          {signInInputs.map((input) => (
            <InputField
              key={input.name}
              {...input}
              value={inputs[input.name]}
              onChange={handleChange}
              autoComplete={input.name}
            />
          ))}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full mt-4"
            size="large"
            icon={<LogIn size={18} />}
          >
            Sign In
          </Button>
        </Form>
      </div>
    </div>
  )
}
