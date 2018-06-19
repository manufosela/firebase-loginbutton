# firebase-loginbutton [![ ](https://)](https://)

Polymer web component configurable to login in firebase

## Demo

[firebase-loginbutton jsfiddle demo](https://jsfiddle.net/manufosela/3z9srovn/14/)

<!---
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <link rel="import" href="firebase-loginbutton.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
          <firebase-loginbutton 
            domain="coleccion-peliculas.firebaseapp.com"
            apikey="AIzaSyBaehmgaklz_vaqsBVZhvBm0fsD7PF8PHQ" 
            provider="google"
            show="name"
            showphoto>
          </firebase-loginbutton>
```
## Use

```shell
> npm install bower -g
> mkdir myproyect && cd myproyect
> bower install --save https://github.com/manufosela/firebase-loginbutton.git
```

Edit your HTML file and put the link to webcomponent into HEAD tags

```html
<head>
   ...
   <link rel="import" href="./bower_components/firebase-loginbutton/firebase-loginbutton.html">
   ...
</head>
```

Put the component into the BODY and fill the configure attributes with firebase configuration:

```html
<body>
  ...
  <firebase-loginbutton [atributos]></firebase-loginbutton>
  ...
</body>
```

## Author

* **Mánu Fosela** - *Javascript Composer* - [manufosela](https://github.com/manufosela)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
