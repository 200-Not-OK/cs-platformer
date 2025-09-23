import { UIComponent } from '../uiComponent.js';

export class SmallMenu extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-smallmenu';
    this.root.style.position = 'absolute';
    this.root.style.left = '50%';
    this.root.style.top = '50%';
    this.root.style.transform = 'translate(-50%, -50%)';
    this.root.style.background = 'rgba(20,20,20,0.95)';
    this.root.style.padding = '12px';
    this.root.style.borderRadius = '8px';
    this.root.style.color = 'white';
    this.root.style.pointerEvents = 'auto';

    this.root.innerHTML = `<div style="text-align:center"><h3 style="margin:0 0 8px 0">Menu</h3><div><button id=\"menu-resume\">Resume</button></div></div>`;
    this.root.querySelector('#menu-resume').addEventListener('click', (e) => {
      if (props && props.onResume) props.onResume();
    });
  }
}
