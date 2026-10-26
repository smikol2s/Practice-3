import mongoose, { Model, Schema, Types } from 'mongoose'

export interface OrderItem {
  product: Types.ObjectId
  qty: number
  price: number
}

export interface Order {
  address: string
  date: Date
  cardHolder: string
  cardNumber: string
  orderItems: OrderItem[]
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const OrderSchema = new Schema<Order>({
  address: { type: String, required: true },
  date: { type: Date, required: true },
  cardHolder: { type: String, required: true },
  cardNumber: { type: String, required: true },
  orderItems: [OrderItemSchema],
})

export default (mongoose.models.Order as Model<Order>) ||
  mongoose.model<Order>('Order', OrderSchema)
