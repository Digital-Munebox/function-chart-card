// Éditeur visuel
class FunctionChartCardEditor extends HTMLElement {
  static get properties() {
    return { hass: {}, config: {} };
  }

  setConfig(config) {
    this.config = config;
  }

  get _title() {
    return this.config.title || '';
  }

  get _showGrid() {
    return this.config.showGrid ?? true;
  }

  get _backgroundColor() {
    return this.config.backgroundColor || '#ffffff';
  }

  get _xRange() {
    return this.config.xRange || [-5, 5];
  }

  get _yRange() {
    return this.config.yRange || [-2, 2];
  }

  render() {
    if (!this.config) {
      return '';
    }

    return `
      <div class="card-config">
        <div class="side-by-side">
          <ha-textfield
            label="Titre"
            .value="${this._title}"
            .configValue="${"title"}"
            @input="${this._valueChanged}"
          ></ha-textfield>
        </div>

        <div class="side-by-side">
          <ha-switch
            .checked="${this._showGrid}"
            .configValue="${"showGrid"}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label">Afficher la grille</div>
        </div>

        <div class="side-by-side">
          <ha-textfield
            label="Couleur de fond"
            type="color"
            .value="${this._backgroundColor}"
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
                .value="${this._xRange[0]}"
                .configValue="${"xRange.0"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                type="number"
                label="Max"
                .value="${this._xRange[1]}"
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
                .value="${this._yRange[0]}"
                .configValue="${"yRange.0"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
              <ha-textfield
                type="number"
                label="Max"
                .value="${this._yRange[1]}"
                .configValue="${"yRange.1"}"
                @input="${this._valueChanged}"
              ></ha-textfield>
            </div>
          </div>
        </div>

        <div class="functions">
          <h3>Fonctions</h3>
          ${this.config.functions?.map((func, index) => this._functionTemplate(func, index)).join("") || ""}
          <ha-button
            @click="${this._addFunction}"
            class="add-function"
          >
            Ajouter une fonction
          </ha-button>
        </div>
      </div>
    `;
  }

  _functionTemplate(func, index) {
    return `
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
          .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
          @click="${() => this._removeFunction(index)}"
        ></ha-icon-button>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this.config || !this.hass) return;

    const target = ev.target;
    const configValue = target.configValue;
    let newValue = target.value;

    if (target.type === 'number') {
      newValue = parseFloat(newValue);
    }

    if (configValue) {
      if (configValue.includes('.')) {
        const parts = configValue.split('.');
        let newConfig = { ...this.config };
        let current = newConfig;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = newValue;
        this.config = newConfig;
      } else {
        this.config = {
          ...this.config,
          [configValue]: newValue
        };
      }
    }

    const event = new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _addFunction() {
    const functions = this.config.functions || [];
    this.config = {
      ...this.config,
      functions: [
        ...functions,
        {
          expression: 'Math.sin(x)',
          name: `Function ${functions.length + 1}`,
          color: '#ff0000'
        }
      ]
    };
    this._valueChanged({
      detail: {
        config: this.config
      }
    });
  }

  _removeFunction(index) {
    const functions = [...this.config.functions];
    functions.splice(index, 1);
    this.config = {
      ...this.config,
      functions
    };
    this._valueChanged({
      detail: {
        config: this.config
      }
    });
  }
}

customElements.define('function-chart-card-editor', FunctionChartCardEditor);

// Composant principal
class FunctionChartCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('function-chart-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'Function Chart',
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
    if (!this.initialized) {
      this.initialized = true;
      this.render();
    }
  }

  constructor() {
    super();
    this.initialized = false;
    this.config = {};
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
    if (!this.config.showGrid) {
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
    const xMin = this.config.xRange?.[0] ?? -5;
    const xMax = this.config.xRange?.[1] ?? 5;
    const yMin = this.config.yRange?.[0] ?? -2;
    const yMax = this.config.yRange?.[1] ?? 2;
    
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
    
    const xMin = this.config.xRange?.[0] ?? -5;
    const xMax = this.config.xRange?.[1] ?? 5;
    const yMin = this.config.yRange?.[0] ?? -2;
    const yMax = this.config.yRange?.[1] ?? 2;

    return points.map((point, i) => {
      const x = margin + ((point[0] - xMin) / (xMax - xMin)) * graphWidth;
      const y = height - (margin + ((point[1] - yMin) / (yMax - yMin)) * graphHeight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  setConfig(config) {
    this.config = config;
    this.render();
  }

  render() {
    const width = 400;
    const height = 300;
    const margin = 50;
    const backgroundColor = this.config.backgroundColor || '#ffffff';
    const functions = this.config.functions || [{
      expression: 'Math.sin(x)',
      color: '#ff0000',
      name: 'Example'
    }];

    this.innerHTML = `
      <ha-card>
        <div style="padding: 16px">
          <h2>${this.config.title || 'Function Chart'}</h2>
          
          <div class="legend" style="margin-bottom: 8px;">
            ${functions.map(func => `
              <span style="margin-right: 16px;">
                <span style="display: inline-block; width: 20px; height: 3px; background: ${func.color}; margin-right: 8px;"></span>
                ${func.name}
              </span>
            `).join('')}
          </div>

          <svg width="${width}" height="${height}" style="background: ${backgroundColor};">
            <!-- Grid -->
            ${this.generateGrid(width, height, margin)}
            
            <!-- Axes -->
            <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" 
                  stroke="black" stroke-width="2"/>
            <line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" 
                  stroke="black" stroke-width="2"/>
            
            <!-- Axis Labels -->
            ${this.generateAxisLabels(width, height, margin)}

            <!-- Functions -->
            ${functions.map(func => {
              const points = this.generatePoints(
                func.expression,
                this.config.xRange?.[0] ?? -5,
                this.config.xRange?.[1] ?? 5
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

customElements.define('function-chart-card', FunctionChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "function-chart-card",
  name: "Function Chart Card",
  description: "A card that displays mathematical functions"
});
