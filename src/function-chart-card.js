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
    this.config = config;
  }

  render() {
    return html`
      <ha-card>
        <div style="padding: 16px;">
          <h2>${this.config?.title || 'Function Chart'}</h2>
          <div style="background: #f0f0f0; padding: 8px;">
            Version basique
          </div>
          <svg 
            width="300" 
            height="200" 
            style="border: 1px solid #ccc; margin-top: 16px;"
          >
            <line x1="10" y1="190" x2="290" y2="190" stroke="black" />
            <line x1="10" y1="10" x2="10" y2="190" stroke="black" />
            <path 
              d="M 10,100 Q 150,20 290,100" 
              stroke="red" 
              fill="none"
              stroke-width="2"
            />
          </svg>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);
