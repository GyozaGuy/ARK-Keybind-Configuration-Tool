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
    }
    header * + * {
      margin-left: 10px;
    }
    #configs {
      overflow: auto;
      padding: 5px;
    }
  </style>
`;
