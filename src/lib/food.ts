export interface FoodResult {
  id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: 'off' | 'usda';
}

export async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10&fields=code,product_name,brands,nutriments`
    );
    const data = await res.json();
    return (data.products ?? [])
      .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map((p: any): FoodResult => ({
        id: `off_${p.code}`,
        name: p.product_name,
        brand: p.brands || undefined,
        calories_per_100g: p.nutriments['energy-kcal_100g'] ?? 0,
        protein_per_100g: p.nutriments['proteins_100g'] ?? 0,
        carbs_per_100g: p.nutriments['carbohydrates_100g'] ?? 0,
        fat_per_100g: p.nutriments['fat_100g'] ?? 0,
        source: 'off',
      }));
  } catch {
    return [];
  }
}

export async function searchUSDA(query: string): Promise<FoodResult[]> {
  const apiKey = import.meta.env.VITE_USDA_API_KEY ?? 'DEMO_KEY';
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${apiKey}`
    );
    const data = await res.json();
    return (data.foods ?? []).map((f: any): FoodResult => {
      const get = (name: string) => f.foodNutrients?.find((n: any) => n.nutrientName === name)?.value ?? 0;
      return {
        id: `usda_${f.fdcId}`,
        name: f.description,
        brand: f.brandOwner || undefined,
        calories_per_100g: get('Energy'),
        protein_per_100g: get('Protein'),
        carbs_per_100g: get('Carbohydrate, by difference'),
        fat_per_100g: get('Total lipid (fat)'),
        source: 'usda',
      };
    });
  } catch {
    return [];
  }
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  const [off, usda] = await Promise.all([
    searchOpenFoodFacts(query),
    searchUSDA(query),
  ]);
  const seen = new Set<string>();
  return [...off, ...usda].filter(f => {
    const key = f.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
