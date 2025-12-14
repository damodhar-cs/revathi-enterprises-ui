import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import ProductsPage from './pages/ProductsPage'
import VariantsPage from './pages/VariantsPage'
import ProductVariantsPage from './pages/ProductVariantsPage'
import VariantDetailPage from './pages/VariantDetailPage'
import SalesPage from './pages/SalesPage'
import SaleDetailPage from './pages/SaleDetailPage'
import Dashboard from './pages/Dashboard'
import CustomersPage from './pages/CustomersPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="variants" element={<VariantsPage />} />
              <Route path="variants/:productId" element={<ProductVariantsPage />} />
              <Route path="variant/:variantId" element={<VariantDetailPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="sales/:saleId" element={<SaleDetailPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:phone" element={<CustomerDetailPage />} />
              <Route path="users" element={<Users />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App 