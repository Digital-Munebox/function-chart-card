class FunctionChartCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;

    const target = ev.target;
    let newValue = ev.detail?.value ?? target.value;
    let configValue = target.configValue;

    // Gestion des valeurs numériques
    if (target.type === 'number') {
      newValue = parseFloat(newValue);
    }

    // Création d'un nouvel objet de configuration
    const newConfig = { ...this._config };
    if (configValue && configValue.includes('.')) {
      // Gestion des propriétés imbriquées (ex: xRange.0)
      const parts = configValue.split('.');
      let current = newConfig;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = newValue;
    } else if (configValue) {
      newConfig[configValue] = newValue;
    }

    // Dispatch de l'événement de changement
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _addFunction() {
    const functions = this._config.functions || [];
    const newConfig = {
      ...this._config,
      functions: [
        ...functions,
        {
          expression: 'Math.sin(x)',
          name: `Function ${functions.length + 1}`,
          color: '#ff0000'
        }
      ]
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _removeFunction(index) {
    const functions = [...this._config.functions];
    functions.splice(index, 1);
    const newConfig = {
      ...this._config,
      functions
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _render() {
    if (!this._config) return;

    const style = document.createElement('style');
    style.textContent = `
      .card-config {
        padding: 16px;
      }
      .side-by-side {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .functions {
        margin-top: 16px;
      }
      .function-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      ha-textfield {
        min-width: 120px;
      }
      ha-switch {
        margin-right: 8px;
      }
      .switch-label {
        color: var(--primary-text-color);
      }
    `;

    const content = `
      <div class="card-config">
        <div class="side-by-side">
          <ha-textfield
            label="Titre"
            .value="${this._config.title || ''}"
            .configValue="${"title"}"
            @input="${this._valueChanged}"
          ></ha-textfield>
        </div>

        <div class="side-by-side">
          <ha-switch
            .checked="${this._config.showGrid ?? true}"
            .configValue="${"showGrid"}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label">Afficher la grille</div>
        </div>

        <div class="side-by-side">
          <ha-textfield
            label="Couleur de fond"
            type="color"
            .value="${this._config.backgroundColor || '#ffffff'}"
            .configValue="${"backgroundColor"}"
            @input="${this._valueChanged}"
          ></ha-textfield>
        </div>

        <div class="range-inputs">
          <div class="range-group">
            <h3>Plage X</h3>
            <div class="side-by-side">
              <ha-textfield
                type="number"
                label="Min"
                .value="${this._config.xRange?.[0] ?? -5}"
                .configValue="${"xRange.0"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                type="number"
                label="Max"
                .value="${this._config.xRange?.[1] ?? 5}"
                .configValue="${"xRange.1"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
            </div>
          </div>

          <div class="range-group">
            <h3>Plage Y</h3>
            <div class="side-by-side">
              <ha-textfield
                type="number"
                label="Min"
                .value="${this._config.yRange?.[0] ?? -2}"
                .configValue="${"yRange.0"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                type="number"
                label="Max"
                .value="${this._config.yRange?.[1] ?? 2}"
                .configValue="${"yRange.1"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
            </div>
          </div>
        </div>

        <div class="functions">
          <h3>Fonctions</h3>
          ${(this._config.functions || []).map((func, index) => `
            <div class="function-row">
              <ha-textfield
                label="Expression"
                .value="${func.expression}"
                .configValue="${`functions.${index}.expression`}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                label="Nom"
                .value="${func.name}"
                .configValue="${`functions.${index}.name`}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                type="color"
                label="Couleur"
                .value="${func.color}"
                .configValue="${`functions.${index}.color`}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-icon-button
                .path="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                @click="${() => this._removeFunction(index)}"
              ></ha-icon-button>
            </div>
          `).join("")}
          <ha-button
            @click="${this._addFunction}"
            class="add-function"
          >
            Ajouter une fonction
          </ha-button>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    const container = document.createElement('div');
    container.innerHTML = content;
    this.shadowRoot.appendChild(container);
  }
}

customElements.define('function-chart-editor', FunctionChartCardEditor);

// Composant principal
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
    if (!config.functions && !Array.isArray(config.functions)) {
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
        let y = eval(expression.replace(/x/g, x));
        points.push([x, y]);
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

    for (let i = 0; i <= steps; i++) {
      const x = margin + i * xStep;
      grid += `<line x1="${x}" y1="${margin}" x2="${x}" y2="${height - margin}" 
              stroke="#ddd" stroke-width="1" stroke-dasharray="4,4"/>`;
    }

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

    for (let i = 0; i <= 10; i++) {
      const x = margin + i * stepX;
      const value = xMin + (i * (xMax - xMin)) / 10;
      labels += `<text x="${x}" y="${height - margin + 20}" 
                text-anchor="middle" font-size="12">${value.toFixed(1)}</text>`;
    }

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
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  render() {
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
    `;

    const content = `
      <ha-card>
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
      </ha-card>
    `;
  }
}

customElements.define('function-chart', FunctionChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "function-chart",
  name: "Function Chart",
  description: "A card that displays mathematical functions"
});
