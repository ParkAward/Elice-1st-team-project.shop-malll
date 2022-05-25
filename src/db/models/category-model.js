import { model } from 'mongoose';
import { CategorySchema } from '../schemas/category-schema';

const Category = model('categories', CategorySchema);

export class CategoryModel {

  async findAll() {
    const categories = await Category.find({}).sort({ createdAt : 1 });
    return categories;
  }

  async findById(categoryId) {
    const category = await Category.findById({ _id: categoryId });
    return category;
  }

  async findByName(categoryName) {
    const category = await Category.find({ name: categoryName });
    return category;
  }

  async countCategories() {
    const counts = await Category.countDocuments({})
    return counts;
  }

  async create(categoryId) {
    const createdNew = await Category.create(categoryId);
    return createdNew;
  }

  async update({ categoryId, update }) {
    const filter = { _id: categoryId };
    const option = { returnOriginal: false };

    const updatedCategory = await Category.findOneAndUpdate(filter, update, option);
    return updatedCategory;
  }

  async delete(categoryId) {
    await Category.findOneAndDelete({ _id: categoryId });
    return;
  }

};

const categoryModel = new CategoryModel();

export { categoryModel };