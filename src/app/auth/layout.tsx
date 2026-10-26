import React from 'react'

// No navbar, header or footer: this layout is NOT part of (sections)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center px-6'>
      {children}
    </div>
  )
}
