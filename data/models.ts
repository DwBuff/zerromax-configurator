export type OptionValue = {
  label: string;
  price: number;
};

export type OptionGroup = {
  default: string;
  values: Record<string, OptionValue>;
};

export type DependencyRule = {
  category: string;
  hideIf: string[];
};

export type Subcategory = {
  id: string;
  name: string;
  options: OptionGroup;
  dependsOn?: DependencyRule;
};

export type Category =
  | {
      id: string;
      name: string;
      options: OptionGroup;
    }
  | {
      id: string;
      name: string;
      subcategories: Subcategory[];
    };

export type ModelDefinition = {
  id: string;
  name: string;
  dimensions: string;
  grossArea: string;
  height: {
    default: string;
    kneeWall100: string;
  };
  glb: string;
  basePrice: number;
  categories: Category[];
};

const wood36Categories: Category[] = [
  {
    id: "floor_construction",
    name: "Floor Construction",
    options: {
      default: "wood",
      values: {
        wood: { label: "Wood", price: 0 },
        magnelis: { label: "Magnelis metal", price: 0 },
      },
    },
  },
  {
    id: "construction",
    name: "Construction",
    options: {
      default: "wood",
      values: {
        wood: { label: "Wood", price: 0 },
        magnelis: { label: "Magnelis metal", price: 0 },
      },
    },
  },
  {
    id: "exterior",
    name: "Exterior",
    subcategories: [
      {
        id: "facade",
        name: "Facade",
        options: {
          default: "wood",
          values: {
            wood: { label: "Vilo - Wood", price: 0 },
            plaster: { label: "Contact facade plaster 1.5mm", price: 0 },
            larch: { label: "Facade cladding Larch", price: 0 },
          },
        },
      },
      {
        id: "exterior_door",
        name: "Exterior Door",
        options: {
          default: "normal",
          values: {
            normal: { label: "Normal", price: 0 },
            balcony: { label: "Balcony", price: 0 },
          },
        },
      },
      {
        id: "terrace",
        name: "Canopy",
        options: {
          default: "70",
          values: {
            none: { label: "No canopy", price: 0 },
            "70": { label: "70 cm", price: 0 },
          },
        },
      },
      {
        id: "terrace_floor",
        name: "Terrace Floor",
        dependsOn: {
          category: "terrace",
          hideIf: ["none"],
        },
        options: {
          default: "spruce",
          values: {
            spruce: { label: "Wooden cladding (spruce)", price: 0 },
            wpc: { label: "Wooden cladding (WPC)", price: 0 },
            tropical: { label: "Wooden cladding (tropical wood)", price: 0 },
          },
        },
      },
      {
        id: "windows_type",
        name: "Window Type",
        options: {
          default: "fixed",
          values: {
            fixed: { label: "Fixed windows", price: 0 },
            door_quarter: { label: "1/4 Door", price: 0 },
            sliding_quarter: { label: "1/4 Sliding Door", price: 0 },
            sliding_half: { label: "1/2 Sliding Door", price: 0 },
          },
        },
      },
      {
        id: "windows_color",
        name: "Window Color",
        options: {
          default: "white",
          values: {
            white: { label: "White", price: 0 },
            anthracite: { label: "Anthracite", price: 0 },
            mixed: { label: "White inside / Anthracite outside", price: 0 },
          },
        },
      },
      {
        id: "roof_type",
        name: "Roof Type",
        options: {
          default: "sheet",
          values: {
            sheet: { label: "Sheet metals", price: 0 },
            tile: { label: "Roof tile imitation", price: 0 },
          },
        },
      },
      {
        id: "roof_color",
        name: "Roof Color",
        options: {
          default: "anthracite",
          values: {
            anthracite: { label: "Anthracite", price: 0 },
            black: { label: "Black", price: 0 },
            white: { label: "White", price: 0 },
            brown: { label: "Brown", price: 0 },
          },
        },
      },
      {
        id: "knee_wall",
        name: "Knee Wall",
        options: {
          default: "80",
          values: {
            "80": { label: "80 cm", price: 0 },
            "100": { label: "100 cm", price: 0 },
          },
        },
      },
      {
        id: "extra_insulation",
        name: "Extra Insulation",
        options: {
          default: "none",
          values: {
            none: { label: "No extra insulation", price: 0 },
            eps100: { label: "Additional insulation 100mm EPS", price: 0 },
          },
        },
      },
    ],
  },
  {
    id: "interior",
    name: "Interior",
    subcategories: [
      {
        id: "bathroom",
        name: "Bathroom Equipment",
        options: {
          default: "none",
          values: {
            none: { label: "No bathroom", price: 0 },
            basic: { label: "Basic", price: 0 },
            lux: { label: "LUX", price: 0 },
          },
        },
      },
      {
        id: "bathroom_walls",
        name: "Bathroom Walls",
        options: {
          default: "white",
          values: {
            white: { label: "PVC white", price: 0 },
            gray: { label: "PVC gray", price: 0 },
          },
        },
      },
      {
        id: "staircase",
        name: "Staircase",
        options: {
          default: "basic",
          values: {
            basic: { label: "Basic", price: 0 },
            hi: { label: "HI", price: 0 },
          },
        },
      },
      {
        id: "interior_wall",
        name: "Interior Wall",
        options: {
          default: "plywood",
          values: {
            plywood: { label: "Plywood", price: 0 },
            cladding: { label: "Wall cladding", price: 0 },
          },
        },
      },
      {
        id: "floor_cladding",
        name: "Floor Cladding",
        options: {
          default: "laminate",
          values: {
            laminate: { label: "Laminate", price: 0 },
            vinyl: { label: "Vinyl", price: 0 },
          },
        },
      },
      {
        id: "mansard",
        name: "Mansard",
        options: {
          default: "half",
          values: {
            half: { label: "Half", price: 0 },
            full: { label: "Full", price: 0 },
          },
        },
      },
    ],
  },
  {
    id: "equipment",
    name: "Equipment",
    options: {
      default: "none",
      values: {
        none: { label: "No boiler", price: 0 },
        boiler_50: { label: "Boiler 50L", price: 0 },
        boiler_80: { label: "Boiler 80L", price: 0 },
      },
    },
  },
];

