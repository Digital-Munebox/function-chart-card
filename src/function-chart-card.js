class FunctionChartCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  static getConfigElement() {
    return document.createElement('function-chart-editor');
  }

  static getStubConfig() {
    return {
      title: "Function Chart",
      showGrid: true,
      backgroundColor: '#ffffff',
      xRange: [-5, 5],
      yRange: [-2, 2],
      functions: [
        {
          expression: 'Math.sin(x)',
          name: 'Sine',
          color: '#FF0000'
        }
      ]
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.functions || !Array.isArray(config.functions)) {
      throw new Error('You need to define at least one function');
    }
    this._config = config;
    this.render();
  }

  generatePoints(expression, xMin = -10, xMax = 10, steps = 100) {
    const points = [];
    const dx = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      try {
        // Crée une fonction sécurisée pour évaluer l'expression
        const safeEval = new Function('x', `return ${expression}`);
        const y = safeEval(x);
        if (!isNaN(y) && isFinite(y)) {
          points.push([x, y]);
        }
      } catch (e) {
        console.error('Error evaluating expression:', e);
      }
    }
    return points;
  }

  generateGrid(width, height, margin, steps = 10) {
    if (!this._config.showGrid) {
      return '';
    }

    const graphWidth = width - 2 * margin;
    const graphHeight = height - 2 * margin;
    const xStep = graphWidth / steps;
    const yStep = graphHeight / steps;
    let grid = '';

    // Vertical lines
    for (let i = 0; i <= steps; i++) {
      const x = margin + i * xStep;
      grid += `<line x1="${x}" y1="${margin}" x2="${x}" y2="${height - margin}" 
              stroke="#ddd" stroke-width="1" stroke-dasharray="4,4"/>`;
    }

    // Horizontal lines
    for (let i = 0; i <= steps; i++) {
      const y = margin + i * yStep;
      grid += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" 
              stroke="#ddd" stroke-width="1" stroke-dasharray="4,4"/>`;
    }

    return grid;
  }

  generateAxisLabels(width, height, margin) {
    const xMin = this._config.xRange?.[0] ?? -5;
    const xMax = this._config.xRange?.[1] ?? 5;
    const yMin = this._config.yRange?.[0] ?? -2;
    const yMax = this._config.yRange?.[1] ?? 2;
    
    const stepX = (width - 2 * margin) / 10;
    const stepY = (height - 2 * margin) / 10;
    let labels = '';

    // X-axis labels
    for (let i = 0; i <= 10; i++) {
      const x = margin + i * stepX;
      const value = xMin + (i * (xMax - xMin)) / 10;
      labels += `<text x="${x}" y="${height - margin + 20}" 
                text-anchor="middle" font-size="12">${value.toFixed(1)}</text>`;
    }

    // Y-axis labels
    for (let i = 0; i <= 10; i++) {
      const y = height - (margin + i * stepY);
      const value = yMin + (i * (yMax - yMin)) / 10;
      labels += `<text x="${margin - 10}" y="${y}" 
                text-anchor="end" alignment-baseline="middle" 
                font-size="12">${value.toFixed(1)}</text>`;
    }

    return labels;
  }

  generateSVGPath(points, width = 400, height = 300, margin = 50) {
    const graphWidth = width - 2 * margin;
    const graphHeight = height - 2 * margin;
    
    const xMin = this._config.xRange?.[0] ?? -5;
    const xMax = this._config.xRange?.[1] ?? 5;
    const yMin = this._config.yRange?.[0] ?? -2;
    const yMax = this._config.yRange?.[1] ?? 2;

    return points.map((point, i) => {
      const x = margin + ((point[0] - xMin) / (xMax - xMin)) * graphWidth;
      const y = height - (margin + ((point[1] - yMin) / (yMax - yMin)) * graphHeight);
      
      // Vérifier si le point est dans les limites
      if (x >= margin && x <= width - margin && y >= margin && y <= height - margin) {
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }
      return '';
    }).join(' ');
  }

  render() {
    if (!this._config) return;

    const width = 400;
    const height = 300;
    const margin = 50;
    const backgroundColor = this._config.backgroundColor || '#ffffff';
    const functions = this._config.functions || [{
      expression: 'Math.sin(x)',
      color: '#ff0000',
      name: 'Example'
    }];

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      ha-card {
        padding: 16px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 8px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .legend-color {
        width: 20px;
        height: 3px;
      }
      .card-content {
        padding: 16px;
      }
    `;

    const content = document.createElement('ha-card');
    content.innerHTML = `
      <h2 class="card-header">${this._config.title || 'Function Chart'}</h2>
      <div class="card-content">
        <div class="legend">
          ${functions.map(func => `
            <div class="legend-item">
              <div class="legend-color" style="background: ${func.color}"></div>
              <span>${func.name}</span>
            </div>
          `).join('')}
        </div>

        <svg width="${width}" height="${height}" style="background: ${backgroundColor};">
          ${this.generateGrid(width, height, margin)}
          
          <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" 
                stroke="black" stroke-width="2"/>
          <line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" 
                stroke="black" stroke-width="2"/>
          
          ${this.generateAxisLabels(width, height, margin)}

          ${functions.map(func => {
            const points = this.generatePoints(
              func.expression,
              this._config.xRange?.[0] ?? -5,
              this._config.xRange?.[1] ?? 5
            );
            const path = this.generateSVGPath(points, width, height, margin);
            return `<path d="${path}" stroke="${func.color}" fill="none" stroke-width="2"/>`;
          }).join('')}
        </svg>
      </div>
    `;

    // Clear and update shadowRoot
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(content);
  }
}

// Enregistrer les éléments personnalisés
customElements.define('function-chart-card', FunctionChartCard);
customElements.define('function-chart-editor', FunctionChartCardEditor);

// Déclarer la carte pour Home Assistant
if (!customElements.get('function-chart-card')) {
  console.error("Impossible d'enregistrer function-chart-card");
} else {
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "function-chart",
    name: "Function Chart",
    preview: false,
    description: "A card that displays mathematical functions"
  });
}
