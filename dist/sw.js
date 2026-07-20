/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-cdaecb76'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "placeholder.svg",
    "revision": "35707bd9960ba5281c72af927b79291f"
  }, {
    "url": "placeholder-logo.svg",
    "revision": "1e16dc7df824652c5906a2ab44aef78c"
  }, {
    "url": "offline.html",
    "revision": "9d7d8bc496ed8da65991776682a74766"
  }, {
    "url": "logoWhite.png",
    "revision": "8258216f944b846a721247bc2ba8dab9"
  }, {
    "url": "index.html",
    "revision": "f985ede9544574d11c75f2157bf8d949"
  }, {
    "url": "LogoSideBar.png",
    "revision": "3968556af110f40e84ffb62ee52b7534"
  }, {
    "url": "LogoIcon.png",
    "revision": "8c662219aa4b497e03173ff981bb3a01"
  }, {
    "url": "LogoBlack.png",
    "revision": "250eab233af51eac7f4cc4c775f10500"
  }, {
    "url": "icons/maskable-512x512.png",
    "revision": "193c49e38eecf6653d2e25d121b7de9e"
  }, {
    "url": "icons/maskable-192x192.png",
    "revision": "186d1784d98b8ec1eb24d89032485324"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "d592e397dc67b31c0854d099ce8a99c2"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "0ff90bb73eb1722c50749b6cca3058ec"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "2635e00c5a2ecc78262f1d7b055e49a2"
  }, {
    "url": "fonts/Inter-SemiBold.woff",
    "revision": "d5ec4ca8c2810c1161e084c47840ff8e"
  }, {
    "url": "fonts/Inter-Regular.woff",
    "revision": "35827309b4b308529467597eb8811ea9"
  }, {
    "url": "fonts/Inter-Bold.woff",
    "revision": "4025e89765a4136dccab10c1bc138d87"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-CPCfC9vM.css",
    "revision": null
  }, {
    "url": "assets/index-BRcjuBij.js",
    "revision": null
  }, {
    "url": "LogoIcon.png",
    "revision": "8c662219aa4b497e03173ff981bb3a01"
  }, {
    "url": "offline.html",
    "revision": "9d7d8bc496ed8da65991776682a74766"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "2635e00c5a2ecc78262f1d7b055e49a2"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "0ff90bb73eb1722c50749b6cca3058ec"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "d592e397dc67b31c0854d099ce8a99c2"
  }, {
    "url": "icons/maskable-192x192.png",
    "revision": "186d1784d98b8ec1eb24d89032485324"
  }, {
    "url": "icons/maskable-512x512.png",
    "revision": "193c49e38eecf6653d2e25d121b7de9e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f938058b956e9401fefd5ea3b84e96b4"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/]
  }));
  workbox.registerRoute(({
    request
  }) => request.destination === "image", new workbox.CacheFirst({
    "cacheName": "images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 80,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => request.destination === "font" || /\.(?:woff2?|ttf|otf)$/i.test(request.url), new workbox.CacheFirst({
    "cacheName": "fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');

}));
