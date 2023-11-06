import { LitElement, html } from 'lit';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { firebaseLoginbuttonStyles } from './firebase-loginbutton-style.js';

/**
 * `firebase-loginbutton`
 * FirebaseLoginbutton
 *
 * @customElement firebase-loginbutton
 * @polymer
 * @litElement
 * @demo demo/index.html
 */
export class FirebaseLoginbutton extends LitElement {
  static get is() {
    return 'firebase-loginbutton';
  }

  static get properties() {
    return {
      id: {
        type: String,
        reflect: true,
      },
      appName: {
        type: String,
      },
      dataUser: {
        type: Object,
      },
      displayName: {
        type: String,
      },
      email: {
        type: String,
      },
      uid: {
        type: String,
      },
      apiKey: {
        type: String,
        attribute: 'api-key',
      },
      domain: {
        type: String,
      },
      zone: {
        type: String,
      },
      messagingSenderId: {
        type: String,
        attribute: 'messaging-sender-id',
      },
      appId: {
        type: String,
        attribute: 'app-id',
      },
      showPhoto: {
        type: Boolean,
        attribute: 'show-photo',
      },
      showEmail: {
        type: Boolean,
        attribute: 'show-email',
      },
      showUser: {
        type: Boolean,
        attribute: 'show-user',
      },
      showIcon: {
        type: Boolean,
        attribute: 'show-icon',
      },
      hideIfLogin: {
        type: Boolean,
        attribute: 'hide-if-login',
      },
      recaptchaId: {
        type: String,
        attribute: 'recaptcha-id',
      },
      hasParams: {
        type: Boolean,
        attribute: false,
      },
      iconLogout: {
        type: String,
        attribute: false,
      },
      infobtn: {
        type: String,
        attribute: false,
      },
      iconPathSignIn: {
        type: String,
        attribute: 'icon-path-signin',
      },
      iconPathSignOut: {
        type: String,
        attribute: 'icon-path-signout',
      },
      firebaseApp: {
        type: Object,
      },
      provider: {
        type: String,
      },
      providerObj: {
        type: Object,
      },
    };
  }

  static get styles() {
    return [firebaseLoginbuttonStyles];
  }

  constructor() {
    super();
    if (typeof initializeApp === 'undefined') {
      throw new Error(
        'To work firebase-loginbutton: Please, import firebase-app and firebase-auth first'
      );
    }
    this.showEmail = false;
    this.showUser = false;
    this.showIcon = false;
    this.showPhoto = false;
    this.hideIfLogin = false;
    this.dataUser = null;
    this.zone = null; // OPTIONAL. Old projects dont have a zone
    this.recaptchaId = null;
    this.appCheck = null;

    this.signedIn = false;
    this.signedOut = false;

    this.iconPathSignIn = null;
    this.iconPathSignOut = null;

    this.isMobile =
      navigator.userAgent.match(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i
      ) !== null;

    this._dispatchSigninEvent = this._dispatchSigninEvent.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    if (this.provider === 'github') {
      this.providerObj = new GithubAuthProvider();
    } else if (this.provider === 'facebook') {
      this.providerObj = new FacebookAuthProvider();
    } else if (this.provider === 'twitter') {
      this.providerObj = new TwitterAuthProvider();
    } else if (this.provider === 'micorsoft') {
      this.providerObj = new OAuthProvider('microsoft.com');
    } else {
      this.providerObj = new GoogleAuthProvider();
    }
    this.id =
      this.id ||
      `firebase-loginbutton-${Math.random().toString(36).substring(2, 9)}`;
  }

  _dispatchSigninEvent() {
    if (this.signedIn) {
      document.dispatchEvent(
        new CustomEvent('firebase-signin', {
          detail: {
            user: this.dataUser,
            firebaseApp: this.firebaseApp,
            firebaseStorage: this.firebaseStorage,
            name: this.appName,
            id: this.id,
          },
        })
      );
    }
  }

  _checkIfCallMe(event) {
    const { detail } = event;
    if (detail.id === this.id) {
      this._dispatchSigninEvent();
    }
  }

  firstUpdated() {
    this.id =
      this.id ||
      `firebase-loginbutton-${Math.random().toString(36).substring(2, 9)}`;
    this.appName = `firebase-loginbutton-${this.id}`;
    this.firebaseInitialize();
    document.addEventListener(
      'are-it-logged-into-firebase',
      this._checkIfCallMe.bind(this)
    );

    const componentCreatedEvent = new CustomEvent('wc-ready', {
      detail: {
        id: this.id,
        componentName: this.tagName,
        component: this,
      },
    });
    document.dispatchEvent(componentCreatedEvent);
  }

