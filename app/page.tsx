"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

import { captureImage } from "./ModelViewer";
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
    requestQuote: "Save design",
    included: "Included",
    exterior: "Exterior",
    interior: "Interior",
    bathroom: "Bathroom",
    base: "Base",
    selectedConfiguration: "Selected Configuration",

    notSpecified: "Not specified",
    model: "Model",
    productBreakdown: "Product breakdown",

    saveDesignTitle: "Save your design",
    saveDesignSubtitle: "Send your configuration to your email",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    email: "Email",
    send: "Send",
    sending: "Sending...",
    receiveUpdates: "Receive updates and news",
    unsubscribeNote: "You can unsubscribe at any time.",
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
    requestQuote: "Shrani dizajn",
    included: "Vključeno",
    exterior: "Zunanjost",
    interior: "Notranjost",
    bathroom: "Kopalnica",
    base: "Osnova",

    selectedConfiguration: "Izbrana konfiguracija",

    notSpecified: "Ni določeno",
    model: "Model",
    productBreakdown: "Razčlenitev izdelka",

    saveDesignTitle: "Shrani svoj dizajn",
    saveDesignSubtitle: "Pošlji konfiguracijo na svoj email",
    firstName: "Ime",
    lastName: "Priimek",
    phone: "Telefon",
    email: "Email",
    send: "Pošlji",
    sending: "Pošiljanje...",
    receiveUpdates: "Prejemaj novosti in obvestila",
    unsubscribeNote: "Kadarkoli se lahko odjaviš.",
  },

  hr: {
  public: "Javno",
  commercialist: "Komercijalist",
  dimensions: "Dimenzije",
  grossArea: "Bruto površina",
  height: "Visina",
  offerDetails: "Podaci ponude",
  customerName: "Ime kupca",
  offerDate: "Datum ponude",
  offerNumber: "Broj ponude",
  deliveryAddress: "Adresa dostave",
  distance: "Udaljenost (km)",
  shareLink: "Poveznica",
  copyFullLink: "Kopiraj poveznicu",
  copied: "Kopirano",
  exportTxt: "Izvoz TXT",
  exportPdf: "Izvoz PDF",
  summary: "Sažetak",
  showPricingBreakdown: "Prikaži razradu cijene",
  finalTotal: "Ukupna cijena",
  exportOffer: "Izvezi ponudu",
  requestQuote: "Spremi dizajn",
  included: "Uključeno",
  exterior: "Eksterijer",
  interior: "Interijer",
  bathroom: "Kupaonica",
  base: "Osnova",

  selectedConfiguration: "Odabrana konfiguracija",

  notSpecified: "Nije određeno",
  model: "Model",
  productBreakdown: "Razrada proizvoda",

  saveDesignTitle: "Spremi svoj dizajn",
  saveDesignSubtitle: "Pošalji konfiguraciju na svoj email",
  firstName: "Ime",
  lastName: "Prezime",
  phone: "Telefon",
  email: "Email",
  send: "Pošalji",
  sending: "Slanje...",
  receiveUpdates: "Primaj novosti i obavijesti",
  unsubscribeNote: "U svakom trenutku se možeš odjaviti.",
}
};

