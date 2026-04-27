"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

import ModelViewer from "./ModelViewer";
import { models, type ModelKey, type Category, type Subcategory } from "../data/models";
import {
  calculatePrice,
  getBreakdown,
  isOptionGroupVisible,
  type ConfigState,
} from "../lib/pricing";

const loadFont = async (url: string) => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

type OptionValue = {
  label: string;
  price: number;
};

const translations = {
  en: {
    public: "Public",
    commercialist: "Commercialist",
    dimensions: "Dimensions",
    grossArea: "Gross Area",
    height: "Height",
    offerDetails: "Offer Details",
    customerName: "Customer Name",
    offerDate: "Offer Date",
    offerNumber: "Offer Number",
    deliveryAddress: "Delivery Address",
    distance: "Distance (km)",
    shareLink: "Share Link",
    copyFullLink: "Copy Full Link",
    copied: "Copied",
    exportTxt: "Export TXT",
    exportPdf: "Export PDF",
    summary: "Summary",
    showPricingBreakdown: "Show pricing breakdown",
    finalTotal: "Final total",
    exportOffer: "Export Offer",
    requestQuote: "Request Quote",
    included: "Included",
    exterior: "Exterior",
    interior: "Interior",
    bathroom: "Bathroom",
    base: "Base",
    selectedConfiguration: "Selected Configuration",

    notSpecified: "Not specified",
    model: "Model",
    productBreakdown: "Product breakdown",
  },
  sl: {
    public: "Javno",
    commercialist: "Komercialist",
    dimensions: "Dimenzije",
    grossArea: "Bruto površina",
    height: "Višina",
    offerDetails: "Podatki ponudbe",
    customerName: "Ime stranke",
    offerDate: "Datum ponudbe",
    offerNumber: "Številka ponudbe",
    deliveryAddress: "Naslov dostave",
    distance: "Razdalja (km)",
    shareLink: "Povezava",
    copyFullLink: "Kopiraj povezavo",
    copied: "Kopirano",
    exportTxt: "Izvoz TXT",
    exportPdf: "Izvoz PDF",
    summary: "Povzetek",
    showPricingBreakdown: "Prikaži razčlenitev cene",
    finalTotal: "Končna cena",
    exportOffer: "Izvozi ponudbo",
    requestQuote: "Pošlji povpraševanje",
    included: "Vključeno",
    exterior: "Zunanjost",
    interior: "Notranjost",
    bathroom: "Kopalnica",
    base: "Osnova",

    selectedConfiguration: "Izbrana konfiguracija",

    notSpecified: "Ni določeno",
    model: "Model",
    productBreakdown: "Razčlenitev izdelka",
  },
};

