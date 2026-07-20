import { ProductCategory } from '../types';

export const SOUTH_AFRICAN_LOCATIONS = [
  'Sandton, Johannesburg',
  'Soweto, Johannesburg',
  'Green Point, Cape Town',
  'Stellenbosch, Western Cape',
  'Rosebank, Johannesburg',
  'Umhlanga, Durban',
  'Hatfield, Pretoria',
  'Khayelitsha, Cape Town',
  'Rondebosch, Cape Town',
  'Mamelodi, Pretoria'
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'crafts', name: 'Handmade Crafts', icon: 'Gift', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'food', name: 'Artisanal Food', icon: 'UtensilsCrossed', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'apparel', name: 'Clothing & Fashion', icon: 'Shirt', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'home', name: 'Home & Decor', icon: 'Home', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'tech', name: 'Electronics & Gear', icon: 'Cpu', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
];
