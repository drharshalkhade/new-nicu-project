import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return null // Or a loading spinner if you want

  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  return children
}

export default ProtectedRoute
