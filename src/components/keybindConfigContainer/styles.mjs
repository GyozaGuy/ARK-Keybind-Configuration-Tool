import {html} from '../../include/mjs/templateUtils.mjs';

export default html`
  <style>
    .spinner, #noConfig {
      left: 50%;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    #noConfig {
      color: white;
    }
    #content:not([hidden]) {
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100vh;
    }
    header {
      align-items: center;
      background-color: #eee;
      box-shadow: 0 0 4px black;
      display: flex;
      justify-content: space-between;
      min-height: 50px;
      padding: 10px;
      position: relative;
    }
    header::after {
      background-image: linear-gradient(black, transparent);
      color: red;
      content: '';
      height: 5px;
      left: 0;
      position: absolute;
      top: 100%;
      width: 100%;
      z-index: 1;
    }
    header > span {
      font-size: 1.5em;
      font-weight: bold;
    }
    header * + * {
      margin-left: 10px;
    }
    #status {
      font-weight: bold;
    }
    #configs {
      overflow: auto;
      padding: 5px;
    }
    [config]:not([hidden]) {
      align-items: center;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr 1fr repeat(4, auto);
      padding: 10px;
    }
    [config] + [config] {
      border-top: 1px solid #aaa;
    }
  </style>
`;