const labelTranslations: Record<string, Record<string, string>> = {
  sl: {
    "Floor Construction": "Talna konstrukcija",
    "Construction": "Konstrukcija",
    "Exterior": "Zunanjost",
    "Interior": "Notranjost",
    "Equipment": "Oprema",

    "Facade": "Fasada",
    "Exterior Door": "Zunanja vrata",
    "Canopy": "Nadstrešek",
    "Terrace Floor": "Tlak terase",
    "Window Type": "Tip oken",
    "Window Color": "Barva oken",
    "Roof Type": "Tip strehe",
    "Roof Color": "Barva strehe",
    "Knee Wall": "Kolenski zid",
    "Extra Insulation": "Dodatna izolacija",

    "Bathroom Equipment": "Kopalniška oprema",
    "Bathroom Walls": "Stene kopalnice",
    "Staircase": "Stopnice",
    "Interior Wall": "Notranje stene",
    "Floor Cladding": "Talna obloga",
    "Mansard": "Mansarda",

    "Wood": "Les",
    "Magnelis metal": "Magnelis konstrukcija",
    "Normal": "Navadna",
    "Balcony": "Balkonska",
    "Fixed windows": "Fiksna okna",
    "White": "Bela",
    "Anthracite": "Antracit",
    "Black": "Črna",
    "Brown": "Rjava",
    "Sheet metals": "Pločevina",
    "Roof tile imitation": "Imitacija strešnika",
    "Laminate": "Laminat",
    "Vinyl": "Vinil",
    "Half": "Polovična",
    "Full": "Polna",

    "Vilo - Wood": "Vilo - les",
    "Contact facade plaster 1.5mm": "Kontaktna fasada 1.5mm",
    "Facade cladding Larch": "Fasadna obloga macesen",

    "No canopy": "Brez nadstreška",
    "70 cm": "70 cm",

    "Wooden cladding (spruce)": "Lesena obloga (smreka)",
    "Wooden cladding (WPC)": "Lesena obloga (WPC)",
    "Wooden cladding (tropical wood)": "Lesena obloga (tropski les)",

    // INSULATION
"Additional insulation 100mm EPS": "Dodatna izolacija 100mm EPS",

// BATHROOM
"No bathroom": "Brez kopalnice",
"Basic": "Osnovna",
"LUX": "Luksuzna",

// BOILER
"No boiler": "Brez bojlerja",
"Boiler 50L": "Bojler 50L",
"Boiler 80L": "Bojler 80L",

// BATHROOM WALLS
"PVC white": "PVC bela",
"PVC gray": "PVC siva",

// INTERIOR WALL
"Plywood": "Vezana plošča",
"Wall cladding": "Stenska obloga",

"White inside / Anthracite outside": "Bela znotraj / antracit zunaj",

"1/4 Door": "1/4 vrata",
"1/4 Sliding Door": "1/4 drsna vrata",
"1/2 Sliding Door": "1/2 drsna vrata",

"No extra insulation": "Brez dodatne izolacije",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<"en" | "sl">("en");
const t = translations[language];

const [isSalesPath, setIsSalesPath] = useState(false);
useEffect(() => {
  const salesPath = window.location.pathname.startsWith("/sales");

  setIsSalesPath(salesPath);
  setIsSalesMode(salesPath);
}, []); // to je OK, warning lahko ignoriraš

const translateLabel = (label: string) => {
  if (language === "en") return label;
  return labelTranslations[language]?.[label] || label;
};

const [modelKey, setModelKey] = useState<ModelKey>("wood36");
const model = models[modelKey];

const availableModels: ModelKey[] = ["wood36", "wood50"];

const modelDisplayName = model.name;
const modelDimensions = model.dimensions;
const modelGrossArea = model.grossArea;

const modelKeys = availableModels;
const currentModelIndex = modelKeys.indexOf(modelKey);

const goToPreviousModel = () => {
  const previousIndex =
    currentModelIndex === 0 ? modelKeys.length - 1 : currentModelIndex - 1;

  setModelKey(modelKeys[previousIndex]);
};

const goToNextModel = () => {
  const nextIndex =
    currentModelIndex === modelKeys.length - 1 ? 0 : currentModelIndex + 1;

  setModelKey(modelKeys[nextIndex]);
};

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"exterior" | "interior" | "bathroom">("exterior");
  const [isMobile, setIsMobile] = useState(false);
  const [isSalesMode, setIsSalesMode] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerNumber, setOfferNumber] = useState("ZM-2026-001");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryKm, setDeliveryKm] = useState("0");

  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  const assemblyCost = 1500;

  const defaultConfig = useMemo<ConfigState>(() => {
    const initialConfig: ConfigState = {};

    model.categories.forEach((category: Category) => {
      if ("options" in category) {
        initialConfig[category.id] = category.options.default;
      }

      if ("subcategories" in category) {
        category.subcategories.forEach((subcategory: Subcategory) => {
          initialConfig[subcategory.id] = subcategory.options.default;
        });
      }
    });


    
    return initialConfig;
  }, [model]);

  const [config, setConfig] = useState<ConfigState>(defaultConfig);

  const height =
  config.knee_wall === "100" ? model.height.kneeWall100 : model.height.default;
 

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 980);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");

  if (lang === "en" || lang === "sl") {
    setLanguage(lang);
  }
}, []);

  useEffect(() => {
    fetch("/prices.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse<{ id: string; price: string }>(text, {
          header: true,
          skipEmptyLines: true,
          comments: "#",
        });

        const map: Record<string, number> = {};

        parsed.data.forEach((row) => {
          if (!row?.id) return;
          const price = Number(row.price);
          if (!Number.isNaN(price)) {
            map[row.id] = price;
          }
        });

        setPriceMap(map);
      })
      .catch((error) => {
        console.error("Failed to load prices.csv", error);
      });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams(window.location.search);
    const nextConfig: ConfigState = { ...defaultConfig };

    Object.keys(nextConfig).forEach((key) => {
      const value = params.get(key);
      if (value) nextConfig[key] = value;
    });

    setConfig(nextConfig);
    setCustomerName(params.get("customerName") || "");
    setOfferDate(params.get("offerDate") || today);
    setOfferNumber(params.get("offerNumber") || "ZM-2026-001");
    setDeliveryAddress(params.get("deliveryAddress") || "");
    setDeliveryKm(params.get("deliveryKm") || "0");
    setMounted(true);
  }, [defaultConfig]);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams();

    Object.entries(config).forEach(([key, value]) => {
      params.set(key, value);
    });

    params.set("lang", language);

    if (customerName.trim()) params.set("customerName", customerName);
    if (offerDate.trim()) params.set("offerDate", offerDate);
    if (offerNumber.trim()) params.set("offerNumber", offerNumber);
    if (deliveryAddress.trim()) params.set("deliveryAddress", deliveryAddress);
    params.set("deliveryKm", deliveryKm || "0");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [
  mounted,
  config,
  language,
  customerName,
  offerDate,
  offerNumber,
  deliveryAddress,
  deliveryKm,
]);

  const shareUrl = useMemo(() => {
    if (!mounted) return "";

    const params = new URLSearchParams();

    Object.entries(config).forEach(([key, value]) => {
      params.set(key, value);
    });

    if (customerName.trim()) params.set("customerName", customerName);
    if (offerDate.trim()) params.set("offerDate", offerDate);
    if (offerNumber.trim()) params.set("offerNumber", offerNumber);
    if (deliveryAddress.trim()) params.set("deliveryAddress", deliveryAddress);
    params.set("deliveryKm", deliveryKm || "0");

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [mounted, config, customerName, offerDate, offerNumber, deliveryAddress, deliveryKm]);

  const productTotal = useMemo(
    () => calculatePrice(modelKey, config, priceMap),
    [modelKey, config, priceMap]
  );

  const breakdown = useMemo(
    () => getBreakdown(modelKey, config, priceMap),
    [modelKey, config, priceMap]
  );

  const deliveryKmNumber = useMemo(() => {
    const parsed = parseFloat(deliveryKm);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [deliveryKm]);

  const deliveryCost = useMemo(() => deliveryKmNumber * 1.8, [deliveryKmNumber]);

  const finalTotal = useMemo(
    () => productTotal + deliveryCost + assemblyCost,
    [productTotal, deliveryCost]
  );

  const finalTotalFormatted = finalTotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getViewModeForSection = (categoryId: string, subcategoryId?: string) => {
    if (subcategoryId === "bathroom" || subcategoryId === "bathroom_walls") {
      return "bathroom" as const;
    }

    if (categoryId === "interior") {
      return "interior" as const;
    }

    return "exterior" as const;
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Could not copy link.");
    }
  };

  const priceLabel = (value: number) => {
  if (value === 0) return t.included;
  return `+€${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatBreakdownLabel = (label: string) => {
  if (label === "Base") return t.base;

  const match = label.match(/^(.+?) \((.+)\)$/);
  if (!match) return translateLabel(label);

  const [, group, option] = match;
  return `${translateLabel(group)} (${translateLabel(option)})`;
};

  const exportTxt = () => {
    const breakdownText = breakdown
      .map((item) => {
        const valueText =
          item.value === 0
            ? t.included
            : `+€${item.value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
        return `${formatBreakdownLabel(item.label)}: ${valueText}`;
      })
      .join("\n");

    const content = `ZERROMAX OFFER

${t.customerName}: ${customerName || t.notSpecified}
${t.offerDate}: ${offerDate || t.notSpecified}
${t.offerNumber}: ${offerNumber}
${t.deliveryAddress}: ${deliveryAddress || t.notSpecified}
${t.distance}: ${deliveryKmNumber.toFixed(1)} km

${t.model}: ${modelDisplayName}

${t.productBreakdown.toUpperCase()}
${breakdownText}

${t.finalTotal.toUpperCase()}: €${finalTotalFormatted}

${t.shareLink}:
${shareUrl}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ZerroMax-offer-${offerNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
  const doc = new jsPDF();

  const font = await loadFont("/fonts/Poppins-Regular.ttf");

  doc.addFileToVFS("Poppins-Regular.ttf", font);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal", "Identity-H");
  doc.setFont("Poppins", "normal");
  doc.setFontSize(11);
  doc.setCharSpace(0);
    const logo = new Image();
    logo.src = "/logo.png";

    const drawPdf = (withLogo: boolean) => {
      let y = 20;

      if (withLogo) {
        const imgWidth = 55;
        const aspectRatio = logo.height / logo.width;
        const imgHeight = imgWidth * aspectRatio;
        doc.addImage(logo, "PNG", 20, 15, imgWidth, imgHeight);
      } else {
        doc.setFont("Poppins-Bold", "normal");
        doc.setFontSize(18);
        doc.text("ZerroMax", 20, 22);
      }

      doc.setFont("Poppins-Bold", "normal");
      doc.setFontSize(16);
      doc.text(modelDisplayName, 105, 30, { align: "center" });

      y = 45;
      doc.setFont("Poppins-Regular", "normal");
      doc.setFontSize(11);
      doc.text(`Dimensions: ${modelDimensions}`, 20, y);
      doc.text(`Gross Area: ${modelGrossArea}`, 82, y);
      doc.text(`Height: ${height}`, 150, y);

      y += 10;
      doc.line(20, y, 190, y);

      y += 12;
      doc.setFont("Poppins-Bold", "normal");
      doc.text(t.offerDetails, 20, y);

      y += 8;
      doc.setFont("Poppins-Regular", "normal");
      doc.text(`${t.customerName}: ${customerName || "Not specified"}`, 20, y);
      y += 7;
      doc.text(`${t.offerDate}: ${offerDate || "Not specified"}`, 20, y);
      y += 7;
      doc.text(`${t.offerNumber}: ${offerNumber}`, 20, y);
      y += 7;
      doc.text(`${t.deliveryAddress}: ${deliveryAddress || "Not specified"}`, 20, y);
      y += 7;
      doc.text(`${t.distance}: ${deliveryKmNumber.toFixed(1)} km`, 20, y);

      y += 14;
      doc.setFont("Poppins-Bold", "normal");
      doc.text(t.selectedConfiguration, 20, y);

      breakdown
        .filter((item) => item.label !== "Base")
        .forEach((item) => {
          y += 7;
          doc.setFont("Poppins-Regular", "normal");
          doc.text(formatBreakdownLabel(item.label), 20, y);
        });

      y += 12;
      doc.line(20, y, 190, y);

      y += 12;
      doc.setFont("Poppins-Bold", "normal");
      doc.setFontSize(14);
      doc.text(t.finalTotal, 20, y);
      doc.text(`€${finalTotalFormatted}`, 180, y, { align: "right" });

      doc.save(`ZerroMax-offer-${offerNumber}.pdf`);
    };

    logo.onload = () => drawPdf(true);
    logo.onerror = () => drawPdf(false);
  };

  const getDisplayPrice = (groupId: string, optionKey: string, fallbackPrice: number) => {
    const csvKey = `${groupId}.${optionKey}`;
    const csvPrice = priceMap[csvKey];

    return typeof csvPrice === "number" && !Number.isNaN(csvPrice)
      ? csvPrice
      : fallbackPrice;
  };

  const getOptionUiType = (groupId: string) => {
    if (["facade", "window_color", "roof_color", "bathroom_walls"].includes(groupId)) {
      return "swatches";
    }

    if (groupId === "equipment") {
      return "exclusive_checks";
    }

    if (groupId === "extra_insulation" || groupId === "insulation") {
      return "single_checkbox";
    }

    return "cards";
  };

  const getSwatchStyle = (groupId: string, optionKey: string) => {
    const base = {
      width: isMobile ? 60 : 72,
      height: isMobile ? 60 : 72,
      borderRadius: "50%",
      border: "1px solid rgba(243,240,234,0.15)",
      boxShadow: "inset 0 2px 8px rgba(255,255,255,0.16), 0 2px 10px rgba(0,0,0,0.25)",
      margin: "0 auto 10px",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    } as const;

    if (groupId === "facade") {
      if (optionKey === "wood") return { ...base, backgroundImage: "url('/swatches/facade-wood.png')" };
      if (optionKey === "plaster") return { ...base, backgroundImage: "url('/swatches/facade-plaster.png')" };
      if (optionKey === "larch") return { ...base, backgroundImage: "url('/swatches/facade-larch.png')" };
    }

    if (groupId === "window_color") {
      if (optionKey === "white") return { ...base, backgroundColor: "#f1f1ef" };
      if (optionKey === "anthracite") return { ...base, backgroundColor: "#19303e" };
      if (optionKey === "mixed") {
        return {
          ...base,
          background: "linear-gradient(90deg, #f1f1ef 0%, #f1f1ef 50%, #19303e 50%, #19303e 100%)",
        };
      }
    }

    if (groupId === "roof_color") {
      if (optionKey === "anthracite") return { ...base, backgroundColor: "#19303e" };
      if (optionKey === "black") return { ...base, backgroundColor: "#101010" };
      if (optionKey === "white") return { ...base, backgroundColor: "#f1f1ef" };
      if (optionKey === "brown") return { ...base, backgroundColor: "#6b4a2f" };
    }

    if (groupId === "bathroom_walls") {
      if (optionKey === "white") return { ...base, backgroundColor: "#efefed" };
      if (optionKey === "gray") return { ...base, backgroundColor: "#9ba0a6" };
    }

    return { ...base, backgroundColor: "#d8d2c8" };
  };

  const renderEquipmentGroup = (
    values: Record<string, OptionValue>,
    selectedValue: string,
    onSelect: (key: string) => void
  ) => {
    const visibleEntries = Object.entries(values).filter(
      ([key]) => key === "boiler_50" || key === "boiler_80"
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {visibleEntries.map(([key, value]) => {
          const active = selectedValue === key;
          const displayPrice = getDisplayPrice("equipment", key, value.price);

          return (
            <button
              key={key}
              onClick={() => onSelect(active ? "none" : key)}
              style={{
                width: "100%",
                borderRadius: 22,
                border: active ? "1.5px solid #b79e84" : "1px solid #2a2c31",
                background: active ? "#1c1d21" : "#17181b",
                padding: "18px 18px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      border: active ? "1.5px solid #b79e84" : "1px solid #4a4d54",
                      background: active ? "#b79e84" : "transparent",
                      color: "#111214",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {active ? "✓" : ""}
                  </div>

                  <div style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: "#f3f0ea" }}>
                    {translateLabel(value.label)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#b79e84" : "#b7ab9a",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayPrice === 0 ? t.included : priceLabel(displayPrice)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderInsulationGroup = (
    values: Record<string, OptionValue>,
    selectedValue: string,
    onSelect: (key: string) => void
  ) => {
    const visibleEntry = Object.entries(values).find(([key]) => key !== "none");
    if (!visibleEntry) return null;

    const [entryKey, entry] = visibleEntry;
    const active = selectedValue === entryKey;
    const displayPrice = getDisplayPrice("extra_insulation", entryKey, entry.price);

    return (
      <button
        onClick={() => onSelect(active ? "none" : entryKey)}
        style={{
          width: "100%",
          borderRadius: 22,
          border: active ? "1.5px solid #b79e84" : "1px solid #2a2c31",
          background: active ? "#1c1d21" : "#17181b",
          padding: "18px 18px",
          textAlign: "left",
          cursor: "pointer",
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: active ? "1.5px solid #b79e84" : "1px solid #4a4d54",
                background: active ? "#b79e84" : "transparent",
                color: "#111214",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {active ? "✓" : ""}
            </div>

            <div style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: "#f3f0ea" }}>
              {translateLabel(entry.label)}
            </div>
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              color: active ? "#b79e84" : "#b7ab9a",
            }}
          >
            {displayPrice === 0 ? t.included : priceLabel(displayPrice)}
          </div>
        </div>
      </button>
    );
  };

  const renderOptionGroup = (
    groupId: string,
    values: Record<string, OptionValue>,
    selectedValue: string,
    onSelect: (key: string) => void
  ) => {
    const swatchMode = getOptionUiType(groupId) === "swatches";

    if (swatchMode) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(auto-fit, minmax(84px, 1fr))"
              : "repeat(auto-fit, minmax(96px, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          {Object.entries(values).map(([key, value]) => {
            const active = selectedValue === key;
            const displayPrice = getDisplayPrice(groupId, key, value.price);

            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    padding: 8,
                    borderRadius: 24,
                    border: active ? "1.5px solid #b79e84" : "1px solid transparent",
                    background: active ? "#1b1c20" : "transparent",
                    boxShadow: active ? "0 0 0 3px rgba(183,158,132,0.18)" : "none",
                  }}
                >
                  <div style={getSwatchStyle(groupId, key)} />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: "#f3f0ea",
                      lineHeight: 1.25,
                      minHeight: 34,
                    }}
                  >
                    {translateLabel(value.label)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#b7ab9a" }}>
                    {displayPrice === 0 ? t.included : priceLabel(displayPrice)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {Object.entries(values).map(([key, value]) => {
          const active = selectedValue === key;
          const displayPrice = getDisplayPrice(groupId, key, value.price);

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                width: "100%",
                borderRadius: 22,
                border: active ? "1.5px solid #b79e84" : "1px solid #2a2c31",
                background: active ? "#1c1d21" : "#17181b",
                padding: "18px 18px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: "#f3f0ea" }}>
                  {translateLabel(value.label)}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#b79e84" : "#b7ab9a",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayPrice === 0 ? t.included : priceLabel(displayPrice)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderGroupByType = (
    groupId: string,
    values: Record<string, OptionValue>,
    selectedValue: string,
    onSelect: (key: string) => void
  ) => {
    const uiType = getOptionUiType(groupId);

    if (uiType === "exclusive_checks") {
      return renderEquipmentGroup(values, selectedValue, onSelect);
    }

    if (uiType === "single_checkbox") {
      return renderInsulationGroup(values, selectedValue, onSelect);
    }

    return renderOptionGroup(groupId, values, selectedValue, onSelect);
  };

  if (!mounted) return null;

  return (
    <main style={{ minHeight: "100vh", background: "#111214", color: "#f3f0ea" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(380px, 520px) 1fr",
          minHeight: "100vh",
        }}
      >
        {isMobile && (
  <div
    style={{
      background: "#121316",
      position: "sticky",
      top: 0,
      zIndex: 25,
      height: 380,
      borderBottom: "1px solid #22242a",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}
  >
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                zIndex: 20,
                display: "flex",
                gap: 8,
                padding: 8,
                borderRadius: 18,
                background: "rgba(23,24,27,0.82)",
                border: "1px solid #2a2c31",
                backdropFilter: "blur(10px)",
              }}
            >
              {[
                { id: "exterior", label: "Exterior" },
                { id: "interior", label: "Interior" },
                { id: "bathroom", label: "Bathroom" },
              ].map((item) => {
                const active = viewMode === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setViewMode(item.id as typeof viewMode)}
                    style={{
                      borderRadius: 14,
                      padding: "10px 12px",
                      border: active ? "1px solid #b79e84" : "1px solid transparent",
                      background: active ? "#b79e84" : "transparent",
                      color: active ? "#111214" : "#f3f0ea",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {translateLabel(item.label)}
                  </button>
                );
              })}
            </div>

            <ModelViewer
              modelPath={model.glb}
              terrace={config.terrace}
              facade={config.facade}
              terraceCladding={config.terrace_floor}
              windowType={config.windows_type}
              windowColor={config.windows_color}
              exteriorDoor={config.exterior_door}
              viewMode={viewMode}
              mansard={config.mansard}
              floorCladding={config.floor_cladding}
              staircase={config.staircase}
              interiorWall={config.interior_wall}
              roofType={config.roof_type}
              roofColor={config.roof_color}
              bathroomWalls={config.bathroom_walls}
              bathroom={config.bathroom}
            />
          </div>
        )}

        <div
          style={{
            borderRight: isMobile ? "none" : "1px solid #22242a",
            padding: isMobile ? "20px 14px 120px" : "28px 22px 120px",
            overflowY: "auto",
            background: "#111214",
            order: isMobile ? 2 : 1,
          }}
        >
          <div style={{ textAlign: "left", marginBottom: 22 }}>
            <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  }}
>
  <img
    src="/logo-white.svg"
    alt="ZerroMax"
    style={{ width: isMobile ? 150 : 180, height: "auto" }}
  />

  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value as "en" | "sl")}
    style={{
      borderRadius: 14,
      border: "1px solid #2a2c31",
      background: "#1c1d21",
      color: "#f3f0ea",
      padding: "10px 12px",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      outline: "none",
    }}
  >
    <option value="en">EN</option>
    <option value="sl">SL</option>
  </select>
</div>

            <div     
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? 14 : 20,
  }}
>
  <button
    onClick={goToPreviousModel}
    style={{
      width: isMobile ? 38 : 44,
      height: isMobile ? 38 : 44,
      borderRadius: "50%",
      border: "1px solid #2a2c31",
      background: "#1c1d21",
      color: "#f3f0ea",
      fontSize: isMobile ? 22 : 26,
      fontWeight: 700,
      cursor: "pointer",
      lineHeight: 1,
    }}
  >
    ‹
  </button>

  <h1
    style={{
      margin: 0,
      fontSize: isMobile ? 42 : 58,
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: "-0.04em",
      textAlign: "center",
      minWidth: isMobile ? 180 : 260,
    }}
  >
    {modelDisplayName}
  </h1>

  <button
    onClick={goToNextModel}
    style={{
      width: isMobile ? 38 : 44,
      height: isMobile ? 38 : 44,
      borderRadius: "50%",
      border: "1px solid #2a2c31",
      background: "#1c1d21",
      color: "#f3f0ea",
      fontSize: isMobile ? 22 : 26,
      fontWeight: 700,
      cursor: "pointer",
      lineHeight: 1,
    }}
  >
    ›
  </button>
</div>

{!isSalesPath && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                marginTop: 24,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#f3f0ea" }}>
                  {modelDimensions}
                </div>
                <div style={{ marginTop: 6, fontSize: isMobile ? 12 : 13, color: "#b7ab9a" }}>
                  {t.dimensions}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#f3f0ea" }}>
                  {modelGrossArea}
                </div>
                <div style={{ marginTop: 6, fontSize: isMobile ? 12 : 13, color: "#b7ab9a" }}>
                  {t.grossArea}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#f3f0ea" }}>
                  {height}
                </div>
                <div style={{ marginTop: 6, fontSize: isMobile ? 12 : 13, color: "#b7ab9a" }}>
                  {t.height}
                </div>
              </div>
            </div>
    )}  </div>                                     

          {false && (
  <section
  style={{
    background: "#17181b",
    border: "1px solid #2a2c31",
    borderRadius: 22,
    padding: 10,
    marginBottom: 16,
  }}
>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    <button
      onClick={() => setIsSalesMode(false)}
      style={{
        borderRadius: 16,
        padding: "12px 14px",
        border: !isSalesMode ? "1px solid #b79e84" : "1px solid #2a2c31",
        background: !isSalesMode ? "#b79e84" : "#1c1d21",
        color: !isSalesMode ? "#111214" : "#f3f0ea",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {t.public}
    </button>

    <button
      onClick={() => setIsSalesMode(true)}
      style={{
        borderRadius: 16,
        padding: "12px 14px",
        border: isSalesMode ? "1px solid #b79e84" : "1px solid #2a2c31",
        background: isSalesMode ? "#b79e84" : "#1c1d21",
        color: isSalesMode ? "#111214" : "#f3f0ea",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
     {t.commercialist}
    </button>
  </div>
</section>
)}


       {isSalesMode && (
          <section style={{ background: "#17181b", border: "1px solid #2a2c31", borderRadius: 28, padding: 22, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>{t.offerDetails}</h2>

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {[
                { label: t.customerName, value: customerName, onChange: setCustomerName, placeholder: "Enter customer name", type: "text" },
                { label: t.offerDate, value: offerDate, onChange: setOfferDate, placeholder: "", type: "date" },
                { label: t.offerNumber, value: offerNumber, onChange: setOfferNumber, placeholder: "Offer number", type: "text" },
                { label: t.deliveryAddress, value: deliveryAddress, onChange: setDeliveryAddress, placeholder: "Enter delivery address", type: "text" },
                { label: t.distance, value: deliveryKm, onChange: setDeliveryKm, placeholder: "Enter distance in km", type: "number" },
              ].map((field) => (
                <div key={field.label}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#b7ab9a", marginBottom: 8 }}>
                    {field.label}
                  </div>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      border: "1px solid #2a2c31",
                      background: "#1c1d21",
                      padding: "16px 18px",
                      fontSize: 16,
                      color: "#f3f0ea",
                      outline: "none",
                    }}
                  />
                </div>
              ))}

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#b7ab9a", marginBottom: 8 }}>
                  {t.shareLink}
                </div>

                <div
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    border: "1px solid #2a2c31",
                    background: "#1c1d21",
                    padding: "16px 18px",
                    fontSize: 16,
                    color: "#f3f0ea",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {shareUrl ? `${shareUrl.split("?")[0]}?...` : ""}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={copyShareLink}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #2a2c31",
                      background: "#1c1d21",
                      color: "#f3f0ea",
                      padding: "14px 18px",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? t.copied : t.copyFullLink}
                  </button>

                  <button
                    onClick={exportTxt}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #2a2c31",
                      background: "#1c1d21",
                      color: "#f3f0ea",
                      padding: "14px 18px",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t.exportTxt}
                  </button>

                  <button
                    onClick={exportPdf}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #b79e84",
                      background: "#b79e84",
                      color: "#111214",
                      padding: "14px 18px",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t.exportPdf}
                  </button>
                </div>
              </div>
            </div>
          </section>
       )}
       

          {model.categories.map((category: Category) => {
            if ("options" in category) {
              return (
                <section
                  key={category.id}
                  style={{
                    background: "#17181b",
                    border: "1px solid #2a2c31",
                    borderRadius: 28,
                    padding: 22,
                    marginBottom: 16,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>{translateLabel(category.name)}</h2>

                  {renderGroupByType(
                    category.id,
                    category.options.values as Record<string, OptionValue>,
                    config[category.id],
                    (key) => {
                      updateConfig(category.id, key);
                      setViewMode(getViewModeForSection(category.id));
                    }
                  )}
                </section>
              );
            }

            return (
              <section
                key={category.id}
                style={{
                  background: "#17181b",
                  border: "1px solid #2a2c31",
                  borderRadius: 28,
                  padding: 22,
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>{translateLabel(category.name)}</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 18 }}>
                  {category.subcategories.map((subcategory: Subcategory) => {
                    const visible = isOptionGroupVisible(modelKey, config, subcategory.id);
                    if (!visible) return null;

                    return (
                      <div key={subcategory.id}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#f3f0ea" }}>
                          {translateLabel(subcategory.name)}
                        </h3>

                        {renderGroupByType(
                          subcategory.id,
                          subcategory.options.values as Record<string, OptionValue>,
                          config[subcategory.id],
                          (key) => {
                            updateConfig(subcategory.id, key);
                            setViewMode(getViewModeForSection(category.id, subcategory.id));
                          }
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section style={{ background: "#17181b", border: "1px solid #2a2c31", borderRadius: 28, padding: 22, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>{t.summary}</h2>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                color: "#d8d0c6",
                fontSize: 15,
                lineHeight: 1.45,
              }}
            >
              {breakdown
  .filter((item) => item.label !== "Base")
  .map((item, index) => {
    const match = item.label.match(/^(.+?) \((.+)\)$/);

    if (!match) return <div key={index}>{translateLabel(item.label)}</div>;

    const [, group, option] = match;

    return (
      <div key={index}>
        {translateLabel(group)} ({translateLabel(option)})
      </div>
    );
  })}
            </div>

            <button
              onClick={() => setBreakdownOpen((prev) => !prev)}
              style={{
                width: "100%",
                marginTop: 18,
                borderRadius: 18,
                border: "1px solid #2a2c31",
                background: "#1c1d21",
                color: "#f3f0ea",
                padding: "16px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span>{t.showPricingBreakdown}</span>
              <span style={{ fontSize: 22, lineHeight: 1, color: "#b79e84" }}>
                {breakdownOpen ? "▴" : "▾"}
              </span>
            </button>

            {breakdownOpen && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {breakdown.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 15,
                      color: "#d8d0c6",
                    }}
                  >
                    <span>
  {(() => {
    if (item.label === "Base") return t.base;

    const match = item.label.match(/^(.+?) \((.+)\)$/);

    if (!match) return translateLabel(item.label);

    const [, group, option] = match;

    return `${translateLabel(group)} (${translateLabel(option)})`;
  })()}
</span>
                    <span>{item.value === 0 ? t.included : priceLabel(item.value)}</span>
                  </div>
                ))}

                <div style={{ height: 1, background: "#2a2c31", margin: "8px 0" }} />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#f3f0ea",
                  }}
                >
                  <span>{t.finalTotal}</span>
                  <span>€{finalTotalFormatted}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {!isMobile && (
          <div
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              background: "#121316",
              display: "flex",
              flexDirection: "column",
              order: 2,
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  zIndex: 20,
                  display: "flex",
                  gap: 8,
                  padding: 8,
                  borderRadius: 18,
                  background: "rgba(23,24,27,0.82)",
                  border: "1px solid #2a2c31",
                  backdropFilter: "blur(10px)",
                }}
              >
                {[
                  { id: "exterior", label: t.exterior },
                  { id: "interior", label: t.interior },
                  { id: "bathroom", label: t.bathroom },
                ].map((item) => {
                  const active = viewMode === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setViewMode(item.id as typeof viewMode)}
                      style={{
                        borderRadius: 14,
                        padding: "10px 14px",
                        border: active ? "1px solid #b79e84" : "1px solid transparent",
                        background: active ? "#b79e84" : "transparent",
                        color: active ? "#111214" : "#f3f0ea",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {translateLabel(item.label)}
                    </button>
                  );
                })}
              </div>

              <ModelViewer
                modelPath={model.glb}
                terrace={config.terrace}
                facade={config.facade}
                terraceCladding={config.terrace_floor}
                windowType={config.windows_type}
                windowColor={config.windows_color}
                exteriorDoor={config.exterior_door}
                viewMode={viewMode}
                mansard={config.mansard}
                floorCladding={config.floor_cladding}
                staircase={config.staircase}
                interiorWall={config.interior_wall}
                roofType={config.roof_type}
                roofColor={config.roof_color}
                bathroomWalls={config.bathroom_walls}
                bathroom={config.bathroom}
              />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100%",
          zIndex: 30,
          background: "rgba(17,18,20,0.92)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid #2a2c31",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1480,
            margin: "0 auto",
            padding: isMobile ? "12px 14px 14px" : "14px 22px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#b7ab9a", marginBottom: 6 }}>{t.finalTotal}</div>
            <div
              style={{
                fontSize: isMobile ? 30 : 40,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#b79e84",
              }}
            >
              €{finalTotalFormatted}
            </div>
          </div>

          <button
            onClick={exportPdf}
            style={{
              borderRadius: 18,
              border: "1px solid #b79e84",
              background: "#b79e84",
              color: "#111214",
              padding: isMobile ? "14px 18px" : "18px 24px",
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              cursor: "pointer",
              minWidth: isMobile ? 140 : 190,
            }}
          >
            {isSalesMode ? t.exportOffer : t.requestQuote}
          </button>
        </div>
      </div>
    </main>
  );
}