// D'abord l'éditeur
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

// Ensuite la carte principale
class FunctionChartCard extends HTMLElement {
  // Ajout des méthodes pour l'éditeur
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

  // Votre code existant...
  [VOTRE CODE EXISTANT ICI]
}

customElements.define('function-chart-card', FunctionChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "function-chart-card",
  name: "Function Chart Card",
  description: "A card that displays mathematical functions"
});
