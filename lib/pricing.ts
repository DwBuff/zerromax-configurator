import { models, type ModelKey, type Category, type Subcategory } from "../data/models";

export type ConfigState = Record<string, string>;
export type PriceMap = Record<string, number>;

type FlatGroup = {
  id: string;
  name: string;
  options: {
    default: string;
    values: Record<string, { label: string; price: number }>;
  };
  dependsOn?: {
    category: string;
    hideIf: string[];
  };
};

type BreakdownItem = {
  label: string;
  value: number;
};

function flattenGroups(modelKey: ModelKey): FlatGroup[] {
  const model = models[modelKey];
  const groups: FlatGroup[] = [];

  model.categories.forEach((category: Category) => {
    if ("options" in category) {
      groups.push({
        id: category.id,
        name: category.name,
        options: category.options,
      });
    }

    if ("subcategories" in category) {
      category.subcategories.forEach((subcategory: Subcategory) => {
        groups.push({
          id: subcategory.id,
          name: subcategory.name,
          options: subcategory.options,
          dependsOn: subcategory.dependsOn,
        });
      });
    }
  });

  return groups;
}

function getOptionPrice(
  groupId: string,
  optionKey: string,
  fallbackPrice: number,
  priceMap?: PriceMap
): number {
  if (!priceMap) return fallbackPrice;

  const csvKey = `${groupId}.${optionKey}`;
  const csvPrice = priceMap[csvKey];

  return typeof csvPrice === "number" && !Number.isNaN(csvPrice)
    ? csvPrice
    : fallbackPrice;
}

export function isOptionGroupVisible(
  modelKey: ModelKey,
  config: ConfigState,
  groupId: string
): boolean {
  const groups = flattenGroups(modelKey);
  const group = groups.find((g) => g.id === groupId);

  if (!group || !group.dependsOn) return true;

  const dependentValue = config[group.dependsOn.category];
  return !group.dependsOn.hideIf.includes(dependentValue);
}

export function calculatePrice(
  modelKey: ModelKey,
  config: ConfigState,
  priceMap?: PriceMap
): number {
  const model = models[modelKey];
  const groups = flattenGroups(modelKey);

  let total = model.basePrice;

  groups.forEach((group) => {
    if (!isOptionGroupVisible(modelKey, config, group.id)) return;

    const selectedKey = config[group.id];
    if (!selectedKey) return;

    const option = group.options.values[selectedKey];
    if (!option) return;

    total += getOptionPrice(group.id, selectedKey, option.price, priceMap);
  });

  return total;
}

export function getBreakdown(
  modelKey: ModelKey,
  config: ConfigState,
  priceMap?: PriceMap
): BreakdownItem[] {
  const model = models[modelKey];
  const groups = flattenGroups(modelKey);

  const breakdown: BreakdownItem[] = [
    { label: "Base", value: model.basePrice },
  ];

  groups.forEach((group) => {
    if (!isOptionGroupVisible(modelKey, config, group.id)) return;

    const selectedKey = config[group.id];
    if (!selectedKey) return;

    const option = group.options.values[selectedKey];
    if (!option) return;

    breakdown.push({
      label: `${group.name} (${option.label})`,
      value: getOptionPrice(group.id, selectedKey, option.price, priceMap),
    });
  });

  return breakdown;
}