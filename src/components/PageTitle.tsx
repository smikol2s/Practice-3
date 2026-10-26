import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className='pb-4 text-3xl font-bold text-gray-900 sm:pb-6 lg:pb-8'>
      {children}
    </h2>
  )
}
