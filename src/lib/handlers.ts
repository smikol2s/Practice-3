import bcrypt from 'bcrypt'
import { Types } from 'mongoose'
import { connect } from '@/lib/mongoose'
import Products, { Product } from '@/models/Product'
import Users, { User } from '@/models/User'
import Orders, { Order } from '@/models/Order'

type WithId<T> = T & { _id: Types.ObjectId }

export interface ErrorResponse {
  error: string
  message: string
}

export interface GetProductsResponse {
  products: WithId<Product>[]
}

export type GetProductResponse = WithId<Product>

export interface CreateUserResponse {
  _id: Types.ObjectId
}

export interface CheckCredentialsResponse {
  _id: Types.ObjectId
}

export interface GetUserResponse extends Pick<
  User,
  'email' | 'name' | 'surname' | 'address' | 'birthdate'
> {
  _id: Types.ObjectId
}

export interface PopulatedCartItem {
  product: WithId<Product>
  qty: number
}

export interface GetCartResponse {
  cartItems: PopulatedCartItem[]
}

export interface PutCartItemResponse extends GetCartResponse {
  created: boolean // true -> new entry (HTTP 201), false -> updated (HTTP 200)
}

export interface GetOrdersResponse {
  orders: WithId<Order>[]
}

export interface PopulatedOrderItem {
  product: WithId<Product>
  qty: number
  price: number
}

export interface GetOrderResponse extends Omit<WithId<Order>, 'orderItems'> {
  orderItems: PopulatedOrderItem[]
}

export interface CreateOrderResponse {
  _id: Types.ObjectId
}

// Tells the route which of the IDs did not match any document
export type NotFound =
  'USER_NOT_FOUND' | 'PRODUCT_NOT_FOUND' | 'ORDER_NOT_FOUND'

export const NOT_FOUND_MESSAGES: Record<NotFound, string> = {
  USER_NOT_FOUND: 'User not found.',
  PRODUCT_NOT_FOUND: 'Product not found.',
  ORDER_NOT_FOUND: 'Order not found.',
}

export async function getProducts(): Promise<GetProductsResponse> {
  await connect()

  const products = await Products.find({}, { __v: false })

  return { products }
}

export async function getProduct(
  productId: Types.ObjectId | string
): Promise<GetProductResponse | null> {
  await connect()

  return Products.findById(productId, { __v: false })
}

/** Returns null if a user with the same e-mail already exists. */
export async function createUser(user: {
  email: string
  password: string
  name: string
  surname: string
  address: string
  birthdate: string | Date
}): Promise<CreateUserResponse | null> {
  await connect()

  const prevUser = await Users.findOne({ email: user.email }, { _id: true })
  if (prevUser) {
    return null
  }

  // Never store the plain-text password: store its bcrypt hash
  const hash = await bcrypt.hash(user.password, 10)

  const doc: User = {
    email: user.email,
    password: hash,
    name: user.name,
    surname: user.surname,
    address: user.address,
    birthdate: new Date(user.birthdate),
    cartItems: [],
    orders: [],
  }

  try {
    const newUser = await Users.create(doc)
    return { _id: newUser._id }
  } catch (e) {
    // Duplicate key (race condition on the unique e-mail index)
    if ((e as { code?: number }).code === 11000) {
      return null
    }
    throw e
  }
}

/**
 * Returns the ID of the user if the e-mail exists and the password matches.
 * Returns null otherwise (the caller cannot tell which of both was wrong).
 */
export async function checkCredentials(
  email: string,
  password: string
): Promise<CheckCredentialsResponse | null> {
  await connect()

  const user = await Users.findOne({ email }, { _id: true, password: true })
  if (!user) {
    return null
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return null
  }

  return { _id: user._id }
}

export async function getUser(
  userId: Types.ObjectId | string
): Promise<GetUserResponse | null> {
  await connect()

  const userProjection = {
    email: true,
    name: true,
    surname: true,
    address: true,
    birthdate: true,
  }

  return Users.findById(userId, userProjection)
}

/** Returns null if the user does not exist. */
export async function getCart(
  userId: Types.ObjectId | string
): Promise<GetCartResponse | null> {
  await connect()

  const user = await Users.findById(userId, { cartItems: true }).populate(
    'cartItems.product',
    { __v: false }
  )

  if (!user) {
    return null
  }

  return {
    cartItems: user.cartItems as unknown as PopulatedCartItem[],
  }
}

