
import {- 
import { 공개_콘텐츠_목록 } from "./content";
import { DiscoveryItem, DiscoverySearchFilters } from "./definitions";

const applyFilters = (
  items: DiscoveryItem[],
  filters: DiscoverySearchFilters
) => {
  return items.filter((item) => {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }
    if (filters.type && filters.type !== "all") {
      if (item.type !== filters.type) {
        return false;
      }
    }
    return true;
  });
};

export const searchCatalogue = async (
  filters: DiscoverySearchFilters
): Promise<DiscoveryItem[]> => {
  const items = await 공개_콘텐츠_목록();
  const filteredItems = applyFilters(items, filters);
  return filteredItems;
};
