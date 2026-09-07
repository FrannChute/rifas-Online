export const bolivarPrizePhotoUrls: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1702255489644-392758161f1f?auto=format&fit=crop&w=1200&q=80",
  2: "https://images.unsplash.com/photo-1744551154623-4b5336e95c28?auto=format&fit=crop&w=1200&q=80",
  3: "https://images.unsplash.com/photo-1686671805337-7d8aa64b965f?auto=format&fit=crop&w=1200&q=80",
  4: "https://images.unsplash.com/photo-1686671805337-7d8aa64b965f?auto=format&fit=crop&w=1200&q=80",
  5: "https://images.unsplash.com/photo-1686671805337-7d8aa64b965f?auto=format&fit=crop&w=1200&q=80",
  6: "https://commons.wikimedia.org/wiki/Special:FilePath/Table%20setting-01.jpg",
  7: "https://images.unsplash.com/photo-1764680200170-6b0203ead893?auto=format&fit=crop&w=1200&q=80",
  8: "https://images.unsplash.com/photo-1764680200170-6b0203ead893?auto=format&fit=crop&w=1200&q=80",
  9: "https://tn.com.ar/resizer/v2/como-jugar-gratis-al-padel-en-lomas-de-zamora-foto-instagram-municipioldz-UGSHQCKJK5FP5IQI2IAZV3Y6EU.jpg?auth=0985d16b92868d57e237911394e1b44b2ad6fe312b445d99ab30c41207298806&width=767",
  10: "https://tn.com.ar/resizer/v2/como-jugar-gratis-al-padel-en-lomas-de-zamora-foto-instagram-municipioldz-UGSHQCKJK5FP5IQI2IAZV3Y6EU.jpg?auth=0985d16b92868d57e237911394e1b44b2ad6fe312b445d99ab30c41207298806&width=767",
  11: "https://tn.com.ar/resizer/v2/como-jugar-gratis-al-padel-en-lomas-de-zamora-foto-instagram-municipioldz-UGSHQCKJK5FP5IQI2IAZV3Y6EU.jpg?auth=0985d16b92868d57e237911394e1b44b2ad6fe312b445d99ab30c41207298806&width=767",
  12: "https://media.veepee.com/v1/media/aca52b3d-ba9c-434a-8e39-b9c8ce13c3ca",
  13: "https://images.unsplash.com/photo-1529942458412-eda69f76291d?auto=format&fit=crop&w=1200&q=80",
  14: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1200&q=80",
  15: "https://commons.wikimedia.org/wiki/Special:FilePath/Cleaning%20Products01.jpg",
  16: "https://commons.wikimedia.org/wiki/Special:FilePath/Mahogany%20teakwood%20scented%20candle%20%28cropped%29.jpg",
  17: "https://commons.wikimedia.org/wiki/Special:FilePath/Table%20setting-01.jpg",
  18: "https://commons.wikimedia.org/wiki/Special:FilePath/Salad%20of%20boiled%20eggs%2C%20potatoes%2C%20and%20peas%2C%20served%20cold%20with%20tomatoes%2C%20vinegar%20carrot%2C%20olive%20oil%2C%20black%20pepper%2C%20and%20garlic%20sea%20salt%20-%20Massachusetts.jpg",
  19: "https://commons.wikimedia.org/wiki/Special:FilePath/Salad%20of%20boiled%20eggs%2C%20potatoes%2C%20and%20peas%2C%20served%20cold%20with%20tomatoes%2C%20vinegar%20carrot%2C%20olive%20oil%2C%20black%20pepper%2C%20and%20garlic%20sea%20salt%20-%20Massachusetts.jpg",
  20: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=80",
  21: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
  22: "https://images.unsplash.com/photo-1687795097254-f019f9d7fd17?auto=format&fit=crop&w=1200&q=80",
};

export function getBolivarPrizePhotoUrl(position: number) {
  return bolivarPrizePhotoUrls[position] ?? null;
}
