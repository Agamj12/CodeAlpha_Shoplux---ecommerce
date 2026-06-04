const mongoose = require('mongoose');

// Counter Schema for generating sequential IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}

const transformOptions = {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  }
};

// 1. User Schema
const userSchema = new mongoose.Schema({
  _id: { type: Number },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar: { type: String },
  created_at: { type: Date, default: Date.now }
}, transformOptions);

userSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('userId');
  }
  next();
});

// 2. Category Schema
const categorySchema = new mongoose.Schema({
  _id: { type: Number },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String, default: '📦' }
}, transformOptions);

categorySchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('categoryId');
  }
  next();
});

// 3. Product Schema
const productSchema = new mongoose.Schema({
  _id: { type: Number },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  original_price: { type: Number },
  category_id: { type: Number, ref: 'Category' },
  stock: { type: Number, default: 0 },
  image: { type: String },
  rating: { type: Number, default: 0 },
  reviews_count: { type: Number, default: 0 },
  featured: { type: Number, default: 0 }, // 0 or 1 to match SQLite
  created_at: { type: Date, default: Date.now }
}, transformOptions);

productSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('productId');
  }
  next();
});

// 4. CartItem Schema
const cartItemSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User', required: true },
  product_id: { type: Number, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
}, transformOptions);

// Ensure compound unique index for user_id and product_id
cartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

cartItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('cartItemId');
  }
  next();
});

// 5. Order Schema
const orderSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User', required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shipping_address: { type: String }, // Stringified JSON to match SQLite
  payment_method: { type: String, default: 'card' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, transformOptions);

orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('orderId');
  }
  next();
});

// 6. OrderItem Schema
const orderItemSchema = new mongoose.Schema({
  _id: { type: Number },
  order_id: { type: Number, ref: 'Order', required: true },
  product_id: { type: Number, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
}, transformOptions);

orderItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('orderItemId');
  }
  next();
});

// 7. Review Schema
const reviewSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User', required: true },
  product_id: { type: Number, ref: 'Product', required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
  created_at: { type: Date, default: Date.now }
}, transformOptions);

reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await getNextSequenceValue('reviewId');
  }
  next();
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  Counter,
  User,
  Category,
  Product,
  CartItem,
  Order,
  OrderItem,
  Review
};
