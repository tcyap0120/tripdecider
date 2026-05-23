'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/login') }, [router])
  return (
    <div className="travel-bg flex items-center justify-center">
      <div className="text-white text-xl font-display animate-pulse-slow">🏝️ Loading...</div>
    </div>
  )
}
