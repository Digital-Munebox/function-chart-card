import { LitElement, html } from 'lit';

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
          <h2>Test Card</h2>
          <p>Configuration: ${JSON.stringify(this.config)}</p>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('function-chart-card', FunctionChartCard);
