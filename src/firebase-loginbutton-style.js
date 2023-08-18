import { css } from 'lit';

export const firebaseLoginbuttonStyles = css`
  :host,
  :root {
    display: block;
    /*
    --firebase-loginbutton_font-size: 1.2rem;
    --firebase-loginbutton_margin: 0;
    --firebase-loginbutton_padding: 0.5rem;
    --firebase-loginbutton_btn-photo-size-container: 12rem;
    --firebase-loginbutton_btn-photo-size: 10rem;
    --firebase-loginbutton_btn-background-color: #fff;
    --firebase-loginbutton_btn-primary-color: #ff7900;
    --firebase-loginbutton_btn-terciary-color: rgba(0, 0, 0, 0.25);
    --firebase-loginbutton_btn-text-color: #fff;
    --firebase-loginbutton_icon-bg-color-singin: lime;
    --firebase-loginbutton_icon-bg-color-singout: #a00;
    */
    --firebase-loginbutton_mobile-icon-color__logged: #00ff00;
    --firebase-loginbutton_mobile-icon-bg-color__logged: #0000ff;
    --firebase-loginbutton_mobile-icon-color__not-logged: #ff7700;
    --firebase-loginbutton_mobile-icon-bg-color__not-logged: #aa0000;
  }
  svg {
    border: 0;
    border-radius: 50%;
    padding: 5px;
    padding-bottom: 6px;
  }
  .signin {
    background: var(--firebase-loginbutton_icon-bg-color-singin, lime);
  }
  .signout {
    background: var(--firebase-loginbutton_icon-bg-color-singout), #a00;
  }

  .border-logged-in {
    border: 2px outset
      var(--firebase-loginbutton_btn-terciary-color, rgba(0, 0, 0, 0.25));
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  }
  .border-logged-out {
    border: 0;
  }

  .wrapper__login--button {
    display: flex;
    flex-direction: column;
    font-size: var(--firebase-loginbutton_font-size, 1.2rem);
    background-color: var(--firebase-loginbutton_btn-background-color, #fff);
    color: var(--firebase-loginbutton_btn-primary-color, #ff7900);
    cursor: pointer;
    border-radius: 1.5rem;
    margin: var(--firebase-loginbutton_margin, 0);
    padding: var(--firebase-loginbutton_padding, 0.5rem);
    justify-content: center;
    width: var(--firebase-loginbutton_btn-photo-size-container, 12rem);
    justify-items: center;
    font-weight: 500;
  }
  .wrapper__login--button div {
    width: var(--firebase-loginbutton_btn-photo-size, 10rem);
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
    background-color: var(--firebase-loginbutton_btn-primary-color, #ff7900);
    color: var(--firebase-loginbutton_btn-text-color, #fff);
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
    width: var(--firebase-loginbutton_btn-photo-size, 10rem);
  }
  .button-photo img {
    width: inherit;
    height: inherit;
    border-radius: 50%;
    border: 1px solid var(--firebase-loginbutton_btn-primary-color, #ff7900);
  }
  .button-user {
    font-size: 1rem;
    color: var(--firebase-loginbutton_btn-text-user-color, #ff7900);
    margin: 10px 0px 3px;
    font-weight: 500;
  }
  .button-email {
    font-size: 0.8rem;
    color: var(--firebase-loginbutton_btn-secondary-color, rgba(0, 0, 0, 0.25));
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
    }
    .border-logged-in {
      border: 0;
      box-shadow: none;
    }
  }
`;
