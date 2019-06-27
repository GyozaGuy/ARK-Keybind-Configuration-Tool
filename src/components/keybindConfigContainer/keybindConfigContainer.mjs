import {dom, html} from '../../include/mjs/templateUtils.mjs';
// import request from '../../helpers/request.mjs';
import styles from './styles.mjs';

const {ipcRenderer: ipc} = require('electron');

customElements.define('keybind-config-container', class extends HTMLElement {
  async connectedCallback() {
    document.head.appendChild(dom(styles));
    this.appendChild(dom(html`
      <div @name="_container" container>
        <section class="spinner" @name="_spinner">
          <div spinner></div>
        </section>

        <section id="noConfig" @name="_noConfig">
          <h1>No config found! Please select your config below:</h1>
          <div @name="_fileInputWrapper">
            <input type="file" #change="${this._handleSelectFile.bind(this)}">
          </div>
        </section>

        <section id="content" @name="_content" hidden>
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

          <div id="configs" @name="_configs"></div>
        </section>
      </div>
    `, this));

    this.readConfig();
  }

  readConfig(fileName = '') {
    const inputConfigs = ipc.sendSync('load-config', fileName);

    if (Array.isArray(inputConfigs)) {
      this.renderConfigs(inputConfigs);
      this.showSection(this._content);
    } else {
      this.showSection(this._noConfig);
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

  showSection(section) {
    [...this._container.children].forEach(child => {
      child.hidden = child !== section;
    });
  }

  _handleSelectFile({target: {value}}) {
    const fileName = value.replace(/^.*[\\/]/i, '');

    if (fileName === 'input.ini') {
      this.readConfig(value);
    } else {
      this._fileInputWrapper.setAttribute('alert', '');
    }
  }
});
