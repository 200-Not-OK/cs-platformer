import { UIComponent } from '../uiComponent.js';

export class Objectives extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-objectives';
    this.root.style.position = 'absolute';
    this.root.style.left = '12px';
    this.root.style.bottom = '12px';
    this.root.style.background = 'rgba(0,0,0,0.5)';
    this.root.style.color = 'white';
    this.root.style.padding = '8px';
    this.root.style.fontSize = '13px';
    this.root.style.pointerEvents = 'auto';

    this.title = document.createElement('div');
    this.title.textContent = 'Objectives';
    this.root.appendChild(this.title);

    this.list = document.createElement('ul');
    this.root.appendChild(this.list);
    this.setProps(props);
  }

  setProps(props) {
    super.setProps(props);
    this.list.innerHTML = '';
    const items = (props && props.items) ? props.items : ['Reach the goal'];
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it;
      this.list.appendChild(li);
    }
  }

  update(delta, ctx) {
    // could update objective progress here
  }
}
