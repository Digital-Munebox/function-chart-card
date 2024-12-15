// src/function-chart-card.js
import { LitElement, html, css } from 'lit';

class FunctionChartCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  setConfig(config) {
    console.log('Setting config:', config);
    this.config = config;
  }

  render() {
    console.log('Rendering with config:', this.config);

    return html`
      <ha-card>
        <div style="padding: 16px;">
          <h2>${this.config?.title || 'Function Chart'}</h2>
          <pre style="background: #f0f0f0; padding: 8px;">
            Config: ${JSON.stringify(this.config, null, 2)}
          </pre>
          <svg 
            viewBox="0 0 400 200" 
            style="border: 1px solid #ccc; margin-top: 16px;">
            <!-- Axes -->
            <line x1="50" y1="150" x2="350" y2="150" stroke="black" />
            <line x1="50" y1="50" x2="50" y2="150" stroke="black" />
            <!-- Simple sine wave -->
            <path 
              d="M50 100 C 100 50, 150 150, 200 100 S 300 50, 350 100" 
              stroke="red" 
              fill="none"
            />
          </svg>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);
