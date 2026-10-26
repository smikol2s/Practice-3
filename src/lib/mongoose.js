import mongoose from 'mongoose'

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.local')
    }

    cached.promise = mongoose.connect(uri).then((mongoose) => {
      return mongoose
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
