import {dom, html} from 'es6://src/include/mjs/templateUtils.mjs';
import request from 'es6://src/helpers/request.mjs';

customElements.define('keybind-config-container', class extends HTMLElement {
  connectedCallback() {
    this.appendChild(dom(html`
      <div card>
        <h1>Test</h1>
      </div>
    `, this));
  }
});
