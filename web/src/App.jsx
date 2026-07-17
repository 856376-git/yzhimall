
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state = { err: null } }
  static getDerivedStateFromError(err){ return { err } }
  componentDidCatch(err, info){ console.error('Caught:', err, info) }
  render(){
    if (this.state.err) {
      const e = this.state.err
      return (
        <div style={{padding:'40px',fontFamily:'monospace',color:'#c0392b',background:'#fff5f5',minHeight:'100vh'}}>
          <h2>椤甸潰娓叉煋鍑洪敊</h2>
          <pre style={{whiteSpace:'pre-wrap',background:'#fff',padding:'16px',border:'1px solid #ddd',borderRadius:'4px'}}>
{String(e && (e.stack || e.message || e))}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import Toast from './components/Toast'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AuthPage from './pages/AuthPage'
import OrdersPage from './pages/OrdersPage'
import CheckInPage from './pages/CheckInPage'
import SeckillPage from './pages/SeckillPage'
import CouponsPage from './pages/CouponsPage'
import MerchantLoginPage from './pages/MerchantLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import MerchantLayout from './pages/MerchantLayout'
import MerchantDashboard from './pages/MerchantDashboard'
import MerchantProducts from './pages/MerchantProducts'
import MerchantOrders from './pages/MerchantOrders'

import AdminLayout from './pages/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrders from './pages/AdminOrders'
import AdminUsers from './pages/AdminUsers'
import AdminProducts from './pages/AdminProducts'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Toast />
      <ErrorBoundary>
        <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/seckill" element={<SeckillPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
        </Route>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/merchant/login" element={<MerchantLoginPage />} />
       <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<MerchantLayout />}>
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/products" element={<MerchantProducts />} />
          <Route path="/merchant/orders" element={<MerchantOrders />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </>
  )
}
