# \<firebase-loginbutton>

This webcomponent follows the [open-wc](https://github.com/open-wc/open-wc) recommendation.

## Installation

```bash
npm i firebase-loginbutton
```

## Usage

```html
<script type="module">
  import '@firebase-utils/firebase-loginbutton';
</script>

<firebase-loginbutton
  id="myLoginButton"
  api-key="MI_API_KEY_FIREBASE_PROJECT"
  domain="DOMAIN_FIREBASE_PROJECT"
  zone="ZONE_FIREBASE_PROJECT"
  messaging-sender-id="SENDER_ID_FIREBASE_PROJECT"
  app-id="APP_ID_FIREBASE_PROJECT"
  show-email
  show-user
  show-photo
></firebase-loginbutton>
```

## Events

### Dispatching events

- **wc-ready**, dispatched when the webcomponent is ready after first render.

  ```json
    "detail": {
      "id": "The component id",
      "componentName": "FIREBASE-LOGINBUTTON",
      "component": "The component instance",
    }
  ```

- **firebase-signin**: dispatched when the user is firebase logged in

  ```json
    "detail": {
      "id": "The component id",
      "user": "the dataUser object",
      "firebaseApp": "the firebaseApp object",
      "firebaseStorage": "the firebaseStorage object",
    }
  ```

- **firebase-signout**: dispatched when the user is firebase logged out

  ```json
    "detail": {
      "id": "The component id",
    }
  ```

## Styling

The following custom properties and mixins are available for styling:

```css
    --firebase-loginbutton_font-size
    --firebase-loginbutton_margin
    --firebase-loginbutton_padding
    --firebase-loginbutton_btn-photo-size-container
    --firebase-loginbutton_btn-photo-size
    --firebase-loginbutton_btn-background-color
    --firebase-loginbutton_btn-primary-color
    --firebase-loginbutton_btn-terciary-color
    --firebase-loginbutton_btn-text-color
    --firebase-loginbutton_icon-bg-color-singin
    --firebase-loginbutton_icon-bg-color-singout
    --firebase-loginbutton_mobile-icon-color__logged
    --firebase-loginbutton_mobile-icon-bg-color__logged
    --firebase-loginbutton_mobile-icon-color__not-logged
    --firebase-loginbutton_mobile-icon-bg-color__not-logged
    --firebase-loginbutton_mobile-button-height
    --firebase-loginbutton_border-logged
    --firebase-loginbutton_border-boxshadow-logged
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Demoing with Storybook

To run a local instance of Storybook for your component, run

```bash
npm run storybook
```

To build a production version of Storybook, run

```bash
npm run storybook:build
```

## Tooling configs

For most of the tools, the configuration is in the `package.json` to minimize the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`
