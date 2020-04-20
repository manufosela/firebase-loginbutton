import { LitElement, html, css } from 'lit-element';
import 'firebase/firebase-app';
import 'firebase/firebase-auth';

/**
 * `firebase-loginbutton`
 * FirebaseLoginbutton
 *
 * @customElement firebase-loginbutton
 * @polymer
 * @litElement
 * @demo demo/index.html
 */
class FirebaseLoginbutton extends LitElement {
  static get is() {
    return 'firebase-loginbutton';
  }

  static get properties() {
    return {
      dataUser: {
        type: Object
      },
      displayName: {
        type: String
      },
      email: {
        type: String
      },
      uid: {
        type: String
      },
      apiKey: {
        type: String,
        attribute: 'api-key'
      },
      domain: {
        type: String
      },
      messagingSenderId: {
        type: String,
        attribute: 'messaging-sender-id'
      },
      appId: {
        type: String,
        attribute: 'app-id'
      },
      showPhoto: {
        type: Boolean,
        attribute: 'show-photo'
      },
      showEmail: {
        type: Boolean,
        attribute: 'show-email'
      },
      showUser: {
        type: Boolean,
        attribute: 'show-user'
      },
      showIcon: {
        type: Boolean,
        attribute: 'show-icon'
      },
      hasParams: {
        type: Boolean,
        attribute: false
      },
      iconLogout: {
        type: String,
        attribute: false
      },
      infobtn: {
        type: String,
        attribute: false
      },
      hideIfLogin: {
        type: Boolean,
        attribute: 'hide-if-login'
      }
    };
  }

  static get styles() {
    return css`
      :host, :root{
        display: block;
        --btn-primary-color: rgb(204, 204, 204);
        --btn-background-color: rgb(255, 57, 0);
        --btn-secondary-color: black;
        --btn-text-user-color: #FF0;
        --icon-bg-color-singin: #0A0;
        --icon-bg-color-singout: #A00;
      }
      svg { border:0; border-radius: 50%; padding:5px; padding-bottom: 6px; }
      .signin { background: var(--icon-bg-color-singin);}
      .signout { background: var(--icon-bg-color-singout); }
      img { margin:0 5px; }
      .wrapper__login--button {
        display:flex;
        font-size: 1.2rem;
        background-color: var(--btn-background-color);
        color: var(--btn-primary-color);
        cursor: pointer;
        border-radius: 10px;
        padding: 10px 20px;
        flex-flow: row wrap;
        justify-content: space-around;
        max-width: 200px;
      }
      .wrapper__login--button-mobile {
        cursor: pointer;
        border:0;
        background-color: transparent;
        padding:0;
        flex-flow: row wrap;
        justify-content: space-around;
      }
      .button-text {
        padding-top: 5px;
      }
      .button-icon {
        padding-top: 0;
        margin-left: 5px;
      }
      .button-photo img {
        border: 0;
        width: 25px;
        padding-top: 5px;
      }
      .button-user {
        color: var(--btn-text-user-color);
        font-size: 0.8rem;
      }
      .button-email {
        font-weight: bold;
        font-size: 0.8rem;
      }
      .hide {
        display:none;
        visibility: hidden;
      }
    `;
  }

  constructor() {
    super();
    if (typeof firebase === 'undefined') {
      throw new Error('To work firebase-loginbutton: Please, import firebase-app and firebase-auth first');
    }

    this.showEmail = false;
    this.showUser = false;
    this.showIcon = false;
    this.showPhoto = false;
    this.hideIfLogin = false;
    this.name = 'NAME'; //TODO: generate a random Name to identify the component from others.

    this.dispachtSingIn = false;
    this.dispachtSingOut = false;

    this.isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i) !== null;