const wood50Categories: Category[] = [
  ...wood36Categories,
];

const createModel = (
  id: string,
  name: string,
  dimensions: string,
  grossArea: string,
  basePrice: number,
  glb: string,
  categories: Category[]
): ModelDefinition => ({
  id,
  name,
  dimensions,
  grossArea,
  height: {
    default: "4.8 m",
    kneeWall100: "5.0 m",
  },
  glb,
  basePrice,
  categories,
});

export const models = {
  wood36: createModel("wood36", "Wood 36", "6m × 4m", "36 m²", 17900, "/models/wood36.glb", wood36Categories),
  wood50: createModel("wood50", "Wood 50", "8,3m × 5m", "50 m²", 0, "/models/wood50.glb", wood50Categories),

  wood80: createModel("wood80", "Wood 80", "10m × 8m", "80 m²", 0, "/models/wood80.glb", []),
  zen30: createModel("zen30", "Zen 30", "10m × 3m", "30 m²", 0, "/models/zen30.glb", []),
  zen44: createModel("zen44", "Zen 44", "11m × 4m", "44 m²", 0, "/models/zen44.glb", []),
  zen66: createModel("zen66", "Zen 66", "11m × 6m", "66 m²", 0, "/models/zen66.glb", []),
  mobile24: createModel("mobile24", "Mobile 24", "8m × 3m", "24 m²", 0, "/models/mobile24.glb", []),
} satisfies Record<string, ModelDefinition>;

export type ModelKey = keyof typeof models;