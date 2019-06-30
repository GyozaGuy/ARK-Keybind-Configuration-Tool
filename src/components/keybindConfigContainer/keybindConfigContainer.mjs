import {dom, html} from '../../include/mjs/templateUtils.mjs';
// import request from '../../helpers/request.mjs';
import styles from './styles.mjs';

const {ipcRenderer: ipc} = require('electron');

customElements.define('keybind-config-container', class extends HTMLElement {
  connectedCallback() {
    document.head.appendChild(dom(styles));
    this.appendChild(dom(html`
      <div @name="_container" container>
        <section class="spinner" @name="_spinner">
          <div spinner></div>
        </section>

        <section id="noConfig" @name="_noConfig">
          <h1>No config found! Please select your config below:</h1>
          <div @name="_fileInputWrapper">
            <input @name="_fileSelector" type="file" #change="${this._handleSelectFile.bind(this)}">
          </div>
        </section>

        <section id="content" @name="_content" hidden>
          <header>
            <span>ARK Keybind Configuration Tool</span>

            <div @name="_status" id="status" hidden></div>

            <div>
              <input #input="${this._handleFilter.bind(this)}" id="filterField" placeholder="Type to filter" type="text">
              <!--<button type="button">Refresh</button>-->
              <!--<button #click="${this.backupConfig.bind(this)}" type="button">Backup</button>-->
              <button #click="${this.saveConfig.bind(this)}" type="button" danger>Save</button>
              <!--<button type="button" action>Register Mod...</button>-->
            </div>
          </header>

          <div id="configs" @name="_configs" card></div>
        </section>
      </div>
    `, this));

    this.readConfig();

    this.addEventListener('click', ({target}) => {
      if (target.matches('input[type="checkbox"]')) {
        if (target.hasAttribute('checked')) {
          target.removeAttribute('checked');
        } else {
          target.setAttribute('checked', '');
        }
      }
    });
  }

  backupConfig() {
    ipc.send('backup-config', this._fileSelector.value);
  }

  readConfig(fileName = '') {
    const {actionMappings, filename} = ipc.sendSync('load-config', fileName);

    this._filename = filename;

    if (Array.isArray(actionMappings)) {
      this.renderConfigs(actionMappings);
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
        <div config>
          <input data-field="action" placeholder="ActionMapping" type="text" value="${config.action}">
          <input data-field="key" placeholder="Key" type="text" value="${config.key}">
          <label>
            <input data-field="shift" type="checkbox"${config.shift && ' checked'}> Shift
          </label>
          <label>
            <input data-field="ctrl" type="checkbox"${config.ctrl && ' checked'}> Ctrl
          </label>
          <label>
            <input data-field="alt" type="checkbox"${config.alt && ' checked'}> Alt
          </label>
          <label>
            <input data-field="cmd" type="checkbox"${config.cmd && ' checked'}> Cmd
          </label>
        </div>
      `));
    });

    this._configs.appendChild(dom(html`
      <div config>
        <input data-field="action" placeholder="ActionMapping" type="text">
        <input data-field="key" placeholder="Key" type="text">
        <label>
          <input data-field="shift" type="checkbox"> Shift
        </label>
        <label>
          <input data-field="ctrl" type="checkbox"> Ctrl
        </label>
        <label>
          <input data-field="alt" type="checkbox"> Alt
        </label>
        <label>
          <input data-field="cmd" type="checkbox"> Cmd
        </label>
      </div>
    `));
  }

  saveConfig() {
    const newConfig = [];

    this._configs.querySelectorAll('[config]').forEach(config => {
      const actionField = config.querySelector('[data-field="action"]');

      if (actionField.value) {
        const keyField = config.querySelector('[data-field="key"]');
        const shiftField = config.querySelector('[data-field="shift"]');
        const ctrlField = config.querySelector('[data-field="ctrl"]');
        const altField = config.querySelector('[data-field="alt"]');
        const cmdField = config.querySelector('[data-field="cmd"]');

        newConfig.push({
          action: actionField.value,
          key: keyField.value,
          shift: shiftField.hasAttribute('checked'),
          ctrl: ctrlField.hasAttribute('checked'),
          alt: altField.hasAttribute('checked'),
          cmd: cmdField.hasAttribute('checked')
        });
      }
    });

    const statuses = {
      error: 'Something went wrong!',
      success: 'Save successful!'
    };

    const status = ipc.sendSync('save-config', {config: newConfig, filename: this._filename});
    this._status.textContent = statuses[status];
    this._status.hidden = false;

    setTimeout(() => {
      this._status.hidden = true;
    }, 2000);
  }

  showSection(section) {
    [...this._container.children].forEach(child => {
      child.hidden = child !== section;
    });
  }

  _handleFilter({target: {value}}) {
    [...this._configs.children].forEach(child => {
      const [actionField, keyField] = child.querySelectorAll('input[type="text"]');
      child.hidden = ![actionField, keyField].some(
        field => field.value.toLowerCase().includes(value.toLowerCase())
      );
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
