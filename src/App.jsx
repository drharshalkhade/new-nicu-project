import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common-components/ProtectedRoute'
import SignIn from './components/pages/SignIn'
import Layout from './components/layout/Layout'
import SupabaseDashboard from './components/pages/SupabaseDashboard'
import AuditSelection from './components/pages/AuditSelection'
import Education from './components/pages/Education'
import Reports from './components/pages/Reports'
import Users from './components/pages/users'
import Settings from './components/pages/Settings'
import HandHygieneForm from './components/AuditForm/HandHygieneForm'
import HandWashForm from './components/AuditForm/HandWashForm'
import CLABSIForm from './components/AuditForm/CLABSIForm'
import NIVForm from './components/AuditForm/NIVForm'
import VAPForm from './components/AuditForm/VAPForm'
import DisinfectionForm from './components/AuditForm/DisinfectionForm'
//new Build

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        
        {/* Public Routes (no Navbar) */}
        <Route path="/sign-in" element={<SignIn />} />

        {/* Protected Routes with Navbar */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<SupabaseDashboard />} />
          <Route path="/audit" element={<AuditSelection />} />
            <Route path="/audit/hand-hygiene" element={<HandHygieneForm />} />
            <Route path="/audit/hand-wash" element={<HandWashForm />} />
            <Route path="/audit/clabsi" element={<CLABSIForm />} />
            <Route path="/audit/niv" element={<NIVForm />} />
            <Route path="/audit/vap" element={<VAPForm />} />
            <Route path="/audit/disinfection" element={<DisinfectionForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="/education" element={<Education />} />
            <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all to redirect unknown routes */}
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </Router>
  )
}

export default App
