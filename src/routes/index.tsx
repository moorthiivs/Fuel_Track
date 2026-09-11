/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MobileLayout } from '../layouts/MobileLayout'
import { RouteLoadingFallback } from '../components/common/RouteLoadingFallback'

const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const AddFuel = lazy(() => import('../pages/AddFuel').then((m) => ({ default: m.AddFuel })))
const CaptureMeter = lazy(() => import('../pages/CaptureMeter').then((m) => ({ default: m.CaptureMeter })))
const Processing = lazy(() => import('../pages/Processing').then((m) => ({ default: m.Processing })))
const CaptureVehicle = lazy(() => import('../pages/CaptureVehicle').then((m) => ({ default: m.CaptureVehicle })))
const ReviewFuel = lazy(() => import('../pages/ReviewFuel').then((m) => ({ default: m.ReviewFuel })))
const FuelHistory = lazy(() => import('../pages/FuelHistory').then((m) => ({ default: m.FuelHistory })))
const FuelDetails = lazy(() => import('../pages/FuelDetails').then((m) => ({ default: m.FuelDetails })))
const Analytics = lazy(() => import('../pages/Analytics').then((m) => ({ default: m.Analytics })))
const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MobileLayout />,
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: 'add-fuel', element: withSuspense(AddFuel) },
      { path: 'add-fuel/meter', element: withSuspense(CaptureMeter) },
      { path: 'add-fuel/processing', element: withSuspense(Processing) },
      { path: 'add-fuel/vehicle', element: withSuspense(CaptureVehicle) },
      { path: 'add-fuel/review', element: withSuspense(ReviewFuel) },
      { path: 'history', element: withSuspense(FuelHistory) },
      { path: 'history/:id', element: withSuspense(FuelDetails) },
      { path: 'analytics', element: withSuspense(Analytics) },
      { path: 'profile', element: withSuspense(Profile) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
