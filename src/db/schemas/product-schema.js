import { Schema } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'categories',
      required: true
    },
    image: {
      type: String,
      required: false
    },
    briefDesc: {
      type: String,
      required: true
    },
    fullDesc: {
      type: String,
      required: true
    },
    manufacturer: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: false,
      default: 50
    },
    keyword: {
      type: [String],
      required: true
    }
  },
  {
    collection: 'products',
    timestamps: true,
  }
);

export { ProductSchema };
