// src/function-chart-card.js
import { LitElement, html, css } from 'lit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import * as math from 'mathjs';

class FunctionChartCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      data: { type: Array }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }
      .card-container {
        background: var(--ha-card-background, var(--card-background-color, white));
        border-radius: var(--ha-card-border-radius, 4px);
        box-shadow: var(--ha-card-box-shadow, 0 2px 2px rgba(0, 0, 0, 0.14));
        padding: 16px;
      }
    `;
  }

  constructor() {
    super();
    this.data = [];
    this._generateData();
  }

  setConfig(config) {
    if (!config.functions || !Array.isArray(config.functions)) {
      throw new Error('You need to define at least one function');
    }
    this.config = config;
  }

  _generateData() {
    if (!this.config) return;

    const data = [];
    const xMin = this.config.xRange?.[0] ?? -10;
    const xMax = this.config.xRange?.[1] ?? 10;
    const steps = this.config.steps ?? 100;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i * (xMax - xMin)) / steps;
      const point = { x };

      this.config.functions.forEach((func, index) => {
        try {
          const scope = { x };
          point[`y${index}`] = math.evaluate(func.expression, scope);
        } catch (e) {
          console.error(`Error evaluating function ${func.expression}:`, e);
        }
      });

      data.push(point);
    }

    this.data = data;
  }

  render() {
    if (!this.config) return html``;

    return html`
      <ha-card>
        <div class="card-container">
          <h3>${this.config.title || 'Function Chart'}</h3>
          <LineChart width={600} height={400} data=${this.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            ${this.config.functions.map((func, index) => html`
              <Line 
                type="monotone" 
                dataKey=${`y${index}`}
                stroke=${func.color || '#8884d8'}
                name=${func.name || `Function ${index + 1}`}
              />
            `)}
          </LineChart>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);