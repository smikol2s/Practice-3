import { ComponentType } from 'react'

interface InfoListProps {
  items: {
    label: string
    value: string
    icon: ComponentType<{ className?: string }>
  }[]
}

/** List of "icon + label: value" rows (profile and order details) */
export default function InfoList({ items }: InfoListProps) {
  return (
    <dl className='space-y-2'>
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className='flex items-start gap-2 text-sm'>
          <Icon className='mt-0.5 h-4 w-4 shrink-0 text-gray-500' />
          <dt className='font-semibold text-gray-900'>{label}:</dt>
          <dd className='min-w-0 break-words text-gray-700'>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