    this._dispatchSignin = this._dispatchSignin.bind(this);
  }

  _dispatchSignin(ev) {
    document.dispatchEvent(new CustomEvent('firebase-signin', {detail: {user: this.dataUser, name: this.name, id: this.id}}));
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('firebase-are-you-logged', this._dispatchSignin);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('firebase-are-you-logged', this._dispatchSignin);
  }

  attributeChangedCallback(name, oldval, newval) {
    super.attributeChangedCallback(name, oldval, newval);
    this.hasParams = !!(this.apiKey && this.domain && this.messagingSenderId && this.appId);
    if (this.hasParams) {
      this.firebaseInitialize();
      this.infobtn = 'login with ' + this.domain + ' firebase database';
    }
  }

  firebaseInitialize() {
    if (firebase.apps.length === 0) {
      const firebaseConfig = {
        apiKey: this.apiKey,
        authDomain: this.domain + '.firebaseapp.com',
        databaseURL: 'https://' + this.domain + '.firebaseio.com',
        projectId: this.domain,
        storageBucket: this.domain + '.appspot.com',
        messagingSenderId: this.messagingSenderId,
        appId: this.appId
      };
      firebase.initializeApp(firebaseConfig);
    }
    this.onAuthStateChanged();
  }

  _checkEventsLogin(user) {
    if (user) {
      if (!this.dispachtSingIn) {
        document.dispatchEvent(new CustomEvent('firebase-signin', {detail: {user: user, name: this.name, id: this.id}}));
        this.dispachtSingIn = true;
        this.dispachtSingOut = false;
      }
    } else {
      if (!this.dispachtSingOut) {
        document.dispatchEvent(new CustomEvent('firebase-signout', {detail: {user: this.email, name: this.name, id: this.id}}));
        this.dispachtSingIn = false;
        this.dispachtSingOut = true;
      }
    }
  }

  _getUserInfo(user) {
    if (user) {
      this.displayName = user.displayName;
      this.email = user.email;
      this.uid = user.uid;
      this.photo = user.photoURL;
    }
  }

  _drawButtonLogin() {
    const sR = this.shadowRoot;
    if (!this.isMobile) {
      sR.querySelector('.button-photo').innerHTML = (this.showPhoto) ? `<img src="${this.photo}" />` : '';
      sR.querySelector('.button-text').innerText = 'Sign out';
      sR.querySelector('.button-icon').innerHTML = (this.showIcon) ? `${this.iconLogout}` : '';
      sR.querySelector('.button-user').textContent = (this.showUser) ? `${this.displayName}` : '';
      sR.querySelector('.button-email').textContent = (this.showEmail) ? `${this.email}` : '';
      if (this.hideIfLogin) {
        sR.querySelector('.wrapper__layer--login').classList.add('hide');
      }
      sR.querySelector('#quickstart-sign-in').classList.add('wrapper__login--button');
      sR.querySelector('#quickstart-sign-in').classList.remove('wrapper__login--button-mobile');
    } else {
      sR.querySelector('.button-icon').innerHTML = `${this.iconLogout}`;
      if (this.hideIfLogin) {
        sR.querySelector('.wrapper__layer--login').classList.add('hide');
      }
      sR.querySelector('#quickstart-sign-in').classList.remove('wrapper__login--button');
      sR.querySelector('#quickstart-sign-in').classList.add('wrapper__login--button-mobile');
    }
    sR.querySelector('.button-icon svg').classList.remove('signin');
    sR.querySelector('.button-icon svg').classList.add('signout');
  }

  _drawButtonLogout() {
    const sR = this.shadowRoot;
    if (!this.isMobile) {
      sR.querySelector('.button-photo').textContent = '';
      sR.querySelector('.button-text').textContent = 'Sign in';
      sR.querySelector('.button-icon').innerHTML = (this.showIcon) ? `${this.iconLogout}` : '';
      sR.querySelector('.button-user').textContent = '';
      sR.querySelector('.button-email').textContent = '';
      sR.querySelector('#quickstart-sign-in').classList.add('wrapper__login--button');
      sR.querySelector('#quickstart-sign-in').classList.remove('wrapper__login--button-mobile');
    } else {
      sR.querySelector('.button-icon').innerHTML = `${this.iconLogout}`;
      sR.querySelector('#quickstart-sign-in').classList.remove('wrapper__login--button');
      sR.querySelector('#quickstart-sign-in').classList.add('wrapper__login--button-mobile');
    }
    sR.querySelector('.wrapper__layer--login').classList.remove('hide');
    sR.querySelector('.button-icon svg').classList.add('signin');
    sR.querySelector('.button-icon svg').classList.remove('signout');
    this.displayName = undefined;
    this.email = undefined;
    this.uid = undefined;
  }

  onAuthStateChanged() {
    firebase.auth().onAuthStateChanged(function(user) {
      const sR = this.shadowRoot;
      this.dataUser = user;
      this.iconLogout = '<svg id="logout-icon" width="23" height="21" class="signout"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>';
      this._getUserInfo(user);
      sR.querySelector('#quickstart-sign-in').disabled = false;
      if (user) {
        this._drawButtonLogin();
      } else {
        this._drawButtonLogout();
      }
      this._checkEventsLogin(user);
    }.bind(this));
  }

  toggleSignIn() {
    if (!firebase.auth().currentUser) {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function(result) {
        this.dataUser = result.user;
      }.bind(this)).catch(function(error) {
        console.log(error);
      });
    } else {
      firebase.auth().signOut();
    }
    this.shadowRoot.querySelector('#quickstart-sign-in').disabled = true;
  }

  render() {
    return html`
      <section class="wrapper__layer--login">
      ${this.hasParams ? html`
        <div id="user" class="wrapper__user"></div>
        <button disabled id="quickstart-sign-in" @click="${this.toggleSignIn}" title="${this.infobtn}">
          <div class="button-photo"></div>
          <div class="button-text"></div>
          <div class="button-icon"></div>
          <div class="button-user"></div>
          <div class="button-email"></div>
        </button>
      ` : html`
        <p>Faltan parámetros en la definición del componente</p>
      ` }
      </section>
    `;
  }
}

window.customElements.define(FirebaseLoginbutton.is, FirebaseLoginbutton);