const labelTranslations: Record<string, Record<string, string>> = {
  sl: {
    "Floor Construction": "Konstrukcija tal",
    "Construction": "Konstrukcija",
    "Exterior": "Zunanjost",
    "Interior": "Notranjost",
    "Equipment": "Oprema",

    "Facade": "Fasada",
    "Exterior Door": "Vhodna vrata",
    "Canopy": "Nadstrešek",
    "Terrace Floor": "Tla terase",
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

  hr: {
  "Floor Construction": "Konstrukcija poda",
  "Construction": "Konstrukcija",
  "Exterior": "Eksterijer",
  "Interior": "Interijer",
  "Bathroom": "Kupaonica",
  "Equipment": "Oprema",

  "Facade": "Fasada",
  "Exterior Door": "Ulazna vrata",
  "Canopy": "Nadstrešnica",
  "Terrace Floor": "Pod terase",
  "Window Type": "Tip prozora",
  "Window Color": "Boja prozora",
  "Roof Type": "Tip krova",
  "Roof Color": "Boja krova",
  "Knee Wall": "Koljenasti zid",
  "Extra Insulation": "Dodatna izolacija",

  "Bathroom Equipment": "Oprema kupaonice",
  "Bathroom Walls": "Zidovi kupaonice",
  "Staircase": "Stepenice",
  "Interior Wall": "Unutarnji zidovi",
  "Floor Cladding": "Podna obloga",
  "Mansard": "Potkrovlje",

  "Wood": "Drvo",
  "Magnelis metal": "Magnelis konstrukcija",
  "Normal": "Standardna",
  "Balcony": "Balkonska",
  "Fixed windows": "Fiksni prozori",
  "White": "Bijela",
  "Anthracite": "Antracit",
  "Black": "Crna",
  "Brown": "Smeđa",
  "Sheet metals": "Lim",
  "Roof tile imitation": "Imitacija crijepa",
  "Laminate": "Laminat",
  "Vinyl": "Vinil",
  "Half": "Polovična",
  "Full": "Potpuna",

  "Vilo - Wood": "Vilo - drvo",
  "Contact facade plaster 1.5mm": "Kontaktna fasada 1.5mm",
  "Facade cladding Larch": "Fasadna obloga ariš",

  "No canopy": "Bez nadstrešnice",
  "70 cm": "70 cm",

  "Wooden cladding (spruce)": "Drvena obloga (smreka)",
  "Wooden cladding (WPC)": "Drvena obloga (WPC)",
  "Wooden cladding (tropical wood)": "Drvena obloga (tropsko drvo)",

  "Additional insulation 100mm EPS": "Dodatna izolacija 100mm EPS",

  "No bathroom": "Bez kupaonice",
  "Basic": "Osnovna",
  "LUX": "Luksuzna",

  "No boiler": "Bez bojlera",
  "Boiler 50L": "Bojler 50L",
  "Boiler 80L": "Bojler 80L",

  "PVC white": "PVC bijela",
  "PVC gray": "PVC siva",

  "Plywood": "Šperploča",
  "Wall cladding": "Zidna obloga",

  "White inside / Anthracite outside": "Bijela unutra / antracit vani",

  "1/4 Door": "1/4 vrata",
  "1/4 Sliding Door": "1/4 klizna vrata",
  "1/2 Sliding Door": "1/2 klizna vrata",

  "No extra insulation": "Bez dodatne izolacije",
}
};

export default function Home() {
  const [language, setLanguage] = useState<"en" | "sl" | "hr">("en");
const t = translations[language];

const captureImage = () => {
  const canvas = document.querySelector("canvas");

  if (!canvas) return null;

  return canvas.toDataURL("image/png");
};

const [initialLoading, setInitialLoading] = useState(true);
const [progress, setProgress] = useState(0);

useEffect(() => {
  let current = 0;

  const interval = setInterval(() => {
    current += Math.random() * 18;

    if (current >= 100) {
      current = 100;
      clearInterval(interval);

      setTimeout(() => {
        setInitialLoading(false);
      }, 300);
    }

    setProgress(Math.floor(current));
  }, 120);

  return () => clearInterval(interval);
}, []);

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


const [showSaveModal, setShowSaveModal] = useState(false);

const [leadFirstName, setLeadFirstName] = useState("");
const [leadLastName, setLeadLastName] = useState("");
const [leadEmail, setLeadEmail] = useState("");
const [leadPhone, setLeadPhone] = useState("");
const [phoneError, setPhoneError] = useState("");
const [open, setOpen] = useState(false);

const europeanCountries = [
  { code: "SI", dial: "+386", length: 8 },
  { code: "HR", dial: "+385", length: 8 },
  { code: "AT", dial: "+43", length: 10 },
  { code: "DE", dial: "+49", length: 10 },
  { code: "IT", dial: "+39", length: 10 },
  { code: "FR", dial: "+33", length: 9 },
  { code: "ES", dial: "+34", length: 9 },
  { code: "NL", dial: "+31", length: 9 },
  { code: "BE", dial: "+32", length: 9 },
  { code: "CH", dial: "+41", length: 9 },
  { code: "PL", dial: "+48", length: 9 },
  { code: "CZ", dial: "+420", length: 9 },
  { code: "SK", dial: "+421", length: 9 },
  { code: "HU", dial: "+36", length: 9 },
  { code: "RO", dial: "+40", length: 9 },
  { code: "BG", dial: "+359", length: 9 },
  { code: "GR", dial: "+30", length: 10 },
  { code: "SE", dial: "+46", length: 9 },
  { code: "NO", dial: "+47", length: 8 },
  { code: "DK", dial: "+45", length: 8 },
  { code: "FI", dial: "+358", length: 9 },
  { code: "IE", dial: "+353", length: 9 },
  { code: "PT", dial: "+351", length: 9 },
  { code: "RS", dial: "+381", length: 9 },
  { code: "BA", dial: "+387", length: 8 },
  { code: "ME", dial: "+382", length: 8 },
  { code: "MK", dial: "+389", length: 8 },
  { code: "AL", dial: "+355", length: 9 },
];
const [country, setCountry] = useState(europeanCountries[0]);
useEffect(() => {
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
    console.log("GEO DATA:", data);

      const countryCode = data.country_code;

      const found = europeanCountries.find(
        (c) => c.code === countryCode
      );

      if (found) {
        setCountry(found);


  // 🔥 DODAJ TO
  if (["SI"].includes(found.code)) {
  setLanguage("sl");
} else if (["HR", "BA", "RS", "ME", "MK"].includes(found.code)) {
  setLanguage("hr");
} else {
  setLanguage("en");
}
      }
    })
    .catch(() => {
      console.log("Geo detect failed");
    });
}, []);

