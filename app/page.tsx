"use client";

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

export default function Home() {
  const modelKey: ModelKey = "wood36";
  const model = models[modelKey];

  const today = new Date().toISOString().split("T")[0];

  const [customerName, setCustomerName] = useState("");
  const [offerDate, setOfferDate] = useState(today);
  const [offerNumber, setOfferNumber] = useState("ZM-2026-001");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"exterior" | "interior" | "bathroom">("exterior");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryKm, setDeliveryKm] = useState("0");

  const assemblyCost = 1500;

  const [config, setConfig] = useState<ConfigState>(() => {
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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      Object.keys(initialConfig).forEach((key) => {
        const value = params.get(key);
        if (value) {
          initialConfig[key] = value;
        }
      });

      const addressParam = params.get("deliveryAddress");
      const kmParam = params.get("deliveryKm");

      if (addressParam) setDeliveryAddress(addressParam);
      if (kmParam) setDeliveryKm(kmParam);
    }

    return initialConfig;
  });

  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(config).forEach(([key, value]) => {
      params.set(key, value);
    });

    if (deliveryAddress.trim()) {
      params.set("deliveryAddress", deliveryAddress);
    }

    params.set("deliveryKm", deliveryKm || "0");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [config, deliveryAddress, deliveryKm]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    const params = new URLSearchParams();

    Object.entries(config).forEach(([key, value]) => {
      params.set(key, value);
    });

    if (deliveryAddress.trim()) {
      params.set("deliveryAddress", deliveryAddress);
    }

    params.set("deliveryKm", deliveryKm || "0");

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [config, deliveryAddress, deliveryKm]);

  const productTotal = useMemo(() => {
    return calculatePrice(modelKey, config);
  }, [modelKey, config]);

  const breakdown = useMemo(() => {
    return getBreakdown(modelKey, config);
  }, [modelKey, config]);

  const deliveryKmNumber = useMemo(() => {
    const parsed = parseFloat(deliveryKm);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [deliveryKm]);

  const deliveryCost = useMemo(() => {
    return deliveryKmNumber * 1.8;
  }, [deliveryKmNumber]);

  const finalTotal = useMemo(() => {
    return productTotal + deliveryCost + assemblyCost;
  }, [productTotal, deliveryCost]);

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

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy link.");
    }
  };

  const priceLabel = (value: number) => {
    if (value === 0) return "Included";
    return `+€${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const exportTxt = () => {
    const breakdownText = breakdown
      .map((item) => {
        const valueText =
          item.value === 0
            ? "Included"
            : `+€${item.value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
        return `${item.label}: ${valueText}`;
      })
      .join("\n");

    const content = `ZERROMAX OFFER

Customer: ${customerName || "Not specified"}
Offer date: ${offerDate}
Offer number: ${offerNumber}
Delivery address: ${deliveryAddress || "Not specified"}
Distance: ${deliveryKmNumber.toFixed(1)} km

Model: ${model.name}

PRODUCT BREAKDOWN
${breakdownText}

FINAL TOTAL (including delivery and assembly): €${finalTotalFormatted}

Share URL:
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

  const exportPdf = () => {
    const doc = new jsPDF();
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
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("ZerroMax", 20, 22);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Offer", 160, 20, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Offer No: ${offerNumber}`, 160, 28, { align: "right" });
      doc.text(`Date: ${offerDate}`, 160, 34, { align: "right" });

      y = 55;
      doc.line(20, y, 190, y);

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Customer", 20, y);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(customerName || "Not specified", 20, y);

      y += 8;
      doc.text(`Delivery: ${deliveryAddress || "Not specified"}`, 20, y);

      y += 8;
      doc.text(`Distance: ${deliveryKmNumber.toFixed(1)} km`, 20, y);

      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Configuration Summary", 20, y);

      breakdown.forEach((item) => {
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(item.label, 20, y);
      });

      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Product Breakdown", 20, y);

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      breakdown.forEach((item) => {
        const valueText =
          item.value === 0
            ? "Included"
            : `+€${item.value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;

        doc.text(item.label, 20, y);
        doc.text(valueText, 180, y, { align: "right" });
        y += 8;
      });

      y += 4;
      doc.line(20, y, 190, y);

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Final Total", 20, y);
      doc.text(`€${finalTotalFormatted}`, 180, y, { align: "right" });

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Share URL: ${shareUrl}`, 20, y);

      doc.save(`ZerroMax-offer-${offerNumber}.pdf`);
    };

    logo.onload = () => drawPdf(true);
    logo.onerror = () => drawPdf(false);
  };

  return (
    <main className="app-shell">
      <div className="app-sidebar">
        <img
          src="/logo-white.svg"
          alt="ZerroMax"
          style={{ width: "170px", height: "auto" }}
        />

        <div className="price-card">
          <div className="price-card-label">Total Price</div>
          <div className="price-card-value">€{finalTotalFormatted}</div>
        </div>

        <div className="config-section">
          <h2 className="config-title">View</h2>

          <div className="option-row">
            <div className="option-card">
              <button
                className={viewMode === "exterior" ? "option-button active" : "option-button"}
                onClick={() => setViewMode("exterior")}
              >
                Exterior View
              </button>
            </div>

            <div className="option-card">
              <button
                className={viewMode === "interior" ? "option-button active" : "option-button"}
                onClick={() => setViewMode("interior")}
              >
                Interior View
              </button>
            </div>

            <div className="option-card">
              <button
                className={viewMode === "bathroom" ? "option-button active" : "option-button"}
                onClick={() => setViewMode("bathroom")}
              >
                Bathroom View
              </button>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h2 className="config-title">Offer Details</h2>

          <div className="form-grid">
            <div>
              <div className="field-label">Customer Name</div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="config-input"
              />
            </div>

            <div>
              <div className="field-label">Offer Date</div>
              <input
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
                className="config-input"
              />
            </div>

            <div>
              <div className="field-label">Offer Number</div>
              <input
                type="text"
                value={offerNumber}
                onChange={(e) => setOfferNumber(e.target.value)}
                className="config-input"
              />
            </div>

            <div>
              <div className="field-label">Delivery Address</div>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                className="config-input"
              />
            </div>

            <div>
              <div className="field-label">Distance (km)</div>
              <input
                type="number"
                min="0"
                step="0.1"
                value={deliveryKm}
                onChange={(e) => setDeliveryKm(e.target.value)}
                placeholder="Enter distance in km"
                className="config-input"
              />
            </div>

            <div>
              <div className="field-label">Share Link</div>

              <div className="share-link-display">
                {shareUrl ? `${shareUrl.split("?")[0]}?...` : ""}
              </div>

              <button
                onClick={copyShareLink}
                className="action-button"
                style={{ marginTop: "10px", width: "100%" }}
              >
                {copied ? "Copied" : "Copy Full Link"}
              </button>
            </div>
          </div>
        </div>

        {model.categories.map((category: Category) => {
          if ("options" in category) {
            return (
              <div key={category.id} className="config-section">
                <h2 className="config-title">{category.name}</h2>

                <div className="option-row">
                  {Object.entries(category.options.values).map(([key, value]) => (
                    <div key={key} className="option-card">
                      <button
                        className={
                          config[category.id] === key
                            ? "option-button active"
                            : "option-button"
                        }
                        onClick={() => updateConfig(category.id, key)}
                      >
                        {value.label}
                      </button>
                      <div className="option-label">{priceLabel(value.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={category.id} className="config-section">
              <h2 className="config-title">{category.name}</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {category.subcategories.map((subcategory: Subcategory) => {
                  const visible = isOptionGroupVisible(modelKey, config, subcategory.id);
                  if (!visible) return null;

                  return (
                    <div key={subcategory.id}>
                      <h3 className="config-subtitle">{subcategory.name}</h3>

                      <div className="option-row">
                        {Object.entries(subcategory.options.values).map(([key, value]) => (
                          <div key={key} className="option-card">
                            <button
                              className={
                                config[subcategory.id] === key
                                  ? "option-button active"
                                  : "option-button"
                              }
                              onClick={() => updateConfig(subcategory.id, key)}
                            >
                              {value.label}
                            </button>
                            <div className="option-label">{priceLabel(value.price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="summary-card">
          <h2 className="summary-title">Summary</h2>

          <div className="summary-list">
            {breakdown
              .filter((item) => item.label !== "Base")
              .map((item, index) => (
                <div key={index}>{item.label}</div>
              ))}
          </div>

          <div className="breakdown-list">
            <h3 className="breakdown-title">Product Breakdown</h3>

            {breakdown.map((item, index) => (
              <div key={index} className="breakdown-row">
                <span>{item.label}</span>
                <span>{item.value === 0 ? "Included" : priceLabel(item.value)}</span>
              </div>
            ))}

            <div className="breakdown-divider" />

            <div className="breakdown-total">
              <span>Total</span>
              <span>€{finalTotalFormatted}</span>
            </div>
          </div>

          <div className="action-row">
            <button onClick={exportTxt} className="action-button">
              Export TXT
            </button>
            <button onClick={exportPdf} className="action-button light">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="app-viewer">
        <ModelViewer
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
    </main>
  );
}