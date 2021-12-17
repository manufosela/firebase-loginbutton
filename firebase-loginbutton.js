import { LitElement, html } from 'lit';
import { firebaseLoginbuttonStyles } from './firebase-loginbutton-style.js';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

/**
 * `firebase-loginbutton`
 * FirebaseLoginbutton
 *
 * @customElement firebase-loginbutton
 * @polymer
 * @litElement
 * @demo demo/index.html
 */
export default class FirebaseLoginbutton extends LitElement {
  static get is() {
    return 'firebase-loginbutton';
  }

  static get properties() {
    return {
      appName:{
        type: String,
      },
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
      zone: {
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
      },
      firebaseApp: {
        type: Object
      }        
    };
  }

  static get styles() {
    return [firebaseLoginbuttonStyles];
  }

  constructor() {
    super();
    if (typeof initializeApp === 'undefined') {
      throw new Error('To work firebase-loginbutton: Please, import firebase-app and firebase-auth first');
    }

    this.showEmail = false;
    this.showUser = false;
    this.showIcon = false;
    this.showPhoto = false;
    this.hideIfLogin = false;
    this.name = 'NAME'; //TODO: generate a random Name to identify the component from others.
    this.dataUser = null;
    this.zone = null;

    this.signedIn = false;
    this.signedOut = false;

    this.isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i) !== null;

    this._dispatchSigninEvent = this._dispatchSigninEvent.bind(this);

    this.appName = `firebase-loginbutton-${this.id}`;
    document.addEventListener
  }

  _dispatchSigninEvent() {
    if (this.signedIn) {
      document.dispatchEvent(new CustomEvent('firebase-signin', {detail: {user: this.dataUser, firebaseApp: this.firebaseApp, name: this.appName, id: this.id}}));
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('firebase-are-you-logged', this._dispatchSigninEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('firebase-are-you-logged', this._dispatchSigninEvent);
  }

  firstUpdated() {
    this.firebaseInitialize();
  }

  attributeChangedCallback(name, oldval, newval) {
     super.attributeChangedCallback(name, oldval, newval);
     this.hasParams = !!(this.apiKey && this.domain && this.messagingSenderId && this.appId);
  }

  async firebaseInitialize() {
    if (!this.firebaseApp) {
      const firebaseConfig = {
        apiKey: this.apiKey,
        authDomain: this.domain + '.firebaseapp.com',
        databaseURL: (this.zone === null) ? `https://${this.domain}.firebaseio.com` : `https://${this.domain}-default-rtdb.${this.zone}.firebasedatabase.app`,
        projectId: this.domain,
        storageBucket: this.domain + '.appspot.com',
        messagingSenderId: this.messagingSenderId,
        appId: this.appId
      };
      this.firebaseApp = await initializeApp(firebaseConfig, this.appName);
      this.authStateChangedListener();
    } else {
      console.warn('firebaseApp not found');
    }
  }

  _checkEventsLogin(user) {
    if (user) {
      if (!this.signedIn) {
        document.dispatchEvent(new CustomEvent('firebase-signin', {detail: {user: user, name: this.name, id: this.id, firebaseApp: this.firebaseApp }}));
        this.signedIn = true;
        this.signedOut = false;
      }
    } else {
      if (!this.signedOut) {
        document.dispatchEvent(new CustomEvent('firebase-signout', {detail: {user: this.email, name: this.name, id: this.id, firebaseApp: this.firebaseApp }}));
        this.signedIn = false;
        this.signedOut = true;
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
    if (this.showIcon) {
      sR.querySelector('.button-icon svg').classList.remove('signin');
      sR.querySelector('.button-icon svg').classList.add('signout');
    }
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
    if (this.showIcon) {
      sR.querySelector('.button-icon svg').classList.add('signin');
      sR.querySelector('.button-icon svg').classList.remove('signout');
    }
    this.displayName = undefined;
    this.email = undefined;
    this.uid = undefined;
  }

  authStateChangedListener() {
    this.auth = getAuth(this.firebaseApp);
    onAuthStateChanged(this.auth, (user) => {
      this.dataUser = user;
      this.iconLogout = '<svg id="logout-icon" width="23" height="21" class="signout"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>';
      this._getUserInfo(user);
      this.shadowRoot.querySelector('#quickstart-sign-in').disabled = false;
      if (user) {
        this._drawButtonLogin();
      } else {
        this._drawButtonLogout();
      }
      this._checkEventsLogin(user);
    });
  }

  async toggleSignIn() {
    if (!this.auth.currentUser) {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(this.auth, provider);
      
      // The signed-in user info.
      this.dataUser = result.user;
      console.log(`Logged user ${this.dataUser.displayName}`);
      this._dispatchSigninEvent();
    } else {
      this.auth.signOut();
    }
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