const [modelLoaded, setModelLoaded] = useState(false);

const [newsletterConsent, setNewsletterConsent] = useState(false);

const [isSendingDesign, setIsSendingDesign] = useState(false);
const [saveDesignMessage, setSaveDesignMessage] = useState("");

const [includeDeliveryAssembly, setIncludeDeliveryAssembly] = useState(false);

const [modelKey, setModelKey] = useState<ModelKey>("wood36");

useEffect(() => {
  const pathModel = window.location.pathname
  .replace("/sales", "")
  .replace("/", "") as ModelKey;

  if (models[pathModel]) {
    setModelKey(pathModel);
  }
}, []);
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

  const deliveryAndAssemblyCost =
  isSalesMode && includeDeliveryAssembly
    ? deliveryCost + assemblyCost
    : 0;

const finalTotal = useMemo(
  () => productTotal + deliveryAndAssemblyCost,
  [productTotal, deliveryAndAssemblyCost]
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
  const doc = new jsPDF("p", "mm", "a4");

  // FONT
  const font = await loadFont("/fonts/Poppins-Regular.ttf");
  doc.addFileToVFS("Poppins-Regular.ttf", font);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal", "Identity-H");
  doc.setFont("Poppins", "normal");

  const pageW = 210;
  const pageH = 297;

  const dark = "#ffffff";
  const card = "#f7f7f5";
  const border = "#d9d9d4";
  const gold = "#b79e84";
  const white = "#111214";
  const muted = "#6f6a63";

  const safeText = (value: string) =>
    value
      .replace(/č/g, "č")
      .replace(/š/g, "š")
      .replace(/ž/g, "ž")
      .replace(/ć/g, "ć")
      .replace(/đ/g, "đ");

  const money = (value: number) =>
    value === 0
      ? t.included
      : `+€${value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const addBackground = () => {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");
};

  const addLogoText = (x = 18, y = 22, size = 22) => {
    doc.setTextColor(white);
    doc.setFontSize(size);
    doc.text("ZerroMax", x, y);
  };

  const sectionTitle = (title: string, y: number) => {
    doc.setTextColor(white);
    doc.setFontSize(18);
    doc.text(safeText(title), 18, y);

    doc.setDrawColor(gold);
    doc.setLineWidth(0.8);
    doc.line(18, y + 4, 58, y + 4);
  };

  const cardBox = (x: number, y: number, w: number, h: number) => {
    doc.setFillColor(card);
    doc.setDrawColor(border);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 4, 4, "FD");
  };

  const addFooter = () => {
    doc.setTextColor("#9a948c");
    doc.setFontSize(9);
    doc.text("ZerroMax © 2026", 18, 286);
    doc.text(`Offer ${offerNumber}`, 180, 286, { align: "right" });
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const modelImage = captureImage();

  // PAGE 1 — COVER
  addBackground();

 addLogoText(18, 24, 22);

  doc.setTextColor(gold);
  doc.setFontSize(10);
  doc.text("MODULAR LIVING CONFIGURATION", 18, 42);

  doc.setTextColor(white);
  doc.setFontSize(36);
  doc.text(modelDisplayName, 18, 62);
  doc.setFontSize(14);
doc.setTextColor(muted);
doc.text("Premium modular living", 18, 72);

  doc.setTextColor(muted);
  doc.setFontSize(13);
  doc.text(safeText(t.selectedConfiguration), 18, 72);

  if (modelImage) {
    try {
      doc.addImage(modelImage, "PNG", 28, 82, 154, 100);
    } catch {
      // ignore image if canvas export fails
    }
  }

  cardBox(18, 198, 174, 46);

  doc.setTextColor(muted);
  doc.setFontSize(11);
  doc.text(safeText(t.finalTotal), 28, 216);

  doc.setTextColor(white);
  doc.setFontSize(30);
  doc.text(`€${finalTotalFormatted}`, 28, 235);

  doc.setTextColor(muted);
  doc.setFontSize(10);
  doc.text(`${t.offerNumber}: ${offerNumber}`, 128, 216);
  doc.text(`${t.offerDate}: ${offerDate || new Date().toISOString().split("T")[0]}`, 128, 224);
  doc.text(`${t.model}: ${modelDisplayName}`, 128, 232);

  addFooter();

  // PAGE 2 — OFFER DETAILS + CONFIGURATION
  doc.addPage();
  addBackground();
  addLogoText();

  sectionTitle(t.offerDetails, 42);

  cardBox(18, 52, 174, 42);

  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text(safeText(t.customerName), 28, 66);
  doc.text(safeText(t.deliveryAddress), 110, 66);
  doc.text(safeText(t.distance), 28, 84);
  doc.text(safeText(t.offerDate), 110, 84);

  doc.setTextColor(white);
  doc.setFontSize(11);
  doc.text(safeText(customerName || t.notSpecified), 28, 73);
  doc.text(safeText(deliveryAddress || t.notSpecified), 110, 73);
  doc.text(`${deliveryKmNumber.toFixed(1)} km`, 28, 91);
  doc.text(offerDate || t.notSpecified, 110, 91);

  sectionTitle(t.selectedConfiguration, 118);

  const configItems = breakdown.filter((item) => item.label !== "Base");

  let y = 132;

  configItems.forEach((item) => {
    if (y > 265) {
      addFooter();
      doc.addPage();
      addBackground();
      addLogoText();
      sectionTitle(t.selectedConfiguration, 42);
      y = 56;
    }

    const label = safeText(formatBreakdownLabel(item.label));

    cardBox(18, y, 174, 11);

    doc.setTextColor(white);
    doc.setFontSize(10);
    doc.text(label, 26, y + 7.2);

    y += 14;
  });

  addFooter();

  // PAGE 3 — PRICE BREAKDOWN
  doc.addPage();
  addBackground();
  addLogoText();

  sectionTitle(t.productBreakdown, 42);

  y = 58;

  breakdown.forEach((item) => {
    if (y > 250) {
      addFooter();
      doc.addPage();
      addBackground();
      addLogoText();
      sectionTitle(t.productBreakdown, 42);
      y = 58;
    }

    const label =
      item.label === "Base" ? t.base : formatBreakdownLabel(item.label);

    cardBox(18, y, 174, 13);

    doc.setTextColor(white);
    doc.setFontSize(10);
    doc.text(safeText(label), 26, y + 8.5, { maxWidth: 120 });

    doc.setTextColor(gold);
    doc.text(money(item.value), 184, y + 8.5, { align: "right" });

    y += 16;
  });

  doc.setDrawColor(gold);
  doc.setLineWidth(0.8);
  doc.line(18, 258, 192, 258);

  doc.setTextColor(white);
  doc.setFontSize(16);
  doc.text(safeText(t.finalTotal), 18, 272);

  doc.setTextColor(gold);
  doc.setFontSize(24);
  doc.text(`€${finalTotalFormatted}`, 192, 272, { align: "right" });

  addFooter();

  doc.save(`ZerroMax-offer-${offerNumber}.pdf`);
};

  const getDisplayPrice = (groupId: string, optionKey: string) => {
  const csvKey = `${modelKey}.${groupId}.${optionKey}`;
  const csvPrice = priceMap[csvKey];

  if (typeof csvPrice === "number" && !Number.isNaN(csvPrice)) {
    return csvPrice;
  }

  console.warn(`Missing CSV display price: ${csvKey}`);
  return 0;
};

  const getOptionUiType = (groupId: string) => {
    if (["facade", "window_color", "roof_color", "bathroom_walls"].includes(groupId)) {
      return "swatches";
    }

    if (groupId === "boiler") {
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
          const displayPrice = getDisplayPrice("equipment", key)

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
    const displayPrice = getDisplayPrice("extra_insulation", entryKey)

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
            const displayPrice = getDisplayPrice(groupId, key,);

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
          const displayPrice = getDisplayPrice(groupId, key)

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

  const handleSaveDesign = async () => {
 await new Promise(requestAnimationFrame);
await new Promise(requestAnimationFrame);

const image = captureImage();
  console.log(image?.slice(0, 50));

  if (!leadEmail.trim()) {
  setSaveDesignMessage("Please enter your email.");
  return;
}

if (!leadPhone.trim()) {
  setSaveDesignMessage(
    language === "sl"
      ? "Prosimo vnesite telefonsko številko."
      : "Please enter your phone number."
  );
  return;
}

  setIsSendingDesign(true);
  setSaveDesignMessage("");

  try {
    const summary = breakdown
      .filter((item) => item.label !== "Base")
      .map((item) => {
  const match = item.label.match(/^(.+?) \((.+)\)$/);

  if (!match) return translateLabel(item.label);

  const [, group, option] = match;

  return `${translateLabel(group)} (${translateLabel(option)})`;
});

    const response = await fetch("/api/save-design", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: leadFirstName,
        lastName: leadLastName,
        email: leadEmail,
        phone: `${country.dial}${leadPhone.replace(/\D/g, "")}`,
        newsletterConsent,
        model: modelDisplayName,
        finalTotal: finalTotalFormatted,
        summary,
        image,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send design.");
    }

    setSaveDesignMessage("Design sent successfully.");
    setShowSaveModal(false);
  } catch (error) {
    console.error(error);
    setSaveDesignMessage("Something went wrong.");
  } finally {
    setIsSendingDesign(false);
  }
};

  
if (!mounted) return null;

return (
  <main style={{ minHeight: "100vh", background: "#111214", color: "#f3f0ea" }}>
    {(initialLoading || !modelLoaded) && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#111214",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#f3f0ea",
        }}
      >
        <img
          src="/logo-white.svg"
          alt="ZerroMax"
          style={{ width: 170, marginBottom: 40 }}
        />

        <div
          style={{
            width: 180,
            height: 2,
            background: "#2a2c31",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#b79e84",
              transition: "width 0.2s ease",
            }}
          />
        </div>

        <div style={{ fontSize: 34, fontWeight: 300, letterSpacing: "-0.04em" }}>
          {progress}%
        </div>
      </div>
    )}

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
          <ModelViewer
            onLoaded={() => setModelLoaded(true)}
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
            <a href="https://www.zerromax.com" target="_blank" rel="noopener noreferrer">
  <img
    src="/logo-white.svg"
    alt="ZerroMax"
    style={{ width: isMobile ? 150 : 180, height: "auto", cursor: "pointer" }}
  />
</a>

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
              <option value="hr">HR</option>
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
            {isSalesMode && (
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
            )}

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

            {isSalesMode && (
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
            )}
          </div>

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
        </div>

        {isSalesMode && (
          <section
            style={{
              background: "#17181b",
              border: "1px solid #2a2c31",
              borderRadius: 28,
              padding: 22,
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>
              {t.offerDetails}
            </h2>

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

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 8,
                  color: "#f3f0ea",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={includeDeliveryAssembly}
                  onChange={(e) => setIncludeDeliveryAssembly(e.target.checked)}
                />
                Include delivery and assembly
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>
                  {translateLabel(category.name)}
                </h2>

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
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>
                {translateLabel(category.name)}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 18 }}>
                {category.subcategories.map((subcategory: Subcategory) => {
                  const visible = isOptionGroupVisible(modelKey, config, subcategory.id);
                  if (!visible) return null;

                  return (
                    <div key={subcategory.id}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#f3f0ea" }}>
                        {translateLabel(subcategory.name)}
                      </h3>

                     {subcategory.id === "knee_wall" ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
    {Object.entries(subcategory.options.values).map(([key, option]) => {
      const selected = config.knee_wall === key;

      // ✅ THIS WAS MISSING
      const optionPrice = getDisplayPrice("knee_wall", key);

      return (
        <button
          key={key}
          onClick={() => {
            updateConfig("knee_wall", key);
            setViewMode(getViewModeForSection(category.id, subcategory.id));
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderRadius: 24,
            border: selected
              ? "2px solid #b79e84"
              : "1px solid #2a2c31",
            background: "#17181b",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: selected
                  ? "8px solid #b79e84"
                  : "2px solid #444",
                background: selected ? "#111214" : "transparent",
              }}
            />

            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#f3f0ea",
              }}
            >
              {translateLabel(option.label)}
            </div>
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#d0b08c",
            }}
          >
            {optionPrice === 0 ? t.included : priceLabel(optionPrice)}
          </div>
        </button>
      );
    })}
  </div>
) : (
  renderGroupByType(
    subcategory.id,
    subcategory.options.values as Record<string, OptionValue>,
    config[subcategory.id],
    (key) => {
      updateConfig(subcategory.id, key);
      setViewMode(getViewModeForSection(category.id, subcategory.id));
    }
  )
)}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section
          style={{
            background: "#17181b",
            border: "1px solid #2a2c31",
            borderRadius: 28,
            padding: 22,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>
            {t.summary}
          </h2>

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
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
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
              onLoaded={() => setModelLoaded(true)} 
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
          padding: isMobile ? "16px 18px 20px" : "14px 22px 18px",
          paddingBottom: isMobile
      ? "max(20px, env(safe-area-inset-bottom))"
      : 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#b7ab9a", marginBottom: 6 }}>
            {t.finalTotal}
          </div>
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
  onClick={() => setShowSaveModal(true)}
  style={{
    borderRadius: 18,
    background: "#b79e84",
    color: "#111214",
    padding: "18px 24px",
    fontWeight: 700,
    cursor: "pointer",
  }}
        >
          {isSalesMode ? t.exportOffer : t.requestQuote}
        </button>
      </div>
    </div>
{showSaveModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: isMobile ? 14 : 28,
      backdropFilter: "blur(12px)",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        background: "linear-gradient(145deg, #17181b 0%, #111214 100%)",
        border: "1px solid #2a2c31",
        borderRadius: 28,
        padding: isMobile ? 24 : 46,
        color: "#f3f0ea",
        position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
      }}
    >
      <button
        onClick={() => setShowSaveModal(false)}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "1px solid #3a3d44",
          background: "#1c1d21",
          color: "#f3f0ea",
          fontSize: 30,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: isMobile ? 38 : 64,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        {t.saveDesignTitle}
      </h1>

      <p
        style={{
          marginTop: 14,
          marginBottom: 34,
          fontSize: isMobile ? 18 : 24,
          color: "#b7ab9a",
        }}
      >
        {t.saveDesignSubtitle}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 20,
        }}
      >
        {[
          {
            label: t.firstName,
            value: leadFirstName,
            onChange: setLeadFirstName,
            placeholder: t.firstName,
            type: "text",
          },
          {
            label: t.lastName,
            value: leadLastName,
            onChange: setLeadLastName,
            placeholder: t.lastName,
            type: "text",
          },
          
          {
            label: t.email,
            value: leadEmail,
            onChange: setLeadEmail,
            placeholder: t.email,
            type: "email",
          },
        ].map((field) => (
          <div key={field.label}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#b7ab9a",
                marginBottom: 8,
              }}
            >
              {field.label}
            </div>

            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: "100%",
                height: 58,
                borderRadius: 16,
                border: "1px solid #3a3d44",
                background: "#1c1d21",
                color: "#f3f0ea",
                padding: "0 16px",
                fontSize: 17,
                outline: "none",
              }}
            />
          </div>
        ))}
<div>
  <div style={{ marginBottom: 8, fontWeight: 700 }}>
    {language === "sl" ? "Telefon *" : "Phone number *"}
  </div>

  <div style={{ display: "flex", flexDirection: "column" }}>
    
    <div style={{ display: "flex", gap: 10 }}>
      
     <div style={{ position: "relative" }}>
  <div
    onClick={() => setOpen(!open)}
    style={{
      borderRadius: 12,
      border: "1px solid #3a3d44",
      background: "#1c1d21",
      color: "#f3f0ea",
      padding: "0 12px",
      height: 58,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
    }}
  >
    {country.code} {country.dial}
  </div>

  {open && (
    <div
      style={{
        position: "absolute",
        top: "110%",
        left: 0,
        width: 180,
        maxHeight: 240,
        overflowY: "auto",
        background: "#1c1d21",
        border: "1px solid #3a3d44",
        borderRadius: 12,
        zIndex: 9999,
      }}
    >
      {europeanCountries.map((c) => (
        <div
          key={c.dial}
          onClick={() => {
            setCountry(c);
            setOpen(false);
          }}
          style={{
            padding: "10px 12px",
            cursor: "pointer",
          }}
        >
          {c.code} {c.dial}
        </div>
      ))}
    </div>
  )}
</div>

      <input
        type="tel"
        value={leadPhone}
        onChange={(e) => {
          let value = e.target.value.replace(/\D/g, "");

          // 🔥 AUTO FORMAT (Slovenia style)
          if (country.code === "SI" || country.code === "HR") {
            if (value.length > 2 && value.length <= 5) {
              value = value.replace(/(\d{2})(\d+)/, "$1 $2");
            } else if (value.length > 5) {
              value = value.replace(/(\d{2})(\d{3})(\d+)/, "$1 $2 $3");
            }
          }

          setLeadPhone(value);
          setPhoneError(""); // ne validiraj med tipkanjem
        }}

       onBlur={() => {
  const cleaned = leadPhone.replace(/\D/g, "");
  const isAllZeros = /^0+$/.test(cleaned);

  if (cleaned.length === 0) return;

  if (cleaned.length !== country.length || isAllZeros) {
    setPhoneError(
      language === "sl"
        ? "Telefonska številka ni veljavna"
        : "Invalid phone number"
    );
  } else {
    setPhoneError("");
  }
}}

        placeholder="31 234 567"
        style={{
          flex: 1,
          height: 58,
          borderRadius: 16,
          border: phoneError
            ? "1px solid #e5484d"
            : "1px solid #3a3d44",
          background: "#1c1d21",
          color: "#f3f0ea",
          padding: "0 16px",
          fontSize: 17,
        }}
      />
    </div>

    {phoneError && (
      <div style={{ color: "#e5484d", fontSize: 13, marginTop: 6 }}>
        {phoneError}
      </div>
    )}
  </div>

  <div style={{ fontSize: 12, color: "#8f887f", marginTop: 6 }}>
    * {language === "sl" ? "Obvezno" : "Required"}
  </div>
</div>

      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 28,
          fontSize: 17,
          color: "#f3f0ea",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={newsletterConsent}
          onChange={(e) => setNewsletterConsent(e.target.checked)}
          style={{
            width: 22,
            height: 22,
            accentColor: "#b79e84",
            cursor: "pointer",
          }}
        />
        {t.receiveUpdates}
      </label>

      <p
        style={{
          marginTop: 10,
          fontSize: 14,
          lineHeight: 1.45,
          color: "#8f887f",
        }}
      >
        {t.unsubscribeNote}
      </p>

      <button
         onClick={handleSaveDesign}
  disabled={isSendingDesign || !leadEmail || !leadPhone}
  style={{
          width: "100%",
          marginTop: 34,
          height: 64,
          borderRadius: 18,
          border: "1px solid #b79e84",
          background: "#b79e84",
          color: "#111214",
          fontSize: 20,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {isSendingDesign ? t.sending : t.send}
      </button>
      {saveDesignMessage && (
  <div style={{ marginTop: 14, color: "#b79e84", fontWeight: 700 }}>
    {saveDesignMessage}
  </div>
)}
    </div>
  </div>
)}

  </main>
); 
}