/** Sets the quantity of a product in the cart (creating the entry if needed). */
export async function putCartItem(
  userId: Types.ObjectId | string,
  productId: Types.ObjectId | string,
  qty: number
): Promise<PutCartItemResponse | NotFound> {
  await connect()

  const user = await Users.exists({ _id: userId })
  if (!user) {
    return 'USER_NOT_FOUND'
  }

  const product = await Products.exists({ _id: productId })
  if (!product) {
    return 'PRODUCT_NOT_FOUND'
  }

  // 1) Try to update an existing cart item
  const updated = await Users.updateOne(
    { _id: userId, 'cartItems.product': productId },
    { $set: { 'cartItems.$.qty': qty } }
  )

  // 2) Otherwise, create a new cart item
  const created = updated.matchedCount === 0
  if (created) {
    await Users.updateOne(
      { _id: userId },
      { $push: { cartItems: { product: productId, qty } } }
    )
  }

  const cart = await getCart(userId)
  if (!cart) {
    return 'USER_NOT_FOUND'
  }

  return { ...cart, created }
}

/** Removes a product from the cart (no-op if it was not in the cart). */
export async function deleteCartItem(
  userId: Types.ObjectId | string,
  productId: Types.ObjectId | string
): Promise<GetCartResponse | NotFound> {
  await connect()

  const user = await Users.exists({ _id: userId })
  if (!user) {
    return 'USER_NOT_FOUND'
  }

  const product = await Products.exists({ _id: productId })
  if (!product) {
    return 'PRODUCT_NOT_FOUND'
  }

  await Users.updateOne(
    { _id: userId },
    { $pull: { cartItems: { product: productId } } }
  )

  return (await getCart(userId)) ?? 'USER_NOT_FOUND'
}

/** Returns null if the user does not exist. */
export async function getOrders(
  userId: Types.ObjectId | string
): Promise<GetOrdersResponse | null> {
  await connect()

  const user = await Users.findById(userId, { orders: true }).populate(
    'orders',
    { __v: false }
  )

  if (!user) {
    return null
  }

  return { orders: user.orders as unknown as WithId<Order>[] }
}

/** An order that exists but belongs to another user counts as not found. */
export async function getOrder(
  userId: Types.ObjectId | string,
  orderId: Types.ObjectId | string
): Promise<GetOrderResponse | NotFound> {
  await connect()

  const user = await Users.findById(userId, { orders: true })
  if (!user) {
    return 'USER_NOT_FOUND'
  }

  if (!user.orders.some((id) => id.equals(orderId))) {
    return 'ORDER_NOT_FOUND'
  }

  const order = await Orders.findById(orderId, { __v: false }).populate(
    'orderItems.product',
    { __v: false }
  )
  if (!order) {
    return 'ORDER_NOT_FOUND'
  }

  return order as unknown as GetOrderResponse
}

export type CreateOrderResult = CreateOrderResponse | NotFound | 'EMPTY_CART'

/** Turns the cart of the user into an order and empties the cart. */
export async function createOrder(
  userId: Types.ObjectId | string,
  data: { address: string; cardHolder: string; cardNumber: string }
): Promise<CreateOrderResult> {
  await connect()

  const user = await Users.findById(userId, { cartItems: true })
  if (!user) {
    return 'USER_NOT_FOUND'
  }

  // Current price of every product in the cart
  const products = await Products.find({
    _id: { $in: user.cartItems.map((item) => item.product) },
  })
  const priceById = new Map(products.map((p) => [p._id.toString(), p.price]))

  const orderItems = user.cartItems
    .filter((item) => priceById.has(item.product.toString()))
    .map((item) => ({
      product: item.product,
      qty: item.qty,
      price: priceById.get(item.product.toString()) as number,
    }))

  if (orderItems.length === 0) {
    return 'EMPTY_CART'
  }

  const order = await Orders.create({
    address: data.address,
    date: new Date(),
    cardHolder: data.cardHolder,
    cardNumber: data.cardNumber,
    orderItems,
  })

  // Register the order and empty the cart
  await Users.updateOne(
    { _id: userId },
    { $push: { orders: order._id }, $set: { cartItems: [] } }
  )

  return { _id: order._id }
}