  attributeChangedCallback(name, oldval, newval) {
    if (super.attributeChangedCallback) {
      super.attributeChangedCallback(name, oldval, newval);
    }
    this.hasParams = !!(
      this.apiKey &&
      this.domain &&
      this.messagingSenderId &&
      this.appId
    );
  }

  async firebaseInitialize() {
    if (!this.firebaseApp) {
      const firebaseConfig = {
        apiKey: this.apiKey,
        authDomain: `${this.domain}.firebaseapp.com`,
        databaseURL:
          this.zone === null
            ? `https://${this.domain}.firebaseio.com`
            : `https://${this.domain}-default-rtdb.${this.zone}.firebasedatabase.app`,
        projectId: this.domain,
        storageBucket: `${this.domain}.appspot.com`,
        messagingSenderId: this.messagingSenderId,
        appId: this.appId,
      };
      this.firebaseApp = await initializeApp(firebaseConfig, this.appName);
      if (this.recaptchaId) {
        this.appCheck = initializeAppCheck(this.firebaseApp, {
          provider: new ReCaptchaV3Provider(this.recaptchaId),
          isTokenAutoRefreshEnabled: true,
        });
      }
      this.firebaseStorage = getStorage(this.firebaseApp);
      this.authStateChangedListener();
    } else {
      console.warn('firebaseApp not found');
    }
  }

