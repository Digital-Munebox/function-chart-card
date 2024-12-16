/**
 * Function Chart Card
 * Version: 2.0.1
 */

// Éditeur de configuration
class FunctionChartCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._entities = [];
  }

  static getDefaultConfig() {
    return {
      title: "Function Chart",
      showGrid: true,
      backgroundColor: '#ffffff',
      gridColor: '#dddddd',
      xRange: [-5, 5],
      yRange: [-2, 2],
      xLabel: "X",
      yLabel: "Y",
      functions: []
    };
  }

  async firstUpdated() {
    if (this._hass) {
      const states = this._hass.states;
      this._entities = Object.keys(states)
        .filter(entityId => {
          const state = states[entityId];
          return !isNaN(parseFloat(state.state));
        })
        .map(entityId => ({
          id: entityId,
          name: states[entityId].attributes.friendly_name || entityId,
          domain: entityId.split('.')[0]
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.firstUpdated();
  }

  setConfig(config) {
    this._config = {
      ...FunctionChartCardEditor.getDefaultConfig(),
      ...config
    };

    if (!Array.isArray(this._config.functions)) {
      this._config.functions = [];
    }

    if (!Array.isArray(this._config.xRange)) {
      this._config.xRange = [-5, 5];
    }
    if (!Array.isArray(this._config.yRange)) {
      this._config.yRange = [-2, 2];
    }

    this.render();
  }

  _valueChanged(ev) {
    if (!this._config) return;

    const target = ev.target;
    const value = this._parseValue(target);
    const configPath = target.configValue;

    if (configPath) {
      const newConfig = this._updateConfigValue(configPath, value);
      this._emit(newConfig);
    }
  }

  _parseValue(target) {
    let value = target.value;
    
    if (target.type === 'number') {
      value = parseFloat(value);
    } else if (target.type === 'checkbox') {
      value = target.checked;
    }
    
    return value;
  }

  _updateConfigValue(path, value) {
    const newConfig = { ...this._config };
    const parts = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    return newConfig;
  }

  _emit(config) {
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _addFunction(type = 'expression') {
    if (!this._config.functions) {
      this._config.functions = [];
    }

    const newFunction = type === 'entity' ? 
      {
        type: 'entity',
        entityId: '',
        name: `Entity ${this._config.functions.length + 1}`,
        color: this._getRandomColor()
      } :
      {
        type: 'expression',
        expression: "Math.sin(x)",
        name: `Function ${this._config.functions.length + 1}`,
        color: this._getRandomColor()
      };

    const newConfig = {
      ...this._config,
      functions: [...this._config.functions, newFunction]
    };

    this._emit(newConfig);
  }

  _removeFunction(index) {
    const newConfig = {
      ...this._config,
      functions: this._config.functions.filter((_, i) => i !== index)
    };

    this._emit(newConfig);
  }

  _getRandomColor() {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  _renderFunctionRow(func, index) {
    if (func.type === 'entity') {
      return `
        <div class="function-row">
          <ha-select
            label="Entité"
            .value="${func.entityId}"
            .configValue="functions.${index}.entityId"
            @change="${this._valueChanged}"
          >
            ${this._entities.map(entity => `
              <ha-list-item value="${entity.id}">${entity.name}</ha-list-item>
            `).join('')}
          </ha-select>
          <ha-textfield
            label="Nom"
            .value="${func.name}"
            .configValue="functions.${index}.name"
            @change="${this._valueChanged}"
          ></ha-textfield>
          <ha-textfield
            type="color"
            label="Couleur"
            .value="${func.color}"
            .configValue="functions.${index}.color"
            @change="${this._valueChanged}"
          ></ha-textfield>
          <ha-icon-button
            .path="${this._getTrashIcon()}"
            @click="${() => this._removeFunction(index)}"
          ></ha-icon-button>
        </div>
      `;
    }
    
    return `
      <div class="function-row">
        <ha-textfield
          label="Expression"
          .value="${func.expression}"
          .configValue="functions.${index}.expression"
          @change="${this._valueChanged}"
        ></ha-textfield>
        <ha-textfield
          label="Nom"
          .value="${func.name}"
          .configValue="functions.${index}.name"
          @change="${this._valueChanged}"
        ></ha-textfield>
        <ha-textfield
          type="color"
          label="Couleur"
          .value="${func.color}"
          .configValue="functions.${index}.color"
          @change="${this._valueChanged}"
        ></ha-textfield>
        <ha-icon-button
          .path="${this._getTrashIcon()}"
          @click="${() => this._removeFunction(index)}"
        ></ha-icon-button>
      </div>
    `;
  }

  _getTrashIcon() {
    return "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";
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
          padding: 16px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
        }
        .group-title {
          font-weight: bold;
          margin-bottom: 16px;
        }
        .function-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .button-row {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        ha-select {
          width: 100%;
        }
        ha-textfield {
          width: 100%;
        }
      </style>

      <div class="card-config">
        <!-- Paramètres généraux -->
        <div class="group">
          <div class="group-title">Paramètres généraux</div>
          <div class="side-by-side">
            <ha-textfield
              label="Titre"
              .value="${this._config.title || ''}"
              .configValue="title"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Couleur de fond"
              type="color"
              .value="${this._config.backgroundColor || '#ffffff'}"
              .configValue="backgroundColor"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
        </div>

        <!-- Configuration de la grille -->
        <div class="group">
          <div class="group-title">Grille</div>
          <div class="side-by-side">
            <ha-switch
              .checked="${this._config.showGrid !== false}"
              .configValue="showGrid"
              @change="${this._valueChanged}"
            ></ha-switch>
            <span>Afficher la grille</span>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Couleur de la grille"
              type="color"
              .value="${this._config.gridColor || '#dddddd'}"
              .configValue="gridColor"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
        </div>

        <!-- Configuration des axes -->
        <div class="group">
          <div class="group-title">Axes</div>
          <div class="side-by-side">
            <ha-textfield
              type="number"
              label="X Min"
              .value="${this._config.xRange?.[0] ?? -5}"
              .configValue="xRange.0"
              @change="${this._valueChanged}"
            ></ha-textfield>
            <ha-textfield
              type="number"
              label="X Max"
              .value="${this._config.xRange?.[1] ?? 5}"
              .configValue="xRange.1"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              type="number"
              label="Y Min"
              .value="${this._config.yRange?.[0] ?? -2}"
              .configValue="yRange.0"
              @change="${this._valueChanged}"
            ></ha-textfield>
            <ha-textfield
              type="number"
              label="Y Max"
              .value="${this._config.yRange?.[1] ?? 2}"
              .configValue="yRange.1"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
          <div class="side-by-side">
            <ha-textfield
              label="Label X"
              .value="${this._config.xLabel || ''}"
              .configValue="xLabel"
              @change="${this._valueChanged}"
            ></ha-textfield>
            <ha-textfield
              label="Label Y"
              .value="${this._config.yLabel || ''}"
              .configValue="yLabel"
              @change="${this._valueChanged}"
            ></ha-textfield>
          </div>
        </div>

        <!-- Fonctions -->
        <div class="group">
          <div class="group-title">Fonctions et Entités</div>
          ${(this._config.functions || []).map((func, index) => 
            this._renderFunctionRow(func, index)
          ).join('')}
          <div class="button-row">
            <ha-button
              @click="${() => this._addFunction('expression')}"
            >
              Ajouter une fonction
            </ha-button>
            <ha-button
              @click="${() => this._addFunction('entity')}"
            >
              Ajouter une entité
            </ha-button>
          </div>
        </div>
      </div>
    `;
  }
}

// Composant principal
class FunctionChartCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement('function-chart-card-editor');
  }

  static getStubConfig() {
    return FunctionChartCardEditor.getDefaultConfig();
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this._config = {
      ...FunctionChartCardEditor.getDefaultConfig(),
      ...config
    };

    if (!Array.isArray(this._config.functions)) {
      this._config.functions = [];
    }

    if (!Array.isArray(this._config.xRange)) {
      this._config.xRange = [-5, 5];
    }
    if (!Array.isArray(this._config.yRange)) {
      this._config.yRange = [-2, 2];
    }

    this._config.functions.forEach(func => {
      if (func.type === 'entity' && !func.entityId) {
        throw new Error('Entity functions must have an entityId');
      }
      if (func.type === 'expression' && !func.expression) {
        throw new Error('Expression functions must have an expression');
      }
    });

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  _getEntityValue(entityId) {
    if (!this._hass || !entityId) return null;
    const state = this._hass.states[entityId];
    if (!state) return null;
    const value = parseFloat(state.state);
    return isNaN(value) ? null : value;
  }

  generatePoints(func, xMin = -5, xMax = 5, steps = 100) {
    const points = [];
    const dx = (xMax - xMin) / steps;
    
    if (func.type === 'entity') {
      const value = this._getEntityValue(func.entityId);
      if (value !== null) {
        points.push([xMin, value]);
        points.push([xMax, value]);
      }
    } else {
      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * dx;
        try {
          const safeEval = new Function('x', `return ${func.expression}`);
          const y = safeEval(x);
          if (!isNaN(y) && isFinite(y)) {
            points.push([x, y]);
          }
        } catch (e) {
          console.error('Error evaluating expression:', e);
        }
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
    if (!this._config) return;

    const width = 400;
    const height = 300;
    const margin = 50;
    const backgroundColor = this._config.backgroundColor || '#ffffff';
    const gridColor = this._config.gridColor || '#dddddd';

    // Styles
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

    // Création de la carte
    const card = document.createElement('ha-card');
    const content = document.createElement('div');
    content.className = 'content';

    // Titre
    const title = document.createElement('h2');
    title.textContent = this._config.title || 'Function Chart';
    card.appendChild(title);

    // Légende
    const legend = document.createElement('div');
    legend.className = 'legend';

    this._config.functions.forEach(func => {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const colorDiv = document.createElement('div');
      colorDiv.className = 'legend-color';
      colorDiv.style.backgroundColor = func.color;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = func.name;

      item.appendChild(colorDiv);
      item.appendChild(nameSpan);
      legend.appendChild(item);
    });
    content.appendChild(legend);

    // Création du SVG
    const svg = this.createSvgElement('svg', {
      width,
      height,
      style: `background: ${backgroundColor}`,
      viewBox: `0 0 ${width} ${height}`
    });

    // Grille
    if (this._config.showGrid !== false) {
      const xStep = (width - 2 * margin) / 10;
      const yStep = (height - 2 * margin) / 10;

      for (let i = 0; i <= 10; i++) {
        const x = margin + i * xStep;
        const y = margin + i * yStep;

        const vLine = this.createSvgElement('line', {
          x1: x,
          y1: margin,
          x2: x,
          y2: height - margin,
          stroke: gridColor,
          'stroke-width': '1',
          'stroke-dasharray': '4,4'
        });
        svg.appendChild(vLine);

        const hLine = this.createSvgElement('line', {
          x1: margin,
          y1: y,
          x2: width - margin,
          y2: y,
          stroke: gridColor,
          'stroke-width': '1',
          'stroke-dasharray': '4,4'
        });
        svg.appendChild(hLine);
      }
    }

    // Axes
    const xAxis = this.createSvgElement('line', {
      x1: margin,
      y1: height - margin,
      x2: width - margin,
      y2: height - margin,
      stroke: 'black',
      'stroke-width': '2'
    });
    svg.appendChild(xAxis);

    const yAxis = this.createSvgElement('line', {
      x1: margin,
      y1: margin,
      x2: margin,
      y2: height - margin,
      stroke: 'black',
      'stroke-width': '2'
    });
    svg.appendChild(yAxis);

    // Labels des axes
    this.addAxisLabels(svg, width, height, margin);

    // Tracer les fonctions
    const xMin = this._config.xRange?.[0] ?? -5;
    const xMax = this._config.xRange?.[1] ?? 5;
    const yMin = this._config.yRange?.[0] ?? -2;
    const yMax = this._config.yRange?.[1] ?? 2;

    this._config.functions.forEach(func => {
      const points = this.generatePoints(func, xMin, xMax);
      if (points.length > 0) {
        const path = this.createSvgElement('path', {
          d: points.map((point, i) => {
            const x = margin + ((point[0] - xMin) / (xMax - xMin)) * (width - 2 * margin);
            const y = height - (margin + ((point[1] - yMin) / (yMax - yMin)) * (height - 2 * margin));
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' '),
          stroke: func.color,
          fill: 'none',
          'stroke-width': '2'
        });
        svg.appendChild(path);
      }
    });

    content.appendChild(svg);
    card.appendChild(content);

    // Mise à jour du shadowRoot
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);
  }
}

// Enregistrement des composants
customElements.define('function-chart-card-editor', FunctionChartCardEditor);
customElements.define('function-chart-card', FunctionChartCard);

// Déclaration pour Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "function-chart-card",
  name: "Function Chart Card",
  preview: true,
  description: "A card that displays mathematical functions and entity values",
  documentationURL: "https://github.com/your-repo/function-chart-card"
});

console.info("Function Chart Card registered successfully");
