/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
/* eslint-env browser */
(function() {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  }

  function formatQueryUrl(params) {
    var str = [];
    for (var p in params) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
    }
    return 'https://en.wikipedia.org/w/api.php?' + str.join('&');
  }

  function fetchJsonp(url) {
    return new Promise(function(resolve, reject) {
      var timeoutId;

      window.callback = function(response) {
        resolve(response);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        delete window.callback;
        document.body.removeChild(document.getElementById('jsonpScript'));
      };

      var jsonpScript = document.createElement('script');
      jsonpScript.setAttribute('src', url);
      jsonpScript.id = 'jsonpScript';
      document.body.appendChild(jsonpScript);

      timeoutId = setTimeout(function() {
        reject(new Error('JSONP request timed out'));
        delete window.callback;
        document.body.removeChild(document.getElementById('jsonpScript'));
      }, 5000);
    });
  }

  // Logic from http://www.movable-type.co.uk/scripts/latlong.html
  function formatDistance(p1, p2) {
    const EARTH_RADIUS = 6371 * 1000;

    function toRadians(n) {
      return n * Math.PI / 180;
    }

    var lat1 = toRadians(p1.lat);
    var lat2 = toRadians(p2.lat);
    var dlat = toRadians(p2.lat - p1.lat);
    var dlon = toRadians(p2.lon - p1.lon);

    var a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dlon/2) * Math.sin(dlon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // Round to the nearest meter
    var d = Math.round(EARTH_RADIUS * c);
    return d + ' m';
  }

  const DEFAULT_IMAGE = 'https://bits.wikimedia.org/apple-touch/wikipedia.png';

  function getNearbyItems() {
    window.navigator.geolocation.getCurrentPosition(function(location){
      var userPoint = {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };

      var params = {
        action: 'query',
        format: 'json',
        colimit: 'max',
        prop: 'pageimages|coordinates',
        pithumbsize: 180,
        pilimit: 50,
        generator: 'geosearch',
        ggsradius: 10000,
        ggsnamespace: 0,
        ggslimit: 50,
        ggscoord: userPoint.lat + '|' + userPoint.lon,
        callback: 'callback' /* Used for JSONP response */
      };

      var queryUrl = formatQueryUrl(params);
      fetchJsonp(queryUrl).then(function(response) {
        var pages = response.query.pages;
        for (var p in pages) {
          var page = pages[p];
          var url = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title);
          var title = page.title;
          var imageUrl = page.thumbnail ? page.thumbnail.source : DEFAULT_IMAGE;
          var distance = formatDistance(userPoint, page.coordinates[0]);

          var t = document.getElementById('item');
          t.content.querySelector('img').src = imageUrl;
          t.content.querySelector('.title').textContent = title;
          t.content.querySelector('.link').href = url;
          //t.content.querySelector('.summary').textContent = distance;

          var content = document.getElementById('content');
          var clone = document.importNode(t.content, true);
          content.appendChild(clone);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    getNearbyItems();
  });

})();
