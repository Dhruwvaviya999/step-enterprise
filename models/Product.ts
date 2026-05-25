import mongoose, { Schema, models, model } from "mongoose";

const inventorySchema = new Schema(
  {
    location: {
      type: String,
      enum: ["Shop", "Godown"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    size: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
    },
    inventory: [inventorySchema],
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: String,
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Sports", "Casual", "Formal", "Sneakers", "Sandals"],
      required: true,
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Kids", "Unisex"],
    },
    material: String,
    price: {
      type: Number,
      required: true,
    },
    discount_price: Number,
    cost_price: Number,
    gst_percentage: {
      type: Number,
      default: 18,
    },
    total_stock: {
      type: Number,
      default: 0,
    },
    minimum_stock_alert: {
      type: Number,
      default: 5,
    },
    thumbnail: String,
    images: [String],
    variants: [variantSchema],
    tags: [String],
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next: any) {
  this.total_stock = this.variants.reduce((total: number, variant: any) => {
    const variantTotal = variant.inventory.reduce(
      (sum: number, inv: any) => sum + inv.quantity,
      0
    );
    return total + variantTotal;
  }, 0);

  next();
});

export const Product =
  models.Product || model("Product", productSchema);