# firebase-loginbutton

Lit-Element web component description

## Install

```
$ npm i @firebase-utils/firebase-loginbutton
```

## Viewing Your Element

```
$ npm start
```

## Running Tests

```
$ npm test
```

## Build

```
$ npm run build
```

## Demo

```
<h2>Basic firebase-loginbutton Demo</h2>
<h3>Demo</h3>

```

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="firebase-loginbutton.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<firebase-loginbutton
  path="/path-to-firebase"
  api-key="YOUR-FIREBASE-API-KEY"
  domain="YOUR-FIREBASE-DOMAIN"
  messaging-sender-id="YOUR-SENDER-ID"
  app-id="YOUR-APP-ID"
  [hide-if-login]
  [show-email]
  [show-icon]
  [show-user]
  [show-photo]
>
</firebase-loginbutton>
```

#Use

You need to subscribe to the events of the component to know when you are logged in or logged out:

document.addEventListener('firebase-signin', yourSigninFn, false);
document.addEventListener('firebase-signout', yourSignoutFn, false);

And don't forget to unsubscribe to events if the component is destroyed:

document.removeEventListener('firebase-signin', yourSigninFn, false);
document.removeEventListener('firebase-signout', yourSignoutFn, false);

## Attributes

- api-key (String): Your firebase API-KEY
- domain (String): Your firebase DOMAIN
- messaging-sender-id (String): Your firebase MESSAGING-SENDER-ID
- app-id (String): Your firebase APP-ID
- [hide-if-login] (Boolean): Optiona. Use if you use two or more components, to hide if it is not the first.
- [show-email] (Boolean): Optional. Use if you want to show logged user email into the button
- [show-icon] (Boolean): Optional. Use if you want to show on/off icon into the button
- [show-user] (Boolean): Optional. Use if you want to show logged user display name into the button
- [show-photo] (Boolean): Optional. Use if you want to show logged user photo into the button

## CSS Variables

- --btn-primary-color: default value is rgb(204, 204, 204)
- --btn-background-color: default value is rgb(255, 57, 0)
- --btn-secondary-color: default value is black
- --btn-text-user-color: default value is #FF0
- --icon-bg-color-singin: default value is #0A0
- --icon-bg-color-singout: default value is #A00

## Author

**manufosela**

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details

## Generated

**generator-lit-element-base** - _yeoman npm package_ - by [@manufosela](https://github.com/manufosela/generator-litelement-webcomponent)
