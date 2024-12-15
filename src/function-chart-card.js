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
      .debug-info {
        font-family: monospace;
        white-space: pre-wrap;
        font-size: 12px;
      }
    `;
  }

  setConfig(config) {
    console.log('Setting config:', config);
    if (!config.functions || !Array.isArray(config.functions)) {
      throw new Error('You need to define at least one function');
    }
    this.config = config;
  }

  _generatePath(func, xMin, xMax) {
    console.log('Generating path for function:', func);
    const points = [];
    const steps = 50;
    
    try {
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i * (xMax - xMin)) / steps;
        const scope = { x };
        const y = math.evaluate(func.expression, scope);
        points.push([x, y]);
      }
      console.log('Generated points:', points.slice(0, 3), '...');
      return points;
    } catch (e) {
      console.error('Error generating path:', e);
      return [];
    }
  }

  render() {
    if (!this.config) {
      console.log('No config available');
      return html`<div>No config</div>`;
    }

    console.log('Rendering with config:', this.config);

    const width = 600;
    const height = 400;
    const xMin = this.config.xRange?.[0] ?? -10;
    const xMax = this.config.xRange?.[1] ?? 10;

    // Calculate points for debug display
    const debugPoints = this.config.functions.map(func => {
      const points = this._generatePath(func, xMin, xMax);
      return { func, points };
    });

    return html`
      <ha-card>
        <div class="card-container">
          <h3>${this.config.title || 'Function Chart'}</h3>
          
          <svg viewBox="0 0 ${width} ${height}" style="border: 1px solid #ccc;">
            <g transform="translate(50,${height - 50})">
              <!-- X axis -->
              <line x1="0" y1="0" x2="${width - 100}" y2="0" stroke="black" />
              <!-- Y axis -->
              <line x1="0" y1="0" x2="0" y2="${-height + 100}" stroke="black" />
              
              ${this.config.functions.map((func, index) => {
                const points = this._generatePath(func, xMin, xMax);
                const pathData = points.map((p, i) => {
                  const x = ((p[0] - xMin) / (xMax - xMin)) * (width - 100);
                  const y = -((p[1] + 10) / 20) * (height - 100);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');
                
                return html`
                  <path 
                    d="${pathData}"
                    stroke="${func.color || '#FF0000'}"
                    fill="none"
                    stroke-width="2"
                  />
                `;
              })}
            </g>
          </svg>

          <div class="debug-info">
            <p>Config:</p>
            <pre>${JSON.stringify(this.config, null, 2)}</pre>
            <p>Points (first 3 per function):</p>
            ${debugPoints.map(({ func, points }) => html`
              <p>${func.name || func.expression}: ${JSON.stringify(points.slice(0, 3))}</p>
            `)}
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);
