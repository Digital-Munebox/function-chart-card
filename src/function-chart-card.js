// src/function-chart-card.js
import { LitElement, html, css } from 'lit';
import * as math from 'mathjs';

class FunctionChartCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
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
        color: var(--primary-text-color);
      }
      .chart {
        width: 100%;
        height: 200px;
      }
      path.function {
        fill: none;
        stroke-width: 2;
      }
      .grid line {
        stroke: var(--divider-color, #e0e0e0);
        stroke-opacity: 0.2;
      }
      .axis line {
        stroke: var(--primary-text-color);
      }
      .axis text {
        fill: var(--primary-text-color);
      }
    `;
  }

  setConfig(config) {
    if (!config.functions || !Array.isArray(config.functions)) {
      throw new Error('You need to define at least one function');
    }
    this.config = config;
  }

  _generatePath(func, xMin, xMax, width, height) {
    const points = [];
    const steps = 100;
    const margin = 20;
    const graphWidth = width - 2 * margin;
    const graphHeight = height - 2 * margin;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i * (xMax - xMin)) / steps;
      let y;
      try {
        y = math.evaluate(func.expression, { x });
      } catch (e) {
        console.error(`Error evaluating function ${func.expression}:`, e);
        continue;
      }

      // Scale to SVG coordinates
      const svgX = margin + (i * graphWidth) / steps;
      const svgY = margin + graphHeight - ((y + Math.abs(xMin)) * graphHeight) / (xMax - xMin);
      
      points.push(`${i === 0 ? 'M' : 'L'} ${svgX} ${svgY}`);
    }

    return points.join(' ');
  }

  render() {
    if (!this.config) return html``;

    const width = 600;
    const height = 400;
    const xMin = this.config.xRange?.[0] ?? -10;
    const xMax = this.config.xRange?.[1] ?? 10;

    return html`
      <ha-card>
        <div class="card-container">
          <h3>${this.config.title || 'Function Chart'}</h3>
          <svg viewBox="0 0 ${width} ${height}" class="chart">
            <!-- Grid lines -->
            <g class="grid">
              ${Array.from({ length: 10 }, (_, i) => {
                const y = 20 + (i * (height - 40)) / 9;
                return html`<line x1="20" y1="${y}" x2="${width - 20}" y2="${y}" />`;
              })}
              ${Array.from({ length: 10 }, (_, i) => {
                const x = 20 + (i * (width - 40)) / 9;
                return html`<line x1="${x}" y1="20" x2="${x}" y2="${height - 20}" />`;
              })}
            </g>
            <!-- Functions -->
            ${this.config.functions.map((func, index) => html`
              <path
                class="function"
                d="${this._generatePath(func, xMin, xMax, width, height)}"
                stroke="${func.color || '#FF6B6B'}"
              />
            `)}
            <!-- Axes -->
            <g class="axis">
              <line x1="20" y1="${height - 20}" x2="${width - 20}" y2="${height - 20}" />
              <line x1="20" y1="20" x2="20" y2="${height - 20}" />
            </g>
          </svg>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);