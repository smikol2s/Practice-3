import { redirect } from 'next/navigation'
import ItemsTable from '@/components/ItemsTable'
import PageTitle from '@/components/PageTitle'
import PurchaseForm from '@/components/PurchaseForm'
import { getSession } from '@/lib/auth'
import { getCart } from '@/lib/handlers'

export default async function Checkout() {
  const session = await getSession()
  if (!session) {
    redirect('/auth/signin')
  }

  const cart = await getCart(session.userId)
  if (!cart) {
    redirect('/auth/signin')
  }

  const items = cart.cartItems
    .filter((cartItem) => cartItem.product)
    .map((cartItem) => ({
      product: cartItem.product,
      qty: cartItem.qty,
      price: cartItem.product.price,
    }))

  return (
    <div className='flex flex-col'>
      <PageTitle>Checkout</PageTitle>
      {items.length === 0 ? (
        <div className='text-center'>
          <span className='text-sm text-gray-400'>
            The cart is empty, there is nothing to purchase
          </span>
        </div>
      ) : (
        <>
          <ItemsTable items={items} />
          <PurchaseForm />
        </>
      )}
    </div>
  )
}
