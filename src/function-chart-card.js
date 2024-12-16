class FunctionChartCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;

    const target = ev.target;
    let newValue = ev.detail?.value ?? target.value;
    const configValue = target.configValue;

    if (!configValue) return;

    // Handle numeric values
    if (target.type === 'number') {
      newValue = parseFloat(newValue);
    }

    // Handle switch values
    if (target.type === 'checkbox') {
      newValue = target.checked;
    }

    // Create new config object
    const newConfig = { ...this._config };
    
    if (configValue.includes('.')) {
      // Handle nested properties (e.g., functions.0.expression)
      const parts = configValue.split('.');
      let current = newConfig;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          if (!isNaN(parts[i + 1])) {
            // If next part is a number, create an array
            current[parts[i]] = [];
          } else {
            current[parts[i]] = {};
          }
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = newValue;
    } else {
      newConfig[configValue] = newValue;
    }

    // Dispatch config change event
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _addFunction() {
    if (!this._config.functions) {
      this._config.functions = [];
    }

    const newConfig = {
      ...this._config,
      functions: [
        ...this._config.functions,
        {
          expression: 'Math.sin(x)',
          name: `Function ${this._config.functions.length + 1}`,
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
    if (!this._config.functions) return;

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
      .switch-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .range-group {
        margin-bottom: 16px;
      }
    `;

    const content = document.createElement('div');
    content.className = 'card-config';
    content.innerHTML = `
      <div class="side-by-side">
        <ha-textfield
          label="Titre"
          .value="${this._config.title || ''}"
          .configValue="title"
          @change="${this._valueChanged}"
        ></ha-textfield>
      </div>

      <div class="switch-row">
        <ha-switch
          .checked="${this._config.showGrid ?? true}"
          .configValue="showGrid"
          @change="${this._valueChanged}"
        ></ha-switch>
        <span>Afficher la grille</span>
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

      <div class="range-group">
        <h3>Plage X</h3>
        <div class="side-by-side">
          <ha-textfield
            type="number"
            label="Min"
            .value="${this._config.xRange?.[0] ?? -5}"
            .configValue="xRange.0"
            @change="${this._valueChanged}"
          ></ha-textfield>
          <ha-textfield
            type="number"
            label="Max"
            .value="${this._config.xRange?.[1] ?? 5}"
            .configValue="xRange.1"
            @change="${this._valueChanged}"
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
            .configValue="yRange.0"
            @change="${this._valueChanged}"
          ></ha-textfield>
          <ha-textfield
            type="number"
            label="Max"
            .value="${this._config.yRange?.[1] ?? 2}"
            .configValue="yRange.1"
            @change="${this._valueChanged}"
          ></ha-textfield>
        </div>
      </div>

      <div class="functions">
        <h3>Fonctions</h3>
        ${(this._config.functions || []).map((func, index) => `
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
              .path="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
              @click="${() => this._removeFunction(index)}"
            ></ha-icon-button>
          </div>
        `).join('')}
        <ha-button
          @click="${this._addFunction}"
          class="add-function"
        >
          Ajouter une fonction
        </ha-button>
      </div>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(content);
  }
}

customElements.define('function-chart-editor', FunctionChartCardEditor);

// Main component implementation remains the same...