  _checkEventsLogin(user) {
    if (user) {
      if (!this.signedIn) {
        this.dataUser = user;
        document.dispatchEvent(
          new CustomEvent('firebase-signin', {
            detail: {
              user: this.dataUser,
              firebaseApp: this.firebaseApp,
              firebaseStorage: this.firebaseStorage,
              name: this.appName,
              id: this.id,
            },
          })
        );
        this.signedIn = true;
        this.signedOut = false;
      }
    } else if (!this.signedOut) {
      document.dispatchEvent(
        new CustomEvent('firebase-signout', { detail: { id: this.id } })
      );
      this.signedIn = false;
      this.signedOut = true;
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
    const env = this.domain.match(/^dev-/) ? '(DEV)' : '';
    if (!this.isMobile) {
      if (this.showPhoto) {
        sR.querySelector('.button-photo').innerHTML = `<img src="${this.photo}" alt="${this.displayName} photo"/>`;
      }
      if (!this.showIcon) {
        sR.querySelector('.button-text').innerText = `Sign out${env}`;
      } else {
        sR.querySelector('.button-text').classList.add('hide');
      }
      if (this.showIcon) {
        sR.querySelector('.button-icon').innerHTML = this.iconLogout;
      }
      if (this.showUser) {
        sR.querySelector('.button-user').textContent = this.displayName;
      }
      if (this.showEmail) {
        sR.querySelector('.button-email').textContent = this.email;
      }
      if (this.hideIfLogin) {
        sR.querySelector('.wrapper__layer--login').classList.add('hide');
      }
      sR.querySelector('#quickstart-sign-in').classList.add(
        'wrapper__login--button'
      );
      sR.querySelector('#quickstart-sign-in').classList.remove(
        'wrapper__login--button-mobile'
      );
    } else {
      sR.querySelector('.button-icon').innerHTML = `${this.iconLogout}`;
      if (this.hideIfLogin) {
        sR.querySelector('.wrapper__layer--login').classList.add('hide');
      }
      sR.querySelector('#quickstart-sign-in').classList.remove(
        'wrapper__login--button'
      );
      sR.querySelector('#quickstart-sign-in').classList.add(
        'wrapper__login--button-mobile'
      );
    }
    if (this.showIcon) {
      sR.querySelector('.button-icon svg').classList.remove('signin');
      sR.querySelector('.button-icon svg').classList.add('signout');
    }
    this.shadowRoot
      .querySelector('#quickstart-sign-in')
      .classList.add('border-logged-in');
    this.shadowRoot
      .querySelector('#quickstart-sign-in')
      .classList.remove('border-logged-out');
  }

  _drawButtonLogout() {
    const sR = this.shadowRoot;
    if (!this.isMobile) {
      sR.querySelector('.button-photo').textContent = '';
      if (!this.showIcon) {
        sR.querySelector('.button-text').textContent = 'Sign in';
      } else {
        sR.querySelector('.button-text').classList.add('hide');
      }
      sR.querySelector('.button-icon').innerHTML = this.showIcon
        ? `${this.iconLogout}`
        : '';
      sR.querySelector('.button-user').textContent = '';
      sR.querySelector('.button-email').textContent = '';
      sR.querySelector('#quickstart-sign-in').classList.add(
        'wrapper__login--button'
      );
      sR.querySelector('#quickstart-sign-in').classList.remove(
        'wrapper__login--button-mobile'
      );
    } else {
      sR.querySelector('.button-icon').innerHTML = `${this.iconLogout}`;
      sR.querySelector('#quickstart-sign-in').classList.remove(
        'wrapper__login--button'
      );
      sR.querySelector('#quickstart-sign-in').classList.add(
        'wrapper__login--button-mobile'
      );
    }
    sR.querySelector('.wrapper__layer--login').classList.remove('hide');
    if (this.showIcon) {
      sR.querySelector('.button-icon svg').classList.add('signin');
      sR.querySelector('.button-icon svg').classList.remove('signout');
    }
    this.displayName = undefined;
    this.email = undefined;
    this.uid = undefined;
    this.shadowRoot
      .querySelector('#quickstart-sign-in')
      .classList.add('border-logged-out');
    this.shadowRoot
      .querySelector('#quickstart-sign-in')
      .classList.remove('border-logged-in');
  }

  authStateChangedListener() {
    this.auth = getAuth(this.firebaseApp);
    onAuthStateChanged(this.auth, user => {
      const computedStyle = getComputedStyle(this);
      const color = user
        ? computedStyle.getPropertyValue('--_firebase-loginbutton_mobile-icon-color__logged')
        : computedStyle.getPropertyValue('--_firebase-loginbutton_mobile-icon-color__not-logged');
      const bgColor = user
        ? computedStyle.getPropertyValue('--_firebase-loginbutton_mobile-icon-bg-color__logged')
        : computedStyle.getPropertyValue('--_firebase-loginbutton_mobile-icon-bg-color__not-logged');
      const logoSize = computedStyle.getPropertyValue('--_firebase-loginbutton_icon-size');
      const iconPathSignIn = (this.iconPathSignIn !== null)
        ? this.iconPathSignIn
        : "<path d='M14 19.2857L15.8 21L20 17M4 21C4 17.134 7.13401 14 11 14C12.4872 14 13.8662 14.4638 15 15.2547M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z' stroke='#000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>";
      const iconPathSignOut = (this.iconPathSignOut !== null)
        ? this.iconPathSignOut
        : "<path d='M11 14C7.13401 14 4 17.134 4 21H11M14.8086 19.7053L19.127 16.3467M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7ZM20 18C20 19.6569 18.6569 21 17 21C15.3431 21 14 19.6569 14 18C14 16.3431 15.3431 15 17 15C18.6569 15 20 16.3431 20 18Z' stroke='#000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>";

      const svgPath = (user) ? iconPathSignIn : iconPathSignOut;

      this.dataUser = user;
      this.iconLogout = /* HTML */ ` <svg
        id="logout-icon"
        width="${logoSize}" height="${logoSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        class="signout"
        fill="${color}"
        style="background-color:${bgColor}"
      >
      ${svgPath}
      </svg>`;

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
      this.providerObj.addScope('profile');
      this.providerObj.addScope('email');
      const result = await signInWithPopup(this.auth, this.providerObj);

      // The signed-in user info.
      this.dataUser = result.user;
      console.log(`Logged user ${this.dataUser.displayName}`);
      this.shadowRoot
        .querySelector('#quickstart-sign-in')
        .classList.add('border-logged-in');

      this._dispatchSigninEvent();
    } else {
      this.shadowRoot
        .querySelector('#quickstart-sign-in')
        .classList.remove('border-logged-in');
      this.auth.signOut();
    }
  }

  render() {
    return html`
      <section class="wrapper__layer--login">
        ${this.hasParams
        ? html`
              <div id="user" class="wrapper__user"></div>
              <button
                disabled
                id="quickstart-sign-in"
                @click="${this.toggleSignIn}"
                title="${this.infobtn}"
              >
                <div class="button-photo"></div>
                <div class="button-icon"></div>
                <div class="button-user"></div>
                <div class="button-email"></div>
                <div class="button-text"></div>
              </button>
            `
        : html` <p>Faltan parámetros en la definición del componente</p> `}
      </section>
    `;
  }
}
