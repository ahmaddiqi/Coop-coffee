import React, { useState, useEffect, useCallback } from 'react'
import OfflineSyncStatus from '../OfflineSyncStatus'
import api from '@/lib/axios'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserData {
  nama_lengkap: string;
  role: string;
  koperasi_id: number | null;
}

interface KoperasiData {
  nama_koperasi: string;
  provinsi: string;
}

interface HeaderProps {
  className?: string
  title?: string
  subtitle?: string
  onMenuToggle?: () => void
  isSidebarCollapsed?: boolean
}

export function Header({ 
  title = "Dashboard", 
  subtitle,
  onMenuToggle
}: HeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [koperasiData, setKoperasiData] = useState<KoperasiData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get('/users/me')
      const user = response.data
      setUserData(user)
      
      // Fetch koperasi data if user has koperasi_id
      if (user.koperasi_id) {
        const koperasiResponse = await api.get(`/koperasi/${user.koperasi_id}`)
        setKoperasiData(koperasiResponse.data)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // Fallback to localStorage if API fails
      setUserData({
        nama_lengkap: localStorage.getItem('name') || 'Admin User',
        role: localStorage.getItem('role') || 'ADMIN',
        koperasi_id: null
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Generate dynamic subtitle if not provided
  const dynamicSubtitle = subtitle || 
    (koperasiData 
      ? `Ringkasan operasional ${koperasiData.nama_koperasi}` 
      : "Ringkasan operasional sistem koperasi")

  const displayName = userData?.nama_lengkap || 'Loading...'
  const displayRole = userData?.role || 'USER'
  const displayOrganization = koperasiData?.nama_koperasi || 'Sistem Koperasi Kopi'
  const { toast } = useToast()

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('role')
    localStorage.removeItem('user_id')
    
    toast({
      title: "Logout berhasil",
      description: "Anda telah keluar dari sistem",
    })
    
    // Redirect to login page
    window.location.href = '/'
  }
  
  return (
    <div className="sticky top-0 z-10 bg-krem-kartu border-b border-neutral-200/50 shadow-sm">
      <header className="h-20 flex items-center justify-between px-4 md:px-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-kopi-pekat font-display truncate">{title}</h1>
          <p className="text-xs md:text-sm text-kopi-pekat/60 truncate">{dynamicSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 md:space-x-3 hover:bg-aksen-oranye/10 rounded-xl p-2 transition-colors h-auto">
                <div className="h-11 w-11 bg-aksen-oranye text-krem-muda rounded-xl flex items-center justify-center font-semibold shadow-coffee">
                  {loading ? '...' : displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-semibold text-sm text-kopi-pekat">
                    {loading ? 'Loading...' : displayName}
                  </p>
                  <p className="text-xs text-kopi-pekat/60">
                    {loading ? 'Loading...' : displayOrganization}
                  </p>
                </div>
                <svg className="w-4 h-4 text-kopi-pekat/60 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="font-semibold text-kopi-pekat">{displayName}</p>
                <p className="text-sm text-kopi-pekat/60">{displayRole}</p>
                <p className="text-xs text-kopi-pekat/50">{displayOrganization}</p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil Saya
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-700 focus:text-red-800 focus:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Offline Sync Status */}
      <div className="px-4 md:px-8 pb-3">
        <OfflineSyncStatus />
      </div>
    </div>
  )
}