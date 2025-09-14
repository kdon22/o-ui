'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Shield, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface UserDevice {
  id: string
  deviceId: string
  name?: string
  type: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN'
  platform?: string
  browser?: string
  ipAddress?: string
  location?: string
  isTrusted: boolean
  trustLevel: number
  isActive: boolean
  firstSeenAt: string
  lastSeenAt: string
  trustedAt?: string
}

const DeviceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'MOBILE':
      return <Smartphone className="w-5 h-5" />
    case 'TABLET':
      return <Tablet className="w-5 h-5" />
    case 'DESKTOP':
      return <Monitor className="w-5 h-5" />
    default:
      return <Monitor className="w-5 h-5" />
  }
}

const TrustBadge = ({ isTrusted, trustLevel }: { isTrusted: boolean; trustLevel: number }) => {
  if (isTrusted) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Trusted
      </Badge>
    )
  }
  
  if (trustLevel > 50) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Partial Trust
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
      <XCircle className="w-3 h-3 mr-1" />
      Untrusted
    </Badge>
  )
}

export default function DevicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated') {
      fetchDevices()
    }
  }, [status, router])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/auth/devices')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch devices')
      }
      
      setDevices(data.devices || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrustDevice = async (deviceId: string) => {
    try {
      const response = await fetch('/api/auth/devices/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to trust device')
      }
      
      await fetchDevices() // Refresh list
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const response = await fetch('/api/auth/devices/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to revoke device')
      }
      
      await fetchDevices() // Refresh list
    } catch (error: any) {
      setError(error.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your devices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Management</h1>
          <p className="text-gray-600">
            Manage the devices that can access your account. Trusted devices won't require additional verification.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid gap-4">
          {devices.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
              <p className="text-gray-600">Your devices will appear here after you sign in from them.</p>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <DeviceIcon type={device.type} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {device.name || `${device.platform || 'Unknown'} Device`}
                        </h3>
                        <TrustBadge isTrusted={device.isTrusted} trustLevel={device.trustLevel} />
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>{device.platform}</span>
                          {device.browser && (
                            <>
                              <span>•</span>
                              <span>{device.browser}</span>
                            </>
                          )}
                        </div>
                        
                        {device.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{device.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Last seen {formatDate(device.lastSeenAt)}</span>
                        </div>
                        
                        {device.ipAddress && (
                          <div className="text-xs text-gray-500">
                            IP: {device.ipAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!device.isTrusted ? (
                      <Button
                        onClick={() => handleTrustDevice(device.deviceId)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Trust Device
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRevokeDevice(device.deviceId)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/login')}
            className="mr-4"
          >
            Back to Login
          </Button>
          <Button onClick={() => window.location.reload()}>
            Refresh Devices
          </Button>
        </div>
      </div>
    </div>
  )
} 