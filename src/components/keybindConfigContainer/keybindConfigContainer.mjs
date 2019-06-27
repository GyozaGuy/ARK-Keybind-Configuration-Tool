import {dom, html} from '../../include/mjs/templateUtils.mjs';
// import request from '../../helpers/request.mjs';
import styles from './styles.mjs';

const {ipcRenderer: ipc} = require('electron');

customElements.define('keybind-config-container', class extends HTMLElement {
  async connectedCallback() {
    document.head.appendChild(dom(styles));
    this.appendChild(dom(html`
      <div container>
        <section @name="_spinner" class="spinner">
          <div spinner></div>
        </section>

        <section @name="_content" id="content" hidden>
          <header>
            <div>
              <strong>ARK Keybind Configuration Tool</strong>
            </div>

            <div>
              <button type="button">Refresh</button>
              <button type="button" danger>Save</button>
              <button type="button" action>Register Mod...</button>
            </div>
          </header>

          <div @name="_configs" id="configs"></div>
        </section>
      </div>
    `, this));

    // Try to load Input.ini
    const inputConfigs = ipc.sendSync('load-config');

    if (Array.isArray(inputConfigs)) {
      this._spinner.hidden = true;
      this._content.hidden = false;
      this.renderConfigs(inputConfigs);
    }
  }

  renderConfigs(configs) {
    while (this._configs.firstChild) {
      this._configs.firstChild.remove();
    }

    configs.forEach(config => {
      this._configs.appendChild(dom(html`
        <div card>
          <fieldset>
            <legend><strong>${config.action}</strong></legend>
            <input placeholder="Key" type="text" value="${config.key}">
            <input ${config.shift && 'checked '}type="checkbox"> Shift
            <input ${config.ctrl && 'checked '}type="checkbox"> Ctrl
            <input ${config.alt && 'checked '}type="checkbox"> Alt
            <input ${config.cmd && 'checked '}type="checkbox"> Cmd
          </fieldset>
        </div>
      `, this));
    });
  }
});
