import mongoose, { Model, Schema } from 'mongoose'

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'] as const
export const TRANSMISSIONS = ['Manual', 'Automatic'] as const

export interface Product {
  name: string
  description: string
  img: string
  price: number
  brand: string
  model: string
  year: number
  kilometers: number
  fuelType: (typeof FUEL_TYPES)[number]
  transmission: (typeof TRANSMISSIONS)[number]
  powerHp: number
  bodyType: string
  color: string
  doors: number
  seats: number
  numberOfOwners: number
  accidentFree: boolean
  used: boolean
}

const ProductSchema = new Schema<Product>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
  },
  kilometers: {
    type: Number,
    required: true,
    min: 0,
  },
  fuelType: {
    type: String,
    required: true,
    enum: FUEL_TYPES,
  },
  transmission: {
    type: String,
    required: true,
    enum: TRANSMISSIONS,
  },
  powerHp: {
    type: Number,
    required: true,
    min: 0,
  },
  bodyType: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  doors: {
    type: Number,
    required: true,
    min: 1,
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
  },
  numberOfOwners: {
    type: Number,
    required: true,
    min: 0,
  },
  accidentFree: {
    type: Boolean,
    required: true,
  },
  used: {
    type: Boolean,
    required: true,
  },
})

export default (mongoose.models.Product as Model<Product>) ||
  mongoose.model<Product>('Product', ProductSchema)
