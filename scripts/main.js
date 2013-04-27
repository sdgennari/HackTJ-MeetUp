var map;
var geocoder;
var latLons;
var addresses;
var addressCount;

function initialize() {
    var mapCanvas = $( "#map_canvas" );
    
    //Make the geocoder
    geocoder = new google.maps.Geocoder();

    //Make the map
    initMap();

}


function addMarker(latLon) {
    var image = new google.maps.MarkerImage(
        'http://i.imgur.com/3YJ8z.png',
        new google.maps.Size(19,25),    // size of the image
        new google.maps.Point(0,0), // origin, in this case top-left corner
        new google.maps.Point(9, 25)    // anchor, i.e. the point half-way along the bottom of the image
    );

    

    var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: "Test",
          position: latLon
    });
}

function getLatLonFromAddresses() {
    //Get addresses from UI
    
    //Sample data
    addresses = new Array();
    latLons = new Array();
    addresses.push("2000 Hayes Street, San Francisco, CA");
    addresses.push("958 Filbert Street, San Francisco, CA");
    addresses.push("1511 3rd St, San Francisco, CA");
    addresses.push("132 Starview Way, San Francisco, CA");

    var request;
    addressCount=addresses.length;
    //Convert addresses to latLons
    for(var i=0; i<addresses.length; i++) {
        geocoder.geocode({ 'address': addresses[i] }, function (results, status) {
            //THIS GETS CALLED AFTER GEOCODE
            if (status == google.maps.GeocoderStatus.OK) {
                //Get the latLon from the results
                latLons.push( results[0].geometry.location );
                addMarker( results[0].geometry.location );
                addressCount--;
                if(addressCount==0) {
                    calcCenter();
                }
            }
        });
    }
}

function calcCenter() {
    var totalLat = 0;
    var totalLon = 0;
    
    for(var i=0; i<latLons.length; i++) {
        totalLat = latLons[i].lat() + totalLat;
        totalLon = latLons[i].lng() + totalLon;
    }
    var midpoint = new google.maps.LatLng( (totalLat/latLons.length), (totalLon/latLons.length));

    //Set map center
    map.setCenter(midpoint);

    var circle = new google.maps.Circle({
        map: map,
        center: midpoint,
        fillColor: "#00FF00",
        fillOpacity: 0.4,
        strokeColor: "#00FF00",

        strokeOpacity: 1.0,
        strokeWeight: 3,
        radius: (1000)
    });
}

function initMap() {
    //var latLon = new google.maps.LatLng(37.7750, -122.4183);
    var latLon = new google.maps.LatLng(0.0, 0.0);
    var mapOptions = {
      center: latLon,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    getLatLonFromAddresses();
    /*
    var circle = new google.maps.Circle({
        map: map,
        center: latLon,
        fillColor: "#00FF00",
        fillOpacity: 0.4,
        strokeColor: "#00FF00",
        strokeOpacity: 1.0,
        strokeWeight: 5,
        radius: (1000)
    });

    var request = {
        location: latLon,
        radius: 800,
        keyword: "bagel",
        types: ['food']
    };
      
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
    */
}

function callback(results, status) {
      if (status != google.maps.places.PlacesServiceStatus.OK) {
        return;
      } else {
        createMarkers(results);
      }
}

function createMarkers(places) {
      var bounds = new google.maps.LatLngBounds();

      for (var i = 0, place; place = places[i]; i++) {
        var image = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: place.name,
          position: place.geometry.location
        });
        
        bounds.extend(place.geometry.location);
      }
      map.fitBounds(bounds);
}
