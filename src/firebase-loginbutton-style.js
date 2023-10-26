import { css } from 'lit';

export const firebaseLoginbuttonStyles = css`
  :host {
    display: block;
    --_firebase-loginbutton_font-size: var(--firebase-loginbutton_font-size: 1.2rem);
    --_firebase-loginbutton_margin: var(--firebase-loginbutton_margin: 0);
    --_firebase-loginbutton_padding: var(--firebase-loginbutton_padding: 0.5rem);
    --_firebase-loginbutton_btn-photo-size-container: var(--firebase-loginbutton_btn-photo-size-container: 12rem);
    --_firebase-loginbutton_btn-photo-size: var(--firebase-loginbutton_btn-photo-size: 10rem);
    --_firebase-loginbutton_btn-background-color: var(--firebase-loginbutton_btn-background-color: #fff);
    --_firebase-loginbutton_btn-primary-color: var(--firebase-loginbutton_btn-primary-color: #ff7900);
    --_firebase-loginbutton_btn-terciary-color: var(--firebase-loginbutton_btn-terciary-color: rgba(0, 0, 0, 0.25));
    --_firebase-loginbutton_btn-text-color: var(--firebase-loginbutton_btn-text-color: #fff);
    --_firebase-loginbutton_icon-bg-color-singin: var(--firebase-loginbutton_icon-bg-color-singin: lime);
    --_firebase-loginbutton_icon-bg-color-singout: var(--firebase-loginbutton_icon-bg-color-singout: #a00);
    --_firebase-loginbutton_mobile-icon-color__logged: var(--firebase-loginbutton_mobile-icon-color__logged: #00ff00);
    --_firebase-loginbutton_mobile-icon-bg-color__logged: var(--firebase-loginbutton_mobile-icon-bg-color__logged: #0000ff);
    --_firebase-loginbutton_mobile-icon-color__not-logged: var(--firebase-loginbutton_mobile-icon-color__not-logged: #ff7700);
    --_firebase-loginbutton_mobile-icon-bg-color__not-logged: var(--firebase-loginbutton_mobile-icon-bg-color__not-logged: #aa0000);
    --_firebase-loginbutton_mobile-button-height: var(--firebase-loginbutton_mobile-button-height: 2.5rem);
    --_firebase-loginbutton_border-logged: var(--firebase-loginbutton_border-logged: 2px outset var(--firebase-loginbutton_btn-terciary-color, rgba(0, 0, 0, 0.25)));
    --_firebase-loginbutton_border-boxshadow-logged: var(--firebase-loginbutton_border-boxshadow-logged: 0px 4px 4px 0px rgba(0, 0, 0, 0.25));
  }

  svg {
    border: 0;
    border-radius: 50%;
    padding: 5px;
    padding-bottom: 6px;
  }
  
  .signin {
    background: var(--_firebase-loginbutton_icon-bg-color-singin, lime);
  }
  .signout {
    background: var(--_firebase-loginbutton_icon-bg-color-singout), #a00;
  }

  .border-logged-in {
    border: var(--_firebase-loginbutton_border-logged);
    box-shadow: var(--_firebase-loginbutton_border-boxshadow-logged);
  }
  .border-logged-out {
    border: 0;
  }

  .wrapper__login--button {
    display: flex;
    flex-direction: column;
    font-size: var(--_firebase-loginbutton_font-size, 1.2rem);
    background-color: var(--_firebase-loginbutton_btn-background-color, #fff);
    color: var(--_firebase-loginbutton_btn-primary-color, #ff7900);
    cursor: pointer;
    border-radius: 1.5rem;
    margin: var(--_firebase-loginbutton_margin, 0);
    padding: var(--_firebase-loginbutton_padding, 0.5rem);
    justify-content: center;
    width: var(--_firebase-loginbutton_btn-photo-size-container, 12rem);
    justify-items: center;
    font-weight: 500;
  }
  .wrapper__login--button div {
    width: var(--_firebase-loginbutton_btn-photo-size, 10rem);
    text-align: center;
    margin: 0 auto;
  }
  .wrapper__login--button-mobile {
    cursor: pointer;
    border: 0;
    background-color: transparent;
    padding: 0;
    flex-flow: row wrap;
    justify-content: space-around;
  }
  .button-text {
    background-color: var(--_firebase-loginbutton_btn-primary-color, #ff7900);
    color: var(--_firebase-loginbutton_btn-text-color, #fff);
    padding: 0.6rem 0rem;
    border-radius: 100px;
    display: inline-block;
    text-align: center;
    margin: 0 auto;
  }
  .button-icon {
    padding-top: 0;
    margin-left: 5px;
  }
  .button-photo {
    width: var(--_firebase-loginbutton_btn-photo-size, 10rem);
  }
  .button-photo img {
    width: inherit;
    height: inherit;
    border-radius: 50%;
    border: 1px solid var(--_firebase-loginbutton_btn-primary-color, #ff7900);
  }
  .button-user {
    font-size: 1rem;
    color: var(--_firebase-loginbutton_btn-text-user-color, #ff7900);
    margin: 10px 0px 3px;
    font-weight: 500;
  }
  .button-email {
    font-size: 0.8rem;
    color: var(
      --_firebase-loginbutton_btn-secondary-color,
      rgba(0, 0, 0, 0.25)
    );
    margin-top: 0;
    margin-bottom: 1rem;
  }
  .hide {
    display: none;
    visibility: hidden;
  }
  @media screen and (max-width: 980px) {
    .wrapper__login--button {
      font-size: 0.9rem;
      width: 110px;
      padding: 2px;
    }
    .button-email {
      display: none;
    }
    .button-user {
      display: none;
    }
  }
  @media screen and (max-width: 480px) {
    .button-photo img {
      display: none;
    }

    .wrapper__login--button-mobile {
      height: var(--_firebase-loginbutton_mobile-button-height);
    }
    .border-logged-in {
      border: 0;
      box-shadow: none;
    }
  }
`;
