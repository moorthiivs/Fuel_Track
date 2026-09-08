import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MobileLayout } from '../layouts/MobileLayout'
import { Dashboard } from '../pages/Dashboard'
import { AddFuel } from '../pages/AddFuel'
import { CaptureMeter } from '../pages/CaptureMeter'
import { Processing } from '../pages/Processing'
import { CaptureVehicle } from '../pages/CaptureVehicle'
import { ReviewFuel } from '../pages/ReviewFuel'
import { FuelHistory } from '../pages/FuelHistory'
import { FuelDetails } from '../pages/FuelDetails'
import { Analytics } from '../pages/Analytics'
import { Profile } from '../pages/Profile'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MobileLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'add-fuel', element: <AddFuel /> },
      { path: 'add-fuel/meter', element: <CaptureMeter /> },
      { path: 'add-fuel/processing', element: <Processing /> },
      { path: 'add-fuel/vehicle', element: <CaptureVehicle /> },
      { path: 'add-fuel/review', element: <ReviewFuel /> },
      { path: 'history', element: <FuelHistory /> },
      { path: 'history/:id', element: <FuelDetails /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
