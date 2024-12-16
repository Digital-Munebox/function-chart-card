// Éditeur de configuration
class FunctionChartCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = { ...config };
    this.render();
  }

  _valueChanged(ev) {
    if (!this._config) return;

    const target = ev.target;
    const value = target.type === 'checkbox' ? target.checked : 
                  target.type === 'number' ? parseFloat(target.value) : 
                  target.value;
    
    if (target.configValue) {
      if (target.configValue.includes('.')) {
        const parts = target.configValue.split('.');
        let current = this._config;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      } else {
        this._config[target.configValue] = value;
      }
    }

    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._config) return;

    this.shadowRoot.innerHTML = `
      <style>
        ha-switch {
          padding: 16px 0;
        }
        .side-by-side {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }
        .group {
          margin-top: 16px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .group-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
      </style>
      <div>
        <!-- Paramètres généraux -->
        <div class="group">
          <div class="group-title">Paramètres généraux</div>
          <div class="side-by-side">
            <ha-textfield
              label="Titre"
              .value="${this._config.title || ''}"
              .configValue=${'title'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Couleur de fond"
              type="color"
              .value="${this._config.backgroundColor || '#ffffff'}"
              .configValue=${'backgroundColor'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
        </div>

        <!-- Configuration de la grille -->
        <div class="group">
          <div class="group-title">Grille</div>
          <div class="side-by-side">
            <ha-switch
              .checked=${this._config.showGrid !== false}
              .configValue=${'showGrid'}
              @change=${this._valueChanged}
            ></ha-switch>
            <span>Afficher la grille</span>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Couleur de la grille"
              type="color"
              .value="${this._config.gridColor || '#dddddd'}"
              .configValue=${'gridColor'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
        </div>

        <!-- Configuration des axes -->
        <div class="group">
          <div class="group-title">Axe X</div>
          <div class="side-by-side">
            <ha-textfield
              type="number"
              label="Minimum"
              .value="${this._config.xRange?.[0] ?? -5}"
              .configValue=${'xRange.0'}
              @input=${this._valueChanged}
            ></ha-textfield>
            <ha-textfield
              type="number"
              label="Maximum"
              .value="${this._config.xRange?.[1] ?? 5}"
              .configValue=${'xRange.1'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Label X"
              .value="${this._config.xLabel || ''}"
              .configValue=${'xLabel'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
        </div>

        <div class="group">
          <div class="group-title">Axe Y</div>
          <div class="side-by-side">
            <ha-textfield
              type="number"
              label="Minimum"
              .value="${this._config.yRange?.[0] ?? -2}"
              .configValue=${'yRange.0'}
              @input=${this._valueChanged}
            ></ha-textfield>
            <ha-textfield
              type="number"
              label="Maximum"
              .value="${this._config.yRange?.[1] ?? 2}"
              .configValue=${'yRange.1'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Label Y"
              .value="${this._config.yLabel || ''}"
              .configValue=${'yLabel'}
              @input=${this._valueChanged}
            ></ha-textfield>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('function-chart-card-editor', FunctionChartCardEditor);

// Composant principal
class FunctionChartCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.functions || !Array.isArray(config.functions)) {
      throw new Error('You need to define at least one function');
    }
    this._config = config;
    this.render();
  }

  static getConfigElement() {
    return document.createElement('function-chart-card-editor');
  }

  static getStubConfig() {
    return {
      title: "Function Chart",
      showGrid: true,
      backgroundColor: '#ffffff',
      gridColor: '#dddddd',
      xRange: [-5, 5],
      yRange: [-2, 2],
      xLabel: "X",
      yLabel: "Y",
      functions: [
        {
          expression: "Math.sin(x)",
          name: "Sinus",
          color: "#FF0000"
        }
      ]
    };
  }

  generatePoints(expression, xMin = -5, xMax = 5, steps = 100) {
    const points = [];
    const dx = (xMax - xMin) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      try {
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

  createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }

  addAxisLabels(svg, width, height, margin) {
    const xMin = this._config.xRange?.[0] ?? -5;
    const xMax = this._config.xRange?.[1] ?? 5;
    const yMin = this._config.yRange?.[0] ?? -2;
    const yMax = this._config.yRange?.[1] ?? 2;
    
    // X-axis labels
    const xStep = (width - 2 * margin) / 10;
    for (let i = 0; i <= 10; i++) {
      const x = margin + i * xStep;
      const value = xMin + (i / 10) * (xMax - xMin);
      const text = this.createSvgElement('text', {
        x,
        y: height - margin + 20,
        'text-anchor': 'middle',
        'font-size': '12'
      });
      text.textContent = value.toFixed(1);
      svg.appendChild(text);
    }

    // Y-axis labels
    const yStep = (height - 2 * margin) / 10;
    for (let i = 0; i <= 10; i++) {
      const y = height - margin - i * yStep;
      const value = yMin + (i / 10) * (yMax - yMin);
      const text = this.createSvgElement('text', {
        x: margin - 10,
        y,
        'text-anchor': 'end',
        'alignment-baseline': 'middle',
        'font-size': '12'
      });
      text.textContent = value.toFixed(1);
      svg.appendChild(text);
    }

    // Axis labels
    if (this._config.xLabel) {
      const xLabelText = this.createSvgElement('text', {
        x: width / 2,
        y: height - 10,
        'text-anchor': 'middle',
        'font-size': '14'
      });
      xLabelText.textContent = this._config.xLabel;
      svg.appendChild(xLabelText);
    }

    if (this._config.yLabel) {
      const yLabelText = this.createSvgElement('text', {
        x: 15,
        y: height / 2,
        'text-anchor': 'middle',
        'font-size': '14',
        transform: `rotate(-90, 15, ${height / 2})`
      });
      yLabelText.textContent = this._config.yLabel;
      svg.appendChild(yLabelText);
    }
  }

  render() {
    // Créer les éléments de base
    const card = document.createElement('ha-card');
    const content = document.createElement('div');
    content.style.padding = '16px';

    // Ajouter le titre
    const title = document.createElement('h2');
    title.style.padding = '16px';
    title.textContent = this._config.title || 'Function Chart';
    card.appendChild(title);

    // Ajouter la légende
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '16px';
    legend.style.marginBottom = '8px';

    this._config.functions.forEach(func => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';

      const color = document.createElement('div');
      color.style.width = '20px';
      color.style.height = '3px';
      color.style.backgroundColor = func.color;

      const name = document.createElement('span');
      name.textContent = func.name;

      item.appendChild(color);
      item.appendChild(name);
      legend.appendChild(item);
    });
    content.appendChild(legend);

    // Créer le SVG
    const width = 400;
    const height = 300;
    const margin = 50;
    const backgroundColor = this._config.backgroundColor || '#ffffff';
    const gridColor = this._config.gridColor || '#dddddd';

    const svg = this.createSvgElement('svg', {
      width,
      height,
      style: `background: ${backgroundColor}`,
      viewBox: `0 0 ${width} ${height}`
    });

    // Ajouter la grille si activée
    if (this._config.showGrid !== false) {
      for (let i = 0; i <= 10; i++) {
        const x = margin + i * (width - 2 * margin) / 10;
        const y = margin + i * (height - 2 * margin) / 10;

        const vLine = this.createSvgElement('line', {
          x1: x,
          y1: margin,
          x2: x,
          y2: height - margin,
          stroke: gridColor,
          'stroke-width': '1',
          'stroke-dasharray': '4,4'
        });

        const hLine = this.createSvgElement('line', {
          x1: margin,
          y1: y,
          x2: width - margin,
          y2: y,
          stroke: gridColor,
          'stroke-width': '1',
          'stroke-dasharray': '4,4'
        });

        svg.appendChild(vLine);
        svg.appendChild(hLine);
      }
    }

    // Ajouter les axes
    const xAxis = this.createSvgElement('line', {
      x1: margin,
      y1: height - margin,
      x2: width - margin,
      y2: height - margin,
      stroke: 'black',
      'stroke-width': '2'
    });

    const yAxis = this.createSvgElement('line', {
      x1: margin,
      y1: margin,
      x2: margin,
      y2: height - margin,
      stroke: 'black',
      'stroke-width': '2'
    });

    svg.appendChild(xAxis);
    svg.appendChild(yAxis);

    // Ajouter les étiquettes des axes
    this.addAxisLabels(svg, width, height, margin);

    // Ajouter les fonctions
    const xMin = this._config.xRange?.[0] ?? -5;
    const xMax = this._config.xRange?.[1] ?? 5;
    const yMin = this._config.yRange?.[0] ?? -2;
    const yMax = this._config.yRange?.[1] ?? 2;

    this._config.functions.forEach(func => {
      const points = this.generatePoints(func.expression, xMin, xMax);
      const pathData = points.map((point, i) => {
        const x = margin + ((point[0] - xMin) / (xMax - xMin)) * (width - 2 * margin);
        const y = height - (margin + ((point[1] - yMin) / (yMax - yMin)) * (height - 2 * margin));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      const path = this.createSvgElement('path', {
        d: pathData,
        stroke: func.color,
        fill: 'none',
        'stroke-width': '2'
      });

      svg.appendChild(path);
    });

    content.appendChild(svg);
    card.appendChild(content);

    // Mettre à jour le shadowRoot
    this.shadowRoot.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      ha-card {
        padding: 0;
        overflow: hidden;
      }
      h2 {
        margin: 0;
        padding: 16px;
        color: var(--primary-text-color);
      }
      .content {
        padding: 16px;
      }
      svg {
        display: block;
        width: 100%;
        height: auto;
      }
      text {
        fill: var(--primary-text-color);
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 16px;
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
    `;
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);
  }
}

// Enregistrement du composant
customElements.define('function-chart-card', FunctionChartCard);

// Déclaration pour Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "function-chart-card",
  name: "Function Chart Card",
  description: "A card that displays mathematical functions"
});
