(function () {
  const AXIS_META = [
    { id: "floral", label: "フローラル" },
    { id: "fresh", label: "フレッシュ" },
    { id: "woody", label: "ウッディ" },
    { id: "spicy", label: "スパイシー" },
    { id: "sweet", label: "スウィート" }
  ];
  const FALLBACK_AXES = {
    floral: 50,
    fresh: 50,
    woody: 50,
    spicy: 50,
    sweet: 50
  };

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product_id") || "prd-preview";
  const productIdEl = document.getElementById("product-id");
  const productDescriptionEl = document.getElementById("product-description");
  const productAxisStatsEl = document.getElementById("product-axis-stats");
  const productOrderYesEl = document.getElementById("product-order-yes");
  const productOrderResultEl = document.getElementById("product-order-result");
  const productOrderCopyEl = document.getElementById("product-order-copy");
  const gridPolygons = document.getElementById("grid-polygons");
  const axisLines = document.getElementById("axis-lines");
  const axisLabels = document.getElementById("axis-labels");
  const radarShape = document.getElementById("radar-shape");
  const vertexDots = document.getElementById("vertex-dots");

  function clampValue(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function polarToCartesian(centerX, centerY, radius, angle) {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  const axes = AXIS_META.map((axis) => ({
    ...axis,
    value: clampValue(params.get(axis.id) || FALLBACK_AXES[axis.id])
  }));

  function createRadarPoints(scale = 1) {
    const center = 180;
    const maxRadius = 108;
    return axes.map((axis, index) => {
      const angle = (-Math.PI / 2) + (index * Math.PI * 2 / axes.length);
      return polarToCartesian(center, center, maxRadius * scale * (axis.value / 100), angle);
    });
  }

  function renderGraph() {
    const center = 180;
    const maxRadius = 108;
    gridPolygons.innerHTML = "";
    axisLines.innerHTML = "";
    axisLabels.innerHTML = "";

    [0.25, 0.5, 0.75, 1].forEach((scale) => {
      const points = axes.map((axis, index) => {
        const angle = (-Math.PI / 2) + (index * Math.PI * 2 / axes.length);
        const point = polarToCartesian(center, center, maxRadius * scale, angle);
        return `${point.x},${point.y}`;
      }).join(" ");
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", points);
      gridPolygons.appendChild(polygon);
    });

    axes.forEach((axis, index) => {
      const angle = (-Math.PI / 2) + (index * Math.PI * 2 / axes.length);
      const axisEnd = polarToCartesian(center, center, maxRadius, angle);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(center));
      line.setAttribute("y1", String(center));
      line.setAttribute("x2", String(axisEnd.x));
      line.setAttribute("y2", String(axisEnd.y));
      axisLines.appendChild(line);

      const labelPoint = polarToCartesian(center, center, maxRadius + 28, angle);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(labelPoint.x));
      label.setAttribute("y", String(labelPoint.y));
      label.textContent = axis.label;
      axisLabels.appendChild(label);
    });

    const points = createRadarPoints();
    radarShape.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
    vertexDots.innerHTML = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"></circle>`).join("");
  }

  function renderAxisStats() {
    if (!productAxisStatsEl) return;
    productAxisStatsEl.innerHTML = axes.map((axis) => `
      <div class="product-axis-stat">
        <span>${axis.label}</span>
        <strong>${axis.value}</strong>
      </div>
    `).join("");
  }

  function renderProductMeta() {
    document.title = `${productId} | 商品予約`;
    if (productIdEl) {
      productIdEl.textContent = productId;
    }
    if (productDescriptionEl) {
      productDescriptionEl.textContent = `商品ID ${productId} の5軸バランスを表示しています。原料配合は公開していません。`;
    }
  }

  if (productOrderYesEl) {
    productOrderYesEl.addEventListener("click", () => {
      if (productOrderResultEl) {
        productOrderResultEl.hidden = false;
      }
      if (productOrderCopyEl) {
        productOrderCopyEl.textContent = `現在は予約導線を準備中です。商品ID ${productId} を控えてスタッフへお問い合わせください。`;
      }
    });
  }

  renderProductMeta();
  renderGraph();
  renderAxisStats();
